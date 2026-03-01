package com.vansh.manger.Manger.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.DTO.ExamSubjectRequestDTO;
import com.vansh.manger.Manger.DTO.ExamSubjectResponseDTO;
import com.vansh.manger.Manger.Entity.Exam;
import com.vansh.manger.Manger.Entity.ExamStatus;
import com.vansh.manger.Manger.Entity.ExamSubject;
import com.vansh.manger.Manger.Entity.Subject;
import com.vansh.manger.Manger.Entity.TeacherAssignment;
import com.vansh.manger.Manger.Repository.ExamRepository;
import com.vansh.manger.Manger.Repository.ExamSubjectRepository;
import com.vansh.manger.Manger.Repository.SubjectRepository;
import com.vansh.manger.Manger.Repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.util.AdminSchoolConfig;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamSubjectService {

    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ActivityLogService activityLogService;

    // ─── HELPER: Map entity → DTO ─────────────────────────────────────────────
    public ExamSubjectResponseDTO mapToResponse(ExamSubject es) {
        Subject s = es.getSubject();
        return ExamSubjectResponseDTO.builder()
                .id(es.getId())
                .subjectId(s.getId())
                .subjectName(s.getName())
                .subjectCode(s.getCode())
                .examDate(es.getExamDate())
                .startTime(es.getStartTime())
                .endTime(es.getEndTime())
                .maxMarks(es.getMaxMarks())
                .marksEnteredCount(0) // will be populated in Phase 2
                .build();
    }

    // ─── LIST all subject papers for an exam ──────────────────────────────────
    public List<ExamSubjectResponseDTO> getSubjectsForExam(Long examId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        // Verify exam belongs to this school
        examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

        return examSubjectRepository.findByExam_IdOrderByExamDateAscStartTimeAsc(examId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── ADD a subject paper to an exam ───────────────────────────────────────
    @Transactional
    public ExamSubjectResponseDTO addSubjectToExam(Long examId, ExamSubjectRequestDTO dto) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

        if (exam.getStatus() == ExamStatus.COMPLETED) {
            throw new IllegalStateException("Cannot add subjects to a completed exam.");
        }

        // Validate subject exists in this school
        Subject subject = subjectRepository.findByIdAndSchool_Id(dto.getSubjectId(), schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Subject not found with ID: " + dto.getSubjectId()));

        // Validate subject is assigned to this classroom
        teacherAssignmentRepository.findByClassroomAndSubject(exam.getClassroom(), subject)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Subject \"" + subject.getName() + "\" is not assigned to this classroom."));

        // Check for duplicate
        if (examSubjectRepository.existsByExam_IdAndSubject_Id(examId, dto.getSubjectId())) {
            throw new IllegalArgumentException(
                    "Subject \"" + subject.getName() + "\" is already added to this exam.");
        }

        // Validate date is within exam date range
        if (dto.getExamDate().isBefore(exam.getStartDate()) || dto.getExamDate().isAfter(exam.getEndDate())) {
            throw new IllegalArgumentException(
                    "Exam date must be between " + exam.getStartDate() + " and " + exam.getEndDate() + ".");
        }

        // Validate start time < end time if both provided
        if (dto.getStartTime() != null && dto.getEndTime() != null
                && dto.getStartTime().isAfter(dto.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        ExamSubject examSubject = ExamSubject.builder()
                .exam(exam)
                .subject(subject)
                .examDate(dto.getExamDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .maxMarks(dto.getMaxMarks())
                .build();

        ExamSubject saved = examSubjectRepository.save(examSubject);
        log.info("Added subject paper: {} to exam: {} (ID: {})", subject.getName(), exam.getName(), saved.getId());
        activityLogService.logActivity(
                "Added " + subject.getName() + " paper to exam: " + exam.getName(),
                "Exam Management");

        return mapToResponse(saved);
    }

    // ─── UPDATE a subject paper ───────────────────────────────────────────────
    @Transactional
    public ExamSubjectResponseDTO updateSubjectPaper(Long examId, Long examSubjectId, ExamSubjectRequestDTO dto) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

        if (exam.getStatus() == ExamStatus.COMPLETED) {
            throw new IllegalStateException("Cannot edit subject papers of a completed exam.");
        }

        ExamSubject examSubject = examSubjectRepository.findByIdAndExam_Id(examSubjectId, examId)
                .orElseThrow(() -> new EntityNotFoundException("Subject paper not found with ID: " + examSubjectId));

        // Validate date is within exam date range
        if (dto.getExamDate().isBefore(exam.getStartDate()) || dto.getExamDate().isAfter(exam.getEndDate())) {
            throw new IllegalArgumentException(
                    "Exam date must be between " + exam.getStartDate() + " and " + exam.getEndDate() + ".");
        }

        // Validate start time < end time if both provided
        if (dto.getStartTime() != null && dto.getEndTime() != null
                && dto.getStartTime().isAfter(dto.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        examSubject.setExamDate(dto.getExamDate());
        examSubject.setStartTime(dto.getStartTime());
        examSubject.setEndTime(dto.getEndTime());
        examSubject.setMaxMarks(dto.getMaxMarks());

        ExamSubject saved = examSubjectRepository.save(examSubject);
        log.info("Updated subject paper ID: {} for exam: {}", examSubjectId, exam.getName());

        return mapToResponse(saved);
    }

    // ─── REMOVE a subject paper from an exam ──────────────────────────────────
    @Transactional
    public void removeSubjectFromExam(Long examId, Long examSubjectId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

        if (exam.getStatus() == ExamStatus.COMPLETED) {
            throw new IllegalStateException("Cannot remove subjects from a completed exam.");
        }

        ExamSubject examSubject = examSubjectRepository.findByIdAndExam_Id(examSubjectId, examId)
                .orElseThrow(() -> new EntityNotFoundException("Subject paper not found with ID: " + examSubjectId));

        String subjectName = examSubject.getSubject().getName();
        examSubjectRepository.delete(examSubject);
        log.info("Removed subject paper: {} from exam: {} (ID: {})", subjectName, exam.getName(), examSubjectId);
        activityLogService.logActivity(
                "Removed " + subjectName + " paper from exam: " + exam.getName(),
                "Exam Management");
    }

    // ─── GET available subjects for a classroom (not yet added to exam) ───────
    public List<ExamSubjectResponseDTO> getAvailableSubjects(Long examId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

        // Get all subjects assigned to this classroom via TeacherAssignment
        List<TeacherAssignment> assignments = teacherAssignmentRepository
                .findByClassroomId(exam.getClassroom().getId());

        // Get subjects already added to this exam
        List<Long> addedSubjectIds = examSubjectRepository.findByExam_IdOrderByExamDateAscStartTimeAsc(examId)
                .stream()
                .map(es -> es.getSubject().getId())
                .toList();

        // Return classroom subjects NOT yet added
        return assignments.stream()
                .filter(ta -> !addedSubjectIds.contains(ta.getSubject().getId()))
                .map(ta -> ExamSubjectResponseDTO.builder()
                        .subjectId(ta.getSubject().getId())
                        .subjectName(ta.getSubject().getName())
                        .subjectCode(ta.getSubject().getCode())
                        .build())
                .collect(Collectors.toList());
    }
}
