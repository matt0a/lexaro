package com.lexaro.api.extract.ocr;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.*;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * AWS Textract OCR service supporting both sync and async operations.
 *
 * Sync mode (DetectDocumentText):
 * - For images and single-page documents
 * - Sends bytes directly to Textract
 *
 * Async mode (StartDocumentTextDetection):
 * - For multi-page PDFs
 * - Requires document to be staged in S3 first
 * - Uses TextractStagingService for S3 operations
 */
@Slf4j
public class TextractOcrService implements OcrService {

    private final TextractClient textract;
    private final TextractStagingService stagingService;
    private final long pollIntervalMs;
    private final long timeoutSeconds;

    /**
     * Create TextractOcrService.
     *
     * @param region         AWS region
     * @param stagingService S3 staging service (can be null if async not needed)
     * @param pollIntervalMs Polling interval for async jobs (ms)
     * @param timeoutSeconds Timeout for async jobs (seconds)
     * @param accessKey      AWS access key (optional, uses DefaultCredentialsProvider if blank)
     * @param secretKey      AWS secret key (optional, uses DefaultCredentialsProvider if blank)
     */
    public TextractOcrService(String region, TextractStagingService stagingService,
                               long pollIntervalMs, long timeoutSeconds,
                               String accessKey, String secretKey) {
        this.stagingService = stagingService;
        this.pollIntervalMs = pollIntervalMs;
        this.timeoutSeconds = timeoutSeconds;

        // Use static credentials if provided, otherwise fall back to DefaultCredentialsProvider
        AwsCredentialsProvider creds;
        if (notBlank(accessKey) && notBlank(secretKey)) {
            creds = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
            log.debug("Textract using static credentials");
        } else {
            creds = DefaultCredentialsProvider.create();
            log.debug("Textract using default credentials chain");
        }

        this.textract = TextractClient.builder()
                .region(Region.of(region))
                .credentialsProvider(creds)
                .build();

        log.info("TextractOcrService initialized: region={}, asyncEnabled={}, pollIntervalMs={}, timeoutSeconds={}",
                region, isAsyncEnabled(), pollIntervalMs, timeoutSeconds);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    /**
     * Check if async mode is available (staging bucket configured).
     */
    public boolean isAsyncEnabled() {
        return stagingService != null && stagingService.isEnabled();
    }

    // ==================== SYNC API (for images, single pages) ====================

    /**
     * Synchronous OCR using DetectDocumentText.
     * Converts BufferedImage to PNG bytes and sends to Textract.
     *
     * @param image The image to process
     * @param langs Ignored - Textract auto-detects language
     * @return Extracted text with lines separated by newlines, or empty string on failure
     */
    @Override
    public String ocr(BufferedImage image, String langs) {
        long t0 = System.nanoTime();
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream(64 * 1024);
            ImageIO.write(image, "png", baos);
            byte[] imageBytes = baos.toByteArray();

            return ocrFromBytes(imageBytes);
        } catch (Exception ex) {
            log.warn("Textract sync OCR failed: {}", ex.getMessage());
            return "";
        } finally {
            long tookMs = (System.nanoTime() - t0) / 1_000_000;
            log.debug("Textract sync OCR took {}ms", tookMs);
        }
    }

    /**
     * Sync OCR directly from image/single-page PDF bytes.
     *
     * @param imageBytes Raw bytes (PNG, JPEG, or single-page PDF)
     * @return Extracted text or empty string on failure
     */
    public String ocrFromBytes(byte[] imageBytes) {
        try {
            Document doc = Document.builder()
                    .bytes(SdkBytes.fromByteArray(imageBytes))
                    .build();

            DetectDocumentTextRequest request = DetectDocumentTextRequest.builder()
                    .document(doc)
                    .build();

            DetectDocumentTextResponse response = textract.detectDocumentText(request);

            String text = extractTextFromBlocks(response.blocks());

            log.debug("Textract sync: {} blocks, {} chars",
                    response.blocks().size(), text.length());

            return text;
        } catch (TextractException ex) {
            logTextractError("sync", ex);
            return "";
        }
    }

    // ==================== ASYNC API (for multi-page PDFs) ====================

