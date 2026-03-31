package com.vansh.manger.Manger.exam.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.exam.dto.ExamRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamSubject;
import com.vansh.manger.Manger.exam.mapper.ExamResponseMapper;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;
import com.vansh.manger.Manger.exam.util.ExamValidator;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SRP: Handles exam creation, bulk creation, update, and deletion only.
 * Validation delegated to ExamValidator, mapping to ExamResponseMapper,
 * status resolution to ExamStatusResolver.
 *
 * DIP: Depends on injected abstractions for validation, mapping, and status.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExamCrudService implements ExamCrudOperations {

    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final ClassroomRespository classroomRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ActivityLogService activityLogService;
    private final ExamStatusResolver examStatusResolver;
    private final ExamValidator examValidator;
    private final ExamResponseMapper examResponseMapper;

    @Override
    @Transactional
    public ExamResponseDTO createExam(ExamRequestDTO dto) {
        School school = adminSchoolConfig.requireCurrentSchool();
        examValidator.validateRequest(dto);

        AcademicYear academicYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Academic year not found in this school."));

        if (dto.getAcademicYearId() != null && !academicYear.getId().equals(dto.getAcademicYearId())) {
            throw new IllegalArgumentException("Exams can only be created in the current academic year.");
        }

        if (dto.getStartDate().isBefore(academicYear.getStartDate())
                || dto.getEndDate().isAfter(academicYear.getEndDate())) {
            throw new IllegalArgumentException("Exam date must be within academic year.");
        }

        Classroom classroom = classroomRespository
                .findByIdAndSchool_Id(dto.getClassroomId(), school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found in this school."));

        if (examRepository.existsByNameIgnoreCaseAndClassroom_IdAndAcademicYear_IdAndSchool_Id(
                dto.getName().trim(), dto.getClassroomId(), academicYear.getId(), school.getId())) {
            throw new IllegalArgumentException(
                    "An exam named \"" + dto.getName()
                            + "\" already exists for this classroom and academic year.");
        }

        Exam exam = Exam.builder()
                .name(dto.getName().trim())
                .examType(dto.getExamType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .totalMarks(dto.getTotalMarks())
                .description(dto.getDescription())
                .status(examStatusResolver.resolve(dto.getStartDate(), dto.getEndDate(), null))
                .classroom(classroom)
                .academicYear(academicYear)
                .school(school)
                .build();

        Exam saved = examRepository.save(exam);

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByClassroomId(classroom.getId());
        List<Long> selectedIds = dto.getSubjectIds();
        List<TeacherAssignment> subjectsToAdd;

        if (selectedIds != null && !selectedIds.isEmpty()) {
            Set<Long> assignedSubjectIds = assignments.stream()
                    .map(ta -> ta.getSubject().getId())
                    .collect(Collectors.toSet());
            List<Long> invalidSubjectIds = selectedIds.stream()
                    .filter(subjectId -> !assignedSubjectIds.contains(subjectId))
                    .distinct()
                    .toList();
            if (!invalidSubjectIds.isEmpty()) {
                throw new IllegalArgumentException(
                        "Selected subjects are not assigned to this classroom: " + invalidSubjectIds);
            }
            subjectsToAdd = assignments.stream()
                    .filter(ta -> selectedIds.contains(ta.getSubject().getId()))
                    .toList();
        } else {
            subjectsToAdd = assignments;
        }

        if (subjectsToAdd.isEmpty()) {
            throw new IllegalStateException("No subjects are assigned to this classroom for the exam.");
        }

        for (TeacherAssignment ta : subjectsToAdd) {
            ExamSubject examSubject = ExamSubject.builder()
                    .exam(saved)
                    .subject(ta.getSubject())
                    .examDate(saved.getStartDate())
                    .maxMarks(saved.getTotalMarks())
                    .build();
            examSubjectRepository.save(examSubject);
        }

        log.info("Created exam: {} with {} subject papers for classroom {} (ID: {})",
                saved.getName(), subjectsToAdd.size(), classroom.getSection(), saved.getId());
        activityLogService.logActivity(
                "Created exam: " + saved.getName() + " with " + subjectsToAdd.size()
                        + " subjects for " + classroom.getSection(),
                "Exam Management");
        return examResponseMapper.toBasicDTO(saved);
    }

    @Override
    @Transactional
    public List<ExamResponseDTO> createBulkExams(ExamRequestDTO dto) {
        List<Long> classroomIds = dto.getClassroomIds();
        if (classroomIds == null || classroomIds.isEmpty()) {
            throw new IllegalArgumentException("At least one classroom must be selected.");
        }
        if (new HashSet<>(classroomIds).size() != classroomIds.size()) {
            throw new IllegalArgumentException("Duplicate classrooms are not allowed in bulk exam creation.");
        }

        List<ExamResponseDTO> results = new java.util.ArrayList<>();
        for (Long classroomId : classroomIds) {
            ExamRequestDTO singleDto = ExamRequestDTO.builder()
                    .name(dto.getName())
                    .examType(dto.getExamType())
                    .startDate(dto.getStartDate())
                    .endDate(dto.getEndDate())
                    .totalMarks(dto.getTotalMarks())
                    .description(dto.getDescription())
                    .classroomId(classroomId)
                    .academicYearId(dto.getAcademicYearId())
                    .subjectIds(dto.getSubjectIds())
                    .build();
            results.add(createExam(singleDto));
        }
        return results;
    }

    @Override
    @Transactional
    public ExamResponseDTO updateExam(Long examId, ExamRequestDTO dto) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        examValidator.validateRequest(dto);

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
        exam = synchronizeExamStatus(exam);

        if (exam.getStatus() == ExamStatus.COMPLETED) {
            throw new IllegalStateException("Cannot edit a completed exam.");
        }

        AcademicYear academicYear = exam.getAcademicYear();
        if (dto.getStartDate().isBefore(academicYear.getStartDate())
                || dto.getEndDate().isAfter(academicYear.getEndDate())) {
            throw new IllegalArgumentException("Exam date must be within academic year.");
        }

        String newName = dto.getName().trim();
        if (!exam.getName().equalsIgnoreCase(newName)
                && examRepository.existsByNameIgnoreCaseAndClassroom_IdAndAcademicYear_IdAndSchool_Id(
                        newName, exam.getClassroom().getId(), exam.getAcademicYear().getId(), schoolId)) {
            throw new IllegalArgumentException(
                    "An exam named \"" + newName + "\" already exists for this classroom and year.");
        }

        exam.setName(newName);
        exam.setExamType(dto.getExamType());
        exam.setStartDate(dto.getStartDate());
        exam.setEndDate(dto.getEndDate());
        exam.setTotalMarks(dto.getTotalMarks());
        exam.setDescription(dto.getDescription());
        exam.setStatus(examStatusResolver.resolve(dto.getStartDate(), dto.getEndDate(), null));

        Exam saved = examRepository.save(exam);
        activityLogService.logActivity("Updated exam: " + saved.getName(), "Exam Management");
        return examResponseMapper.toBasicDTO(saved);
    }

    @Override
    @Transactional
    public void deleteExam(Long examId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
        exam = synchronizeExamStatus(exam);

        if (exam.getStatus() == ExamStatus.COMPLETED) {
            throw new IllegalStateException("Cannot delete a completed exam. Completed exams are part of the academic record.");
        }
        if (exam.getStatus() == ExamStatus.ONGOING) {
            throw new IllegalStateException("Cannot delete a ongoing exam. Ongoing exams are part of the academic record.");
        }

        String name = exam.getName();
        examRepository.delete(exam);
        log.info("Deleted exam: {} (ID: {})", name, examId);
        activityLogService.logActivity("Deleted exam: " + name, "Exam Management");
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
