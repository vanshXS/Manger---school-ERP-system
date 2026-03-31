package com.vansh.manger.Manger.exam.util;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.repository.ExamRepository;

import lombok.RequiredArgsConstructor;

/**
 * Resolves and synchronizes exam status based on calendar dates.
 *
 * <p><b>SRP</b> — single responsibility: exam-status lifecycle.
 * <b>DRY</b> — replaces identical resolveExamStatus() + synchronizeExamStatus()
 * private methods duplicated in AdminExamService, TeacherMarkService,
 * and TeacherDashboardService.</p>
 */
@Component
@RequiredArgsConstructor
public class ExamStatusResolver {

    private final ExamRepository examRepository;

    /**
     * Pure function — resolves what the status *should* be based on dates.
     * Does NOT modify the entity.
     */
    public ExamStatus resolve(LocalDate startDate, LocalDate endDate, ExamStatus currentStatus) {
        if (currentStatus == ExamStatus.COMPLETED) {
            return ExamStatus.COMPLETED;
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) {
            return ExamStatus.UPCOMING;
        }
        if (today.isAfter(endDate)) {
            return ExamStatus.COMPLETED;
        }
        return ExamStatus.ONGOING;
    }

    /**
     * Resolves the correct status and persists it if it has changed.
     *
     * @param exam The exam entity to synchronize.
     * @return The exam (possibly saved with updated status).
     */
    public Exam synchronize(Exam exam) {
        ExamStatus resolvedStatus = resolve(exam.getStartDate(), exam.getEndDate(), exam.getStatus());
        if (exam.getStatus() != resolvedStatus) {
            exam.setStatus(resolvedStatus);
            return examRepository.save(exam);
        }
        return exam;
    }
}