    /**
     * Process a multi-page PDF using async Textract.
     * Stages the PDF to S3, starts async job, polls for completion, returns text.
     *
     * @param pdfBytes   PDF file bytes
     * @param documentId Unique identifier for staging (e.g., document ID or UUID)
     * @return Extracted text from all pages, or empty string on failure
     */
    public String ocrPdfAsync(byte[] pdfBytes, String documentId) {
        if (!isAsyncEnabled()) {
            log.warn("Async Textract not enabled (no staging bucket configured)");
            return "";
        }

        String stagingKey = documentId + "-" + UUID.randomUUID() + ".pdf";
        long startTime = System.currentTimeMillis();

        try {
            // 1. Upload PDF to staging bucket
            log.debug("Staging PDF for async Textract: key={}, size={}", stagingKey, pdfBytes.length);
            stagingService.upload(stagingKey, pdfBytes, "application/pdf");

            // 2. Start async text detection job
            String jobId = startAsyncTextDetection(stagingService.getBucket(), stagingService.getFullKey(stagingKey));

            // 3. Poll for completion and get results
            String text = waitForAsyncResult(jobId);

            long tookMs = System.currentTimeMillis() - startTime;
            log.info("Async Textract complete: jobId={}, chars={}, tookMs={}", jobId, text.length(), tookMs);

            return text;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Async Textract interrupted");
            return "";
        } catch (Exception e) {
            log.error("Async Textract failed: {}", e.getMessage(), e);
            return "";
        } finally {
            // 4. Cleanup staging object
            try {
                stagingService.delete(stagingKey);
            } catch (Exception e) {
                log.warn("Failed to cleanup staging object {}: {}", stagingKey, e.getMessage());
            }
        }
    }

    /**
     * Start an async text detection job for a document in S3.
     *
     * @param bucket S3 bucket name
     * @param key    S3 object key
     * @return Job ID for polling
     */
    public String startAsyncTextDetection(String bucket, String key) {
        log.debug("Starting async Textract job: bucket={}, key={}", bucket, key);

        S3Object s3Object = S3Object.builder()
                .bucket(bucket)
                .name(key)
                .build();

        DocumentLocation documentLocation = DocumentLocation.builder()
                .s3Object(s3Object)
                .build();

        StartDocumentTextDetectionRequest request = StartDocumentTextDetectionRequest.builder()
                .documentLocation(documentLocation)
                .build();

        StartDocumentTextDetectionResponse response = textract.startDocumentTextDetection(request);
        String jobId = response.jobId();

        log.info("Async Textract job started: jobId={}", jobId);
        return jobId;
    }

    /**
     * Poll for async job completion and retrieve all text.
     *
     * @param jobId Job ID from startAsyncTextDetection
     * @return Extracted text from all pages
     * @throws InterruptedException if polling is interrupted
     * @throws TextractException    if job fails
     */
    public String waitForAsyncResult(String jobId) throws InterruptedException {
        long startTime = System.currentTimeMillis();
        long timeoutMs = timeoutSeconds * 1000;

        while (true) {
            GetDocumentTextDetectionRequest request = GetDocumentTextDetectionRequest.builder()
                    .jobId(jobId)
                    .build();

            GetDocumentTextDetectionResponse response = textract.getDocumentTextDetection(request);
            JobStatus status = response.jobStatus();

            if (status == JobStatus.SUCCEEDED) {
                log.debug("Async Textract job {} succeeded", jobId);
                return extractAllPagesText(jobId, response);
            }

            if (status == JobStatus.FAILED) {
                String msg = response.statusMessage();
                log.error("Async Textract job {} failed: {}", jobId, msg);
                throw TextractException.builder()
                        .message("Textract job failed: " + msg)
                        .build();
            }

            // Check timeout
            long elapsed = System.currentTimeMillis() - startTime;
            if (elapsed >= timeoutMs) {
                log.error("Async Textract job {} timed out after {}ms", jobId, elapsed);
                throw TextractException.builder()
                        .message("Textract job timed out after " + timeoutSeconds + " seconds")
                        .build();
            }

            log.debug("Async Textract job {} status={}, waiting {}ms...", jobId, status, pollIntervalMs);
            Thread.sleep(pollIntervalMs);
        }
    }

    /**
     * Extract text from all pages of an async job result, handling pagination.
     */
    private String extractAllPagesText(String jobId, GetDocumentTextDetectionResponse firstResponse) {
        List<Block> allBlocks = new ArrayList<>(firstResponse.blocks());
        String nextToken = firstResponse.nextToken();

        // Paginate through remaining results
        while (nextToken != null) {
            GetDocumentTextDetectionRequest request = GetDocumentTextDetectionRequest.builder()
                    .jobId(jobId)
                    .nextToken(nextToken)
                    .build();

            GetDocumentTextDetectionResponse response = textract.getDocumentTextDetection(request);
            allBlocks.addAll(response.blocks());
            nextToken = response.nextToken();
        }

        return extractTextFromBlocks(allBlocks);
    }

    /**
     * Extract LINE text from blocks, preserving reading order.
     */
    private String extractTextFromBlocks(List<Block> blocks) {
        if (blocks == null) return "";

        return blocks.stream()
                .filter(block -> block.blockType() == BlockType.LINE)
                .map(Block::text)
                .collect(Collectors.joining("\n"));
    }

    private void logTextractError(String mode, TextractException ex) {
        String errorCode = ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorCode() : "unknown";
        String errorMsg = ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorMessage() : ex.getMessage();
        log.warn("Textract {} API error: {} (code={})", mode, errorMsg, errorCode);
    }

    @Override
    public String name() {
        return "textract";
    }

    @PreDestroy
    public void close() {
        try {
            textract.close();
            log.debug("TextractClient closed");
        } catch (Exception ignored) {
            // Ignore close errors
        }
    }
}
