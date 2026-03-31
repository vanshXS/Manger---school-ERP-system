package com.vansh.manger.Manger.exam.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.academicyear.dto.AcademicYearDTO;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.dto.ExamSubjectResponseDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamSubject;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles teacher-facing exam listing and academic year queries.
 */
@Service
@RequiredArgsConstructor
public class TeacherExamQueryService implements TeacherExamQueryOperations {

    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final TeacherSchoolConfig schoolConfig;
    private final AcademicYearRepository academicYearRepository;
    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final ExamStatusResolver examStatusResolver;

    @Override
    @Transactional(readOnly = true)
    public List<AcademicYearDTO> getAcademicYears() {
        School currentSchool = schoolConfig.requireCurrentSchool();
        return academicYearRepository.findBySchool_IdOrderByStartDateDesc(currentSchool.getId()).stream()
                .map(year -> AcademicYearDTO.builder()
                        .id(year.getId())
                        .name(year.getName())
                        .startDate(year.getStartDate())
                        .endDate(year.getEndDate())
                        .isCurrent(Boolean.TRUE.equals(year.getIsCurrent()))
                        .closed(Boolean.TRUE.equals(year.getClosed()))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamResponseDTO> getAssignedExams(Long academicYearId, String status, Pageable pageable) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();

        AcademicYear academicYear = academicYearId != null
                ? academicYearRepository.findById(academicYearId)
                        .orElseThrow(() -> new RuntimeException("Year not found"))
                : academicYearRepository.findByIsCurrentAndSchool_Id(true, currentSchool.getId())
                        .orElseThrow(() -> new RuntimeException("Active academic year not found"));

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByTeacher(teacher);
        List<Long> classroomIds = assignments.stream()
                .map(a -> a.getClassroom().getId())
                .distinct()
                .collect(Collectors.toList());

        if (classroomIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<Exam> examsPage = examRepository.findByClassroomIdsAndAcademicYearAndStatusPaged(
                classroomIds, academicYear.getId(), status, currentSchool.getId(), pageable);

        List<ExamResponseDTO> dtos = examsPage.getContent().stream()
                .map(this::mapToExamResponseDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, examsPage.getTotalElements());
    }

    private ExamResponseDTO mapToExamResponseDTO(Exam exam) {
        exam = synchronizeExamStatus(exam);
        List<ExamSubject> examSubjects = examSubjectRepository.findByExam_IdOrderByExamDateAscStartTimeAsc(exam.getId());
        List<ExamSubjectResponseDTO> subjectDtos = examSubjects.stream()
                .map(es -> ExamSubjectResponseDTO.builder()
                        .id(es.getId())
                        .subjectId(es.getSubject().getId())
                        .subjectName(es.getSubject().getName())
                        .subjectCode(es.getSubject().getCode())
                        .examDate(es.getExamDate())
                        .startTime(es.getStartTime())
                        .endTime(es.getEndTime())
                        .maxMarks(es.getMaxMarks())
                        .build())
                .collect(Collectors.toList());

        return ExamResponseDTO.builder()
                .id(exam.getId())
                .name(exam.getName())
                .examType(exam.getExamType())
                .status(exam.getStatus())
                .startDate(exam.getStartDate())
                .endDate(exam.getEndDate())
                .totalMarks(exam.getTotalMarks())
                .description(exam.getDescription())
                .classroomId(exam.getClassroom().getId())
                .classroomName(exam.getClassroom().getGradeLevel() + " " + exam.getClassroom().getSection())
                .academicYearId(exam.getAcademicYear().getId())
                .academicYearName(exam.getAcademicYear().getName())
                .subjectCount(subjectDtos.size())
                .subjects(subjectDtos)
                .createdAt(exam.getCreatedAt())
                .build();
    }

    private Exam synchronizeExamStatus(Exam exam) {
        return examStatusResolver.synchronize(exam);
    }
}
