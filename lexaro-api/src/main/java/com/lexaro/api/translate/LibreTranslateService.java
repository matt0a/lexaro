package com.lexaro.api.translate;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
public class LibreTranslateService implements TranslateService {

    private final String baseUrl;               // e.g. http://localhost:5000
    private final String apiKey;                // optional
    private final RestTemplate rt;
    private final long languagesTtlSeconds;

    // simple cached languages
    private final AtomicReference<List<Language>> cachedLangs = new AtomicReference<>(List.of());
    private volatile Instant langsFetchedAt = Instant.EPOCH;

    public LibreTranslateService(String baseUrl,
                                 String apiKey,
                                 int connectTimeoutMs,
                                 int readTimeoutMs,
                                 long languagesTtlSeconds) {
        this.baseUrl = stripTrailingSlash(baseUrl);
        this.apiKey = (apiKey == null ? "" : apiKey.trim());
        this.languagesTtlSeconds = languagesTtlSeconds <= 0 ? 3600 : languagesTtlSeconds;
        this.rt = buildRestTemplate(connectTimeoutMs, readTimeoutMs);
    }

    private static String stripTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    private static RestTemplate buildRestTemplate(int connectMs, int readMs) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        if (connectMs > 0) f.setConnectTimeout(connectMs);
        if (readMs > 0) f.setReadTimeout(readMs);
        return new RestTemplate(f);
    }

    @Override
    public String translate(String text, String source, String target) {
        if (text == null || text.isBlank()) return text;

        String src = (source == null || source.isBlank()) ? "auto" : source;
        String tgt = (target == null || target.isBlank()) ? "auto" : target;

        var form = new LinkedMultiValueMap<String, String>();
        form.add("q", text);
        form.add("source", src);
        form.add("target", tgt);
        form.add("format", "text"); // change to "html" if you ever send HTML
        if (!apiKey.isBlank()) form.add("api_key", apiKey);

        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        var req = new HttpEntity<>(form, headers);
        String url = baseUrl + "/translate";

        record Res(String translatedText) {}
        try {
            ResponseEntity<Res> res = rt.postForEntity(url, req, Res.class);
            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null || res.getBody().translatedText() == null) {
                log.warn("Translate failed status={} body={}", res.getStatusCode(), res.getBody());
                return text; // fallback to original
            }
            return res.getBody().translatedText();
        } catch (Exception ex) {
            log.warn("Translate request failed: {}", ex.toString());
            return text; // fallback to original
        }
    }

    @Override
    public List<Language> languages() {
        Instant now = Instant.now();
        if (now.isBefore(langsFetchedAt.plusSeconds(languagesTtlSeconds))) {
            return cachedLangs.get();
        }

        try {
            record LTLang(String code, String name) {}
            String url = baseUrl + "/languages";
            if (!apiKey.isBlank()) {
                url = url + (url.contains("?") ? "&" : "?") + "api_key=" + apiKey;
            }
            ResponseEntity<LTLang[]> res = rt.getForEntity(URI.create(url), LTLang[].class);
            if (res.getStatusCode().is2xxSuccessful() && res.getBody() != null) {
                List<Language> list = Arrays.stream(res.getBody())
                        .filter(Objects::nonNull)
                        .map(l -> new Language(l.code(), l.name()))
                        .sorted(Comparator.comparing(Language::name, String.CASE_INSENSITIVE_ORDER))
                        .toList();
                cachedLangs.set(list);
                langsFetchedAt = now;
                return list;
            }
        } catch (Exception ex) {
            log.warn("Fetch languages failed: {}", ex.toString());
        }
        return cachedLangs.get(); // possibly empty (cached or initial)
    }
}
