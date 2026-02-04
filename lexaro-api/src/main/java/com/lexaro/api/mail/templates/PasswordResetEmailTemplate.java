package com.lexaro.api.mail.templates;

/**
 * Email template for password reset emails.
 * Provides professional HTML and plain text versions.
 */
public final class PasswordResetEmailTemplate {

    private PasswordResetEmailTemplate() {
        // Utility class - prevent instantiation
    }

    /**
     * Returns the email subject line.
     *
     * @param brandName The brand name to include
     * @return Email subject
     */
    public static String subject(String brandName) {
        return "Reset your " + brandName + " password";
    }

    /**
     * Returns the plain text email body.
     *
     * @param brandName      The brand name
     * @param resetUrl       The password reset URL
     * @param expiresMinutes Minutes until the link expires
     * @return Plain text email body
     */
    public static String textBody(String brandName, String resetUrl, long expiresMinutes) {
        return brandName + "\n\n"
                + "Reset your password\n\n"
                + "We received a request to reset the password for your account. "
                + "Click the link below to choose a new password.\n\n"
                + "Reset your password: " + resetUrl + "\n\n"
                + "This link expires in " + expiresMinutes + " minutes.\n\n"
                + "If you didn't request this, you can safely ignore this email. "
                + "Your password will remain unchanged.\n\n"
                + "---\n"
                + "© " + java.time.Year.now().getValue() + " " + brandName;
    }

    /**
     * Returns the HTML email body with professional styling.
     * Uses inline CSS and table layout for maximum email client compatibility.
     *
     * @param brandName      The brand name
     * @param resetUrl       The password reset URL
     * @param expiresMinutes Minutes until the link expires
     * @return HTML email body
     */
    public static String htmlBody(String brandName, String resetUrl, long expiresMinutes) {
        int year = java.time.Year.now().getValue();

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset your password</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="min-width: 100%%; background-color: #f4f4f5;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px; width: 100%%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 32px 40px 24px 40px;">
                                        <span style="font-size: 20px; font-weight: 700; color: #18181b; letter-spacing: -0.5px;">%s</span>
                                    </td>
                                </tr>

                                <!-- Main Content -->
                                <tr>
                                    <td style="padding: 0 40px;">
                                        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; line-height: 1.3;">Reset your password</h1>
                                        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.6;">
                                            We received a request to reset the password for your account. Click the button below to choose a new password.
                                        </p>
                                    </td>
                                </tr>

                                <!-- CTA Button -->
                                <tr>
                                    <td style="padding: 0 40px 24px 40px;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%%">
                                            <tr>
                                                <td align="center">
                                                    <a href="%s" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; text-align: center;">Reset Password</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Fallback Link -->
                                <tr>
                                    <td style="padding: 0 40px 24px 40px;">
                                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a; line-height: 1.5;">
                                            Or copy and paste this link into your browser:
                                        </p>
                                        <div style="padding: 12px 16px; background-color: #f4f4f5; border-radius: 6px; word-break: break-all;">
                                            <a href="%s" style="font-size: 14px; color: #4f46e5; text-decoration: none; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">%s</a>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Expiry Notice -->
                                <tr>
                                    <td style="padding: 0 40px 24px 40px;">
                                        <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5;">
                                            This link expires in <strong style="color: #52525b;">%d minutes</strong>.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Security Notice -->
                                <tr>
                                    <td style="padding: 0 40px 32px 40px;">
                                        <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">
                                            If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                                        <p style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                                            &copy; %d %s
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(brandName, resetUrl, resetUrl, resetUrl, expiresMinutes, year, brandName);
    }
}
