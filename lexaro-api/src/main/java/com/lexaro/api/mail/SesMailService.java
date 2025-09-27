package com.lexaro.api.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;

@Slf4j
@RequiredArgsConstructor
public class SesMailService implements MailService {

    private final SesV2Client ses;
    private final String from;

    @Override
    public void send(String to, String subject, String textBody, String htmlBody) {
        Destination dest = Destination.builder().toAddresses(to).build();

        Content subj = Content.builder().data(subject).build();
        Content text = Content.builder().data(textBody).build();
        Content html = Content.builder().data(htmlBody).build();

        Body body = Body.builder().text(text).html(html).build();
        Message msg = Message.builder().subject(subj).body(body).build();
        EmailContent content = EmailContent.builder().simple(msg).build();

        SendEmailRequest req = SendEmailRequest.builder()
                .fromEmailAddress(from)
                .destination(dest)
                .content(content)
                .build();
        SendEmailResponse res = ses.sendEmail(req);
        log.info("SES sent messageId={}", res.messageId());
    }

    /** Factory helper */
    public static SesMailService create(String region, String from,
                                        String accessKey, String secretKey) {
        AwsCredentialsProvider creds;
        if (accessKey != null && !accessKey.isBlank() && secretKey != null && !secretKey.isBlank()) {
            creds = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        } else {
            creds = DefaultCredentialsProvider.create(); // env/instance role
        }
        SesV2Client client = SesV2Client.builder()
                .region(Region.of(region))
                .credentialsProvider(creds)
                .build();
        return new SesMailService(client, from);
    }
}
