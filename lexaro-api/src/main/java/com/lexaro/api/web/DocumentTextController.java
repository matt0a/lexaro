package com.lexaro.api.web;

import com.lexaro.api.service.DocumentTextService;
import com.lexaro.api.web.dto.DocumentTextResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/documents/{id}/text")
@RequiredArgsConstructor
public class DocumentTextController {

    private final DocumentTextService textSvc;

    private Long userId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No auth principal");
        }
        return (Long) auth.getPrincipal();
    }

    /**
     * Get extracted text (or extract if missing).
     *
     * @param maxPages Optional limit on pages to parse (0 = no page limit).
     * @param maxChars Optional preview cap on returned text (0 = return full text).
     */
    @GetMapping
    public DocumentTextResponse get(@PathVariable Long id,
                                    @RequestParam(defaultValue = "0") int maxPages,
                                    @RequestParam(defaultValue = "0") int maxChars) {
        // guard rails
        if (maxPages < 0)  maxPages = 0;
        if (maxChars < 0)  maxChars = 0;

        var t = textSvc.getOrExtract(userId(), id, maxPages);

        String text = t.getText() == null ? "" : t.getText();
        boolean truncated = false;

        if (maxChars > 0 && text.length() > maxChars) {
            text = text.substring(0, maxChars);
            truncated = true;
        }

        return new DocumentTextResponse(
                t.getDocId(),
                t.getMime(),
                t.getCharCount(),   // this remains the full char count from extraction
                truncated,
                t.getExtractedAt(),
                text
        );
    }
}
