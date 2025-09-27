package com.lexaro.api.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

/**
 * SMTP mailer (uses Spring's JavaMailSender).
 * Enabled when app.mail.provider=smtp (default off if you set "ses" instead).
 *
 * Required SMTP properties (example for Gmail/SendGrid/your SMTP):
 * spring.mail.host=...
 * spring.mail.port=587
 * spring.mail.username=...
 * spring.mail.password=...
 * spring.mail.properties.mail.smtp.auth=true
 * spring.mail.properties.mail.smtp.starttls.enable=true
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp")
public class SmtpMailService implements MailService {

    private final JavaMailSender sender;

    @Value("${app.mail.from:no-reply@lexaro}")
    private String from;

    @Value("${app.mail.fromName:Lexaro}")
    private String fromName;

    @Value("${app.mail.replyTo:}")
    private String replyTo;

    @Override
    public void send(String to, String subject, String textBody, String htmlBody) {
        try {
            MimeMessage mime = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");

            String personal = (fromName == null || fromName.isBlank()) ? null : fromName;
            if (personal != null) helper.setFrom(from, personal);
            else helper.setFrom(from);

            helper.setTo(to);
            helper.setSubject(subject);

            // If html provided, set both html and text alternative
            if (htmlBody != null && !htmlBody.isBlank()) {
                helper.setText(textBody == null ? "" : textBody, htmlBody);
            } else {
                helper.setText(textBody == null ? "" : textBody, false);
            }

            if (replyTo != null && !replyTo.isBlank()) helper.setReplyTo(replyTo);

            sender.send(mime);
            log.info("SMTP mail sent to {}", to);
        } catch (Exception ex) {
            log.error("SMTP send failed to {}: {}", to, ex.toString(), ex);
            throw new RuntimeException("Mail send failed", ex);
        }
    }
}
