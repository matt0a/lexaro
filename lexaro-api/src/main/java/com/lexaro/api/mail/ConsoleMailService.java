package com.lexaro.api.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "console", matchIfMissing = true)
@Slf4j
@Primary
public class ConsoleMailService implements MailService {
    @Override
    public void send(String to, String subject, String textBody, String htmlBody) {
        log.info("[DEV MAIL] to={} subject={} text='{}' htmlLen={}",
                to, subject, textBody, (htmlBody == null ? 0 : htmlBody.length()));
    }
}
