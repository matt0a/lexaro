package com.lexaro.api.education.service.impl;

import com.lexaro.api.domain.Document;
import com.lexaro.api.education.domain.StudyPlan;
import com.lexaro.api.education.domain.StudyTask;
import com.lexaro.api.education.repo.StudyPlanRepository;
import com.lexaro.api.education.repo.StudyTaskRepository;
import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.StudyPlanService;
import com.lexaro.api.repo.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Implementation of StudyPlanService.
 * Generates study plans with scheduled tasks based on exam date and available time.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudyPlanServiceImpl implements StudyPlanService {

    private final StudyPlanRepository planRepository;
    private final StudyTaskRepository taskRepository;
    private final DocumentRepository documentRepository;

    @Override
    @Transactional
    public StudyPlanDto createPlan(long userId, CreateStudyPlanRequest request) {
        // Validate request
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Plan title is required");
        }

        if (request.examDate() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Exam date is required");
        }

        if (request.examDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Exam date must be in the future");
        }

        // Get documents if specified
        List<Document> docs = new ArrayList<>();
        if (request.docIds() != null && !request.docIds().isEmpty()) {
            docs = documentRepository.findAllById(request.docIds()).stream()
                    .filter(d -> d.getUser().getId().equals(userId) && d.getDeletedAt() == null)
                    .toList();
        }

        // Create the plan
        StudyPlan plan = StudyPlan.builder()
                .userId(userId)
                .title(request.title())
                .description(request.description())
                .examDate(request.examDate())
                .weeklyHours(request.weeklyHoursOrDefault())
                .status("active")
                .build();

        // Generate tasks
        List<StudyTask> tasks = generateTasks(plan, docs, request.focusTopics());
        tasks.forEach(plan::addTask);

        plan = planRepository.save(plan);
        log.info("Created study plan {} with {} tasks for user {}", plan.getId(), tasks.size(), userId);

        return toDto(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudyPlanDto> getPlans(long userId) {
        return planRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StudyPlanDto getPlan(long userId, long planId) {
        StudyPlan plan = planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Study plan not found"));
        return toDto(plan);
    }

    @Override
    @Transactional
    public StudyTaskDto completeTask(long userId, long taskId) {
        StudyTask task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found"));

        task.setStatus("completed");
        task.setCompletedAt(Instant.now());
        task = taskRepository.save(task);

        log.info("Completed task {} for user {}", taskId, userId);
        return toTaskDto(task);
    }

    @Override
    @Transactional
    public StudyTaskDto skipTask(long userId, long taskId) {
        StudyTask task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found"));

        task.setStatus("skipped");
        task = taskRepository.save(task);

        log.info("Skipped task {} for user {}", taskId, userId);
        return toTaskDto(task);
    }

    @Override
    @Transactional
    public void deletePlan(long userId, long planId) {
        StudyPlan plan = planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Study plan not found"));
        planRepository.delete(plan);
        log.info("Deleted study plan {} for user {}", planId, userId);
    }

    // --- Task Generation Logic ---

    private List<StudyTask> generateTasks(StudyPlan plan, List<Document> docs, List<String> focusTopics) {
        List<StudyTask> tasks = new ArrayList<>();

        LocalDate startDate = LocalDate.now();
        LocalDate examDate = plan.getExamDate();
        long daysUntilExam = ChronoUnit.DAYS.between(startDate, examDate);

        if (daysUntilExam <= 0) {
            return tasks;
        }

        // Calculate sessions based on weekly hours
        int weeklyHours = plan.getWeeklyHours();
        int sessionsPerWeek = Math.max(2, weeklyHours / 2); // Assume ~2 hours per session
        int totalSessions = (int) Math.min(daysUntilExam, (daysUntilExam / 7 + 1) * sessionsPerWeek);

        // Task types to cycle through
        String[] taskTypes = {"reading", "flashcards", "quiz", "review", "notes"};
        int typeIndex = 0;

        // Distribute sessions across the study period
        int daysBetweenSessions = Math.max(1, (int) (daysUntilExam / totalSessions));

        LocalDate currentDate = startDate;
        int sessionCount = 0;

        while (currentDate.isBefore(examDate) && sessionCount < totalSessions) {
            String taskType = taskTypes[typeIndex % taskTypes.length];
            String title = generateTaskTitle(taskType, docs, sessionCount);
            String description = generateTaskDescription(taskType, focusTopics);

            // Assign to a document if available
            Long docId = null;
            if (!docs.isEmpty()) {
                docId = docs.get(sessionCount % docs.size()).getId();
            }

            StudyTask task = StudyTask.builder()
                    .taskType(taskType)
                    .title(title)
                    .description(description)
                    .docId(docId)
                    .scheduledDate(currentDate)
                    .durationMins(getDurationForType(taskType))
                    .status("pending")
                    .build();

            tasks.add(task);

            currentDate = currentDate.plusDays(daysBetweenSessions);
            typeIndex++;
            sessionCount++;
        }

        // Add final review session before exam
        if (examDate.minusDays(1).isAfter(LocalDate.now())) {
            StudyTask finalReview = StudyTask.builder()
                    .taskType("review")
                    .title("Final Review Session")
                    .description("Comprehensive review of all materials before the exam")
                    .scheduledDate(examDate.minusDays(1))
                    .durationMins(120)
                    .status("pending")
                    .build();
            tasks.add(finalReview);
        }

        return tasks;
    }

    private String generateTaskTitle(String taskType, List<Document> docs, int sessionNum) {
        return switch (taskType) {
            case "reading" -> "Reading Session #" + (sessionNum + 1);
            case "flashcards" -> "Flashcard Practice #" + (sessionNum + 1);
            case "quiz" -> "Quiz Practice #" + (sessionNum + 1);
            case "review" -> "Review Session #" + (sessionNum + 1);
            case "notes" -> "Note-Taking Session #" + (sessionNum + 1);
            default -> "Study Session #" + (sessionNum + 1);
        };
    }

    private String generateTaskDescription(String taskType, List<String> focusTopics) {
        String topicHint = "";
        if (focusTopics != null && !focusTopics.isEmpty()) {
            topicHint = " Focus on: " + String.join(", ", focusTopics) + ".";
        }

        return switch (taskType) {
            case "reading" -> "Read through the material and highlight key concepts." + topicHint;
            case "flashcards" -> "Study flashcards to reinforce memorization." + topicHint;
            case "quiz" -> "Take a practice quiz to test your understanding." + topicHint;
            case "review" -> "Review notes and previously covered material." + topicHint;
            case "notes" -> "Create detailed notes on the material." + topicHint;
            default -> "Complete this study session." + topicHint;
        };
    }

    private int getDurationForType(String taskType) {
        return switch (taskType) {
            case "reading" -> 45;
            case "flashcards" -> 20;
            case "quiz" -> 30;
            case "review" -> 60;
            case "notes" -> 40;
            default -> 30;
        };
    }

    // --- DTO Conversion ---

    private StudyPlanDto toDto(StudyPlan plan) {
        List<StudyTaskDto> taskDtos = plan.getTasks().stream()
                .map(this::toTaskDto)
                .collect(Collectors.toList());

        int completed = (int) plan.getTasks().stream()
                .filter(t -> "completed".equals(t.getStatus()))
                .count();

        return StudyPlanDto.builder()
                .id(plan.getId())
                .title(plan.getTitle())
                .description(plan.getDescription())
                .examDate(plan.getExamDate())
                .weeklyHours(plan.getWeeklyHours())
                .status(plan.getStatus())
                .tasks(taskDtos)
                .totalTasks(taskDtos.size())
                .completedTasks(completed)
                .createdAt(plan.getCreatedAt())
                .build();
    }

    private StudyTaskDto toTaskDto(StudyTask task) {
        return StudyTaskDto.builder()
                .id(task.getId())
                .docId(task.getDocId())
                .taskType(task.getTaskType())
                .title(task.getTitle())
                .description(task.getDescription())
                .scheduledDate(task.getScheduledDate())
                .durationMins(task.getDurationMins())
                .status(task.getStatus())
                .completedAt(task.getCompletedAt())
                .build();
    }
}
