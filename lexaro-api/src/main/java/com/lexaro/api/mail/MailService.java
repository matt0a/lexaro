package com.lexaro.api.mail;

public interface MailService {
    void send(String to, String subject, String textBody, String htmlBody);
}
