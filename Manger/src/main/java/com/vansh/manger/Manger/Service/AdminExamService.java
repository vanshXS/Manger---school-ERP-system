package com.vansh.manger.Manger.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.DTO.ExamRequestDTO;
import com.vansh.manger.Manger.DTO.ExamResponseDTO;
import com.vansh.manger.Manger.Entity.AcademicYear;
import com.vansh.manger.Manger.Entity.Classroom;
import com.vansh.manger.Manger.Entity.Enrollment;
import com.vansh.manger.Manger.Entity.Exam;
import com.vansh.manger.Manger.Entity.ExamStatus;
import com.vansh.manger.Manger.Entity.ExamSubject;
import com.vansh.manger.Manger.Entity.School;
import com.vansh.manger.Manger.Entity.StudentSubjectMarks;
import com.vansh.manger.Manger.Entity.TeacherAssignment;
import com.vansh.manger.Manger.Repository.AcademicYearRepository;
import com.vansh.manger.Manger.Repository.ClassroomRespository;
import com.vansh.manger.Manger.Repository.EnrollmentRepository;
import com.vansh.manger.Manger.Repository.ExamRepository;
import com.vansh.manger.Manger.Repository.ExamSubjectRepository;
import com.vansh.manger.Manger.Repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.Repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.util.AdminSchoolConfig;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminExamService {

        private final ExamRepository examRepository;
        private final ExamSubjectRepository examSubjectRepository;
        private final ClassroomRespository classroomRespository;
        private final TeacherAssignmentRepository teacherAssignmentRepository;
        private final AcademicYearRepository academicYearRepository;
        private final StudentSubjectMarksRepository marksRepository;
        private final EnrollmentRepository enrollmentRepository;
        private final AdminSchoolConfig adminSchoolConfig;
        private final ActivityLogService activityLogService;

        // ─── HELPER: Map entity → DTO ─────────────────────────────────────────────
        public ExamResponseDTO mapToResponse(Exam exam) {
                Classroom c = exam.getClassroom();
                String classroomName = (c.getGradeLevel() != null && c.getSection() != null)
                                ? c.getGradeLevel().getDisplayName() + " - " + c.getSection().toUpperCase()
                                : c.getSection().toUpperCase();

                return ExamResponseDTO.builder()
                                .id(exam.getId())
                                .name(exam.getName())
                                .examType(exam.getExamType())
                                .status(exam.getStatus())
                                .startDate(exam.getStartDate())
                                .endDate(exam.getEndDate())
                                .totalMarks(exam.getTotalMarks())
                                .description(exam.getDescription())
                                .classroomId(c.getId())
                                .classroomName(classroomName)
                                .academicYearId(exam.getAcademicYear().getId())
                                .academicYearName(exam.getAcademicYear().getName())
                                .createdAt(exam.getCreatedAt())
                                .subjectCount((int) examSubjectRepository.countByExam_Id(exam.getId()))
                                .totalStudents(null)
                                .marksEnteredCount(null)
                                .classAverage(null)
                                .passCount(null)
                                .failCount(null)
                                .build();
        }

        // ─── HELPER: Map entity → DTO WITH stats ─────────────────────────────────
        public ExamResponseDTO mapToResponseWithStats(Exam exam) {
                ExamResponseDTO dto = mapToResponse(exam);

                // Total students enrolled in this exam's classroom for its academic year
                List<Enrollment> enrollments = enrollmentRepository
                                .findByClassroomAndAcademicYear(exam.getClassroom(), exam.getAcademicYear());
                int totalStudents = enrollments.size();
                dto.setTotalStudents(totalStudents);

                if (totalStudents == 0) {
                        dto.setMarksEnteredCount(0);
                        dto.setClassAverage(0.0);
                        dto.setPassCount(0);
                        dto.setFailCount(0);
                        return dto;
                }

                // Marks entered = students who have at least one mark for this exam name
                List<StudentSubjectMarks> allMarks = marksRepository.findByExamName(exam.getName());

                // Filter only students enrolled in this classroom+year
                List<Long> enrolledStudentIds = enrollments.stream()
                                .map(e -> e.getStudent().getId())
                                .toList();

                List<StudentSubjectMarks> relevantMarks = allMarks.stream()
                                .filter(m -> enrolledStudentIds.contains(m.getStudent().getId()))
                                .toList();

                // Unique students with marks entered
                long studentsWithMarks = relevantMarks.stream()
                                .map(m -> m.getStudent().getId())
                                .distinct()
                                .count();
                dto.setMarksEnteredCount((int) studentsWithMarks);

                // Class average (across all marks entered)
                if (!relevantMarks.isEmpty()) {
                        double avg = relevantMarks.stream()
                                        .mapToDouble(m -> (m.getMarksObtained() / m.getTotalMarks()) * 100)
                                        .average()
                                        .orElse(0.0);
                        dto.setClassAverage(Math.round(avg * 100.0) / 100.0);

                        long passCount = relevantMarks.stream()
                                        .filter(m -> (m.getMarksObtained() / m.getTotalMarks()) * 100 >= 40.0)
                                        .map(m -> m.getStudent().getId())
                                        .distinct()
                                        .count();
                        dto.setPassCount((int) passCount);
                        dto.setFailCount((int) studentsWithMarks - (int) passCount);
                } else {
                        dto.setClassAverage(0.0);
                        dto.setPassCount(0);
                        dto.setFailCount(0);
                }

                return dto;
        }

        // ─── CREATE ───────────────────────────────────────────────────────────────
        @Transactional
        public ExamResponseDTO createExam(ExamRequestDTO dto) {
                School school = adminSchoolConfig.requireCurrentSchool();

                if (dto.getStartDate().isAfter(dto.getEndDate())) {
                        throw new IllegalArgumentException("Start date must be before end date.");
                }

                Classroom classroom = classroomRespository
                                .findByIdAndSchool_Id(dto.getClassroomId(), school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found in this school."));

                AcademicYear academicYear = academicYearRepository
                                .findByIdAndSchool_Id(dto.getAcademicYearId(), school.getId())
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Academic year not found in this school."));

                // Prevent duplicate exam name for same classroom + year
                if (examRepository.existsByNameIgnoreCaseAndClassroom_IdAndAcademicYear_IdAndSchool_Id(
                                dto.getName().trim(), dto.getClassroomId(), dto.getAcademicYearId(), school.getId())) {
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
                                .status(ExamStatus.UPCOMING)
                                .classroom(classroom)
                                .academicYear(academicYear)
                                .school(school)
                                .build();

                Exam saved = examRepository.save(exam);

                // ─── AUTO-CREATE SUBJECT PAPERS ───────────────────────────────────
                // Get all subjects assigned to this classroom via TeacherAssignment
                List<TeacherAssignment> assignments = teacherAssignmentRepository
                                .findByClassroomId(classroom.getId());

                // Determine which subjects to include
                List<Long> selectedIds = dto.getSubjectIds();
                List<TeacherAssignment> subjectsToAdd;

                if (selectedIds != null && !selectedIds.isEmpty()) {
                        // Only include subjects that admin selected AND are assigned to classroom
                        subjectsToAdd = assignments.stream()
                                        .filter(ta -> selectedIds.contains(ta.getSubject().getId()))
                                        .toList();
                } else {
                        // If no selection provided, include all classroom subjects
                        subjectsToAdd = assignments;
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
                return mapToResponse(saved);
        }

        // ─── BULK CREATE ──────────────────────────────────────────────────────────
        @Transactional
        public List<ExamResponseDTO> createBulkExams(ExamRequestDTO dto) {
                List<Long> classroomIds = dto.getClassroomIds();
                if (classroomIds == null || classroomIds.isEmpty()) {
                        throw new IllegalArgumentException("At least one classroom must be selected.");
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

        // ─── READ ALL ─────────────────────────────────────────────────────────────
        public List<ExamResponseDTO> getAllExams(Long academicYearId, Long classroomId, ExamStatus status) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
                return examRepository.findFiltered(schoolId, academicYearId, classroomId, status)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        // ─── READ ONE WITH STATS ──────────────────────────────────────────────────
        public ExamResponseDTO getExamById(Long examId) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
                return mapToResponseWithStats(exam);
        }

        // ─── UPDATE ───────────────────────────────────────────────────────────────
        @Transactional
        public ExamResponseDTO updateExam(Long examId, ExamRequestDTO dto) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

                if (exam.getStatus() == ExamStatus.COMPLETED) {
                        throw new IllegalStateException("Cannot edit a completed exam.");
                }

                if (dto.getStartDate().isAfter(dto.getEndDate())) {
                        throw new IllegalArgumentException("Start date must be before end date.");
                }

                String newName = dto.getName().trim();
                // Check duplicate only if name changed
                if (!exam.getName().equalsIgnoreCase(newName) &&
                                examRepository.existsByNameIgnoreCaseAndClassroom_IdAndAcademicYear_IdAndSchool_Id(
                                                newName, exam.getClassroom().getId(), exam.getAcademicYear().getId(),
                                                schoolId)) {
                        throw new IllegalArgumentException(
                                        "An exam named \"" + newName
                                                        + "\" already exists for this classroom and year.");
                }

                exam.setName(newName);
                exam.setExamType(dto.getExamType());
                exam.setStartDate(dto.getStartDate());
                exam.setEndDate(dto.getEndDate());
                exam.setTotalMarks(dto.getTotalMarks());
                exam.setDescription(dto.getDescription());

                Exam saved = examRepository.save(exam);
                activityLogService.logActivity("Updated exam: " + saved.getName(), "Exam Management");
                return mapToResponse(saved);
        }

        // ─── UPDATE STATUS ────────────────────────────────────────────────────────
        // State machine: UPCOMING → ONGOING → COMPLETED (no going back)
        @Transactional
        public ExamResponseDTO updateExamStatus(Long examId, ExamStatus newStatus) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

                ExamStatus current = exam.getStatus();

                // Enforce forward-only transitions
                boolean valid = (current == ExamStatus.UPCOMING && newStatus == ExamStatus.ONGOING)
                                || (current == ExamStatus.ONGOING && newStatus == ExamStatus.COMPLETED);

                if (!valid) {
                        throw new IllegalStateException(
                                        "Invalid status transition: " + current.getDisplayName() + " → "
                                                        + newStatus.getDisplayName()
                                                        + ". Only UPCOMING→ONGOING and ONGOING→COMPLETED are allowed.");
                }

                exam.setStatus(newStatus);
                Exam saved = examRepository.save(exam);
                log.info("Exam {} status changed: {} → {}", saved.getName(), current, newStatus);
                activityLogService.logActivity(
                                "Exam status changed: " + saved.getName() + " → " + newStatus.getDisplayName(),
                                "Exam Management");
                return mapToResponse(saved);
        }

        // ─── DELETE ───────────────────────────────────────────────────────────────
        @Transactional
        public void deleteExam(Long examId) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));

                if (exam.getStatus() == ExamStatus.COMPLETED) {
                        throw new IllegalStateException(
                                        "Cannot delete a completed exam. Completed exams are part of the academic record.");
                }

                if (exam.getStatus() == ExamStatus.ONGOING) {
                        throw new IllegalStateException(
                                        "Cannot delete a ongoing exam. Ongoing exams are part of the academic record.");
                }

                String name = exam.getName();
                examRepository.delete(exam);
                log.info("Deleted exam: {} (ID: {})", name, examId);
                activityLogService.logActivity("Deleted exam: " + name, "Exam Management");
        }
}
