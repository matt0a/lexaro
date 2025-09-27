package com.lexaro.api.mail;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LogMailService implements MailService {
    @Override
    public void send(String to, String subject, String textBody, String htmlBody) {
        log.info("📧 [LOG MAIL] to={} subject={}\nTEXT:\n{}\nHTML:\n{}",
                to, subject, textBody, htmlBody);
    }
}
