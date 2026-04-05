package com.vansh.manger.Manger.exam.service;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.mapper.ExamResponseMapper;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SRP: Handles exam status transitions only.
 * Contains the state-machine rules for manual exam completion.
 *
 * Business rules:
 *   - Only manual completion is allowed (ONGOING -> COMPLETED)
 *   - Cannot complete an UPCOMING exam
 *   - Cannot re-complete an already COMPLETED exam
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExamStatusService implements ExamStatusOperations {

    private final ExamRepository examRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ActivityLogService activityLogService;
    private final ExamStatusResolver examStatusResolver;
    private final ExamResponseMapper examResponseMapper;

    @Override
    @Transactional
    public ExamResponseDTO updateExamStatus(Long examId, ExamStatus newStatus) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
        exam = synchronizeExamStatus(exam);

        ExamStatus current = exam.getStatus();

        if (newStatus != ExamStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Upcoming and ongoing statuses are managed automatically from exam dates. "
                            + "Only manual completion is allowed.");
        }

        if (current == ExamStatus.UPCOMING) {
            throw new IllegalStateException(
                    "This exam has not started yet. Update the schedule if needed, or complete it after it becomes ongoing.");
        }

        if (current == ExamStatus.COMPLETED) {
            throw new IllegalStateException("This exam is already completed.");
        }

        exam.setStatus(ExamStatus.COMPLETED);
        Exam saved = examRepository.save(exam);
        log.info("Exam {} status changed: {} -> {}", saved.getName(), current, ExamStatus.COMPLETED);
        activityLogService.logActivity("Exam completed: " + saved.getName(), "Exam Management");
        return examResponseMapper.toBasicDTO(saved);
    }

    private Exam synchronizeExamStatus(Exam exam) {
        ExamStatus resolvedStatus = examStatusResolver.resolve(exam.getStartDate(), exam.getEndDate(), exam.getStatus());
        if (exam.getStatus() != resolvedStatus) {
            exam.setStatus(resolvedStatus);
            return examRepository.save(exam);
        }
        return exam;
    }
}
