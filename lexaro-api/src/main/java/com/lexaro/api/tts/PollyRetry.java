package com.lexaro.api.tts;

import software.amazon.awssdk.core.exception.SdkServiceException;
import java.util.concurrent.ThreadLocalRandom;

public final class PollyRetry {
    public static <T> T runWithRetry(PollyCall<T> call) throws Exception {
        int attempts = 0;
        long base = 250; // ms
        while (true) {
            try {
                return call.run();
            } catch (SdkServiceException e) {
                int code = e.statusCode();
                boolean retryable = code == 429 || (code >= 500 && code < 600);
                attempts++;
                if (!retryable || attempts >= 3) throw e;
                long jitter = ThreadLocalRandom.current().nextLong(0, 150);
                long sleepMs = Math.min(4000, (long) (base * Math.pow(2, attempts - 1)) + jitter);
                Thread.sleep(sleepMs);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw ie;
            }
        }
    }
    @FunctionalInterface public interface PollyCall<T> { T run() throws Exception; }
}
