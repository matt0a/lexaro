package com.lexaro.api.education.repo.dto;

/**
 * Request for grading an essay.
 *
 * @param essay the essay text to grade (required)
 * @param topic optional essay prompt/topic for context
 */
public record EssayGradeRequest(
        String essay,
        String topic
) {
    /**
     * Returns the topic or a default message if not provided.
     */
    public String topicOrDefault() {
        return (topic != null && !topic.isBlank()) ? topic : "No specific topic provided";
    }
}
