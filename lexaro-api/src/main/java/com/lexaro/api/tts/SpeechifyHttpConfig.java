package com.lexaro.api.tts;

import io.netty.channel.socket.nio.NioDatagramChannel;
import io.netty.resolver.AddressResolverGroup;
import io.netty.resolver.dns.DnsAddressResolverGroup;
import io.netty.resolver.dns.SequentialDnsServerAddressStreamProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.net.InetSocketAddress;
import java.time.Duration;
@Configuration
public class SpeechifyHttpConfig {

    @Value("${app.tts.speechify.baseUrl:https://api.sws.speechify.com}")
    private String baseUrl;

    @Value("${app.tts.speechify.timeoutMs:90000}")
    private long timeoutMs;

    @Value("${app.http.proxy.host:}")
    private String proxyHost;

    @Value("${app.http.proxy.port:0}")
    private int proxyPort;

    @Bean(name = "speechifyWebClient")
    public WebClient speechifyWebClient(WebClient.Builder builder) {
        AddressResolverGroup<?> resolver = new DnsAddressResolverGroup(
                NioDatagramChannel.class,
                new SequentialDnsServerAddressStreamProvider(
                        new InetSocketAddress("1.1.1.1", 53),
                        new InetSocketAddress("8.8.8.8", 53)
                )
        );

        HttpClient http = HttpClient.create()
                .resolver(resolver)
                .compress(true)
                // NEW: connect + response timeouts from the same property
                .responseTimeout(Duration.ofMillis(timeoutMs))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) timeoutMs);

        if (proxyHost != null && !proxyHost.isBlank() && proxyPort > 0) {
            http = http.proxy(spec -> spec
                    .type(reactor.netty.transport.ProxyProvider.Proxy.HTTP)
                    .host(proxyHost)
                    .port(proxyPort));
        }

        return builder
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(http))
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                        .build())
                .build();
    }
}
