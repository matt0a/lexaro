package com.lexaro.api.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

/**
 * Resend email provider implementation.
 * Sends transactional emails via Resend's HTTP API.
 * Activated when app.mail.provider=resend.
 */
@Slf4j
public class ResendMailService implements MailService {

    private static final String RESEND_API_URL = "https://api.resend.com";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final WebClient webClient;
    private final String from;
    private final String fromName;

    /**
     * Creates a new ResendMailService instance.
     *
     * @param apiKey   Resend API key for authentication
     * @param from     The sender email address
     * @param fromName The sender display name (optional)
     */
    public ResendMailService(String apiKey, String from, String fromName) {
        this.from = from;
        this.fromName = fromName;
        this.webClient = WebClient.builder()
                .baseUrl(RESEND_API_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("ResendMailService initialized with from={}", from);
    }

    /**
     * Sends an email using the Resend API.
     *
     * @param to        Recipient email address
     * @param subject   Email subject line
     * @param textBody  Plain text version of the email body
     * @param htmlBody  HTML version of the email body
     * @throws RuntimeException if the email fails to send
     */
    @Override
    public void send(String to, String subject, String textBody, String htmlBody) {
        String fromAddress = buildFromAddress();
        var request = new ResendEmailRequest(fromAddress, to, subject, textBody, htmlBody);

        try {
            var response = webClient.post()
                    .uri("/emails")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ResendEmailResponse.class)
                    .timeout(TIMEOUT)
                    .block();

            if (response != null && response.id() != null) {
                log.info("Resend email sent: id={} to={}", response.id(), to);
            }
        } catch (WebClientResponseException e) {
            log.error("Resend API error: status={} to={} body={}",
                    e.getStatusCode().value(), to, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to send email via Resend (status=" + e.getStatusCode().value() + ")");
        } catch (Exception e) {
            log.error("Resend email failed to={}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email via Resend");
        }
    }

    /**
     * Builds the formatted "from" address including display name if configured.
     * Handles cases where the from address already includes angle brackets.
     *
     * @return Formatted from address (e.g., "Lexaro <no-reply@lexaro.org>")
     */
    private String buildFromAddress() {
        // If already formatted with angle brackets, return as-is
        if (from.contains("<") && from.contains(">")) {
            return from;
        }
        // Add display name if provided
        if (fromName != null && !fromName.isBlank()) {
            return fromName + " <" + from + ">";
        }
        // Return plain email address
        return from;
    }

    /**
     * Request payload for Resend /emails endpoint.
     */
    private record ResendEmailRequest(String from, String to, String subject, String text, String html) {}

    /**
     * Response from Resend /emails endpoint.
     */
    private record ResendEmailResponse(String id) {}

    /**
     * Factory method to create a ResendMailService with validation.
     *
     * @param apiKey   Resend API key (required)
     * @param from     Sender email address (required)
     * @param fromName Sender display name (optional)
     * @return Configured ResendMailService instance
     * @throws IllegalArgumentException if required parameters are missing
     */
    public static ResendMailService create(String apiKey, String from, String fromName) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("Resend API key is required");
        }
        if (from == null || from.isBlank()) {
            throw new IllegalArgumentException("From email address is required");
        }
        return new ResendMailService(apiKey, from, fromName);
    }
}
