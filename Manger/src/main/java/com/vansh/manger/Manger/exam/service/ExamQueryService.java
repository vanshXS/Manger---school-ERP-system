package com.vansh.manger.Manger.exam.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.mapper.ExamResponseMapper;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles read-only exam query operations.
 * Listing with filters and fetching individual exam details with statistics.
 *
 * DIP: Depends on ExamResponseMapper for DTO conversion, ExamStatusResolver for status sync.
 */
@Service
@RequiredArgsConstructor
public class ExamQueryService implements ExamQueryOperations {

    private final ExamRepository examRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ExamStatusResolver examStatusResolver;
    private final ExamResponseMapper examResponseMapper;

    @Override
    public List<ExamResponseDTO> getAllExams(Long academicYearId, Long classroomId, ExamStatus status) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        examRepository.findBySchool_IdOrderByStartDateDesc(schoolId).forEach(this::synchronizeExamStatus);
        return examRepository.findFiltered(schoolId, academicYearId, classroomId, status)
                .stream()
                .map(examResponseMapper::toBasicDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ExamResponseDTO getExamById(Long examId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
        exam = synchronizeExamStatus(exam);
        return examResponseMapper.toDTOWithStats(exam);
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
