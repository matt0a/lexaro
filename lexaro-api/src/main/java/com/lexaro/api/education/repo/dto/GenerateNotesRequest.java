package com.lexaro.api.education.repo.dto;

/**
 * Request for generating notes from document content.
 *
 * @param style     note style: "outline", "cornell", "detailed", "summary" (default: "outline")
 * @param pageStart optional: only use content from this page onwards
 * @param pageEnd   optional: only use content up to this page
 */
public record GenerateNotesRequest(
        String style,
        Integer pageStart,
        Integer pageEnd
) {
    /**
     * Returns the style, defaulting to "outline" if not specified.
     */
    public String styleOrDefault() {
        if (style == null || style.isBlank()) return "outline";
        String s = style.toLowerCase().trim();
        // Validate style
        return switch (s) {
            case "outline", "cornell", "detailed", "summary" -> s;
            default -> "outline";
        };
    }
}
