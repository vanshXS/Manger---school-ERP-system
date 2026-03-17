package com.vansh.manger.Manger.exam.service;

import java.time.LocalDate;
import java.util.List;
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
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

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

        public ExamResponseDTO mapToResponse(Exam exam) {
                exam = synchronizeExamStatus(exam);
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

        public ExamResponseDTO mapToResponseWithStats(Exam exam) {
                ExamResponseDTO dto = mapToResponse(exam);

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

                List<StudentSubjectMarks> allMarks = marksRepository.findByExamName(exam.getName());
                List<Long> enrolledStudentIds = enrollments.stream()
                                .map(e -> e.getStudent().getId())
                                .toList();

                List<StudentSubjectMarks> relevantMarks = allMarks.stream()
                                .filter(m -> enrolledStudentIds.contains(m.getEnrollment().getStudent().getId()))
                                .toList();

                long studentsWithMarks = relevantMarks.stream()
                                .map(m -> m.getEnrollment().getStudent().getId())
                                .distinct()
                                .count();
                dto.setMarksEnteredCount((int) studentsWithMarks);

                if (!relevantMarks.isEmpty()) {
                        double avg = relevantMarks.stream()
                                        .mapToDouble(m -> (m.getMarksObtained() / m.getTotalMarks()) * 100)
                                        .average()
                                        .orElse(0.0);
                        dto.setClassAverage(Math.round(avg * 100.0) / 100.0);

                        long passCount = relevantMarks.stream()
                                        .filter(m -> (m.getMarksObtained() / m.getTotalMarks()) * 100 >= 40.0)
                                        .map(m -> m.getEnrollment().getStudent().getId())
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

        @Transactional
        public ExamResponseDTO createExam(ExamRequestDTO dto) {
                School school = adminSchoolConfig.requireCurrentSchool();

                if (dto.getStartDate().isAfter(dto.getEndDate())) {
                        throw new IllegalArgumentException("Start date must be before end date.");
                }

                AcademicYear academicYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Academic year not found in this school."));

                if (dto.getStartDate().isBefore(academicYear.getStartDate())
                                || dto.getEndDate().isAfter(academicYear.getEndDate())) {
                        throw new IllegalArgumentException("Exam date must be within academic year.");
                }

                Classroom classroom = classroomRespository
                                .findByIdAndSchool_Id(dto.getClassroomId(), school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found in this school."));

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
                                .status(resolveExamStatus(dto.getStartDate(), dto.getEndDate(), null))
                                .classroom(classroom)
                                .academicYear(academicYear)
                                .school(school)
                                .build();

                Exam saved = examRepository.save(exam);

                List<TeacherAssignment> assignments = teacherAssignmentRepository
                                .findByClassroomId(classroom.getId());

                List<Long> selectedIds = dto.getSubjectIds();
                List<TeacherAssignment> subjectsToAdd;

                if (selectedIds != null && !selectedIds.isEmpty()) {
                        subjectsToAdd = assignments.stream()
                                        .filter(ta -> selectedIds.contains(ta.getSubject().getId()))
                                        .toList();
                } else {
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

        public List<ExamResponseDTO> getAllExams(Long academicYearId, Long classroomId, ExamStatus status) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
                examRepository.findBySchool_IdOrderByStartDateDesc(schoolId).forEach(this::synchronizeExamStatus);
                return examRepository.findFiltered(schoolId, academicYearId, classroomId, status)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public ExamResponseDTO getExamById(Long examId) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
                exam = synchronizeExamStatus(exam);
                return mapToResponseWithStats(exam);
        }

        @Transactional
        public ExamResponseDTO updateExam(Long examId, ExamRequestDTO dto) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
                exam = synchronizeExamStatus(exam);

                if (exam.getStatus() == ExamStatus.COMPLETED) {
                        throw new IllegalStateException("Cannot edit a completed exam.");
                }

                if (dto.getStartDate().isAfter(dto.getEndDate())) {
                        throw new IllegalArgumentException("Start date must be before end date.");
                }

                String newName = dto.getName().trim();
                if (!exam.getName().equalsIgnoreCase(newName)
                                && examRepository.existsByNameIgnoreCaseAndClassroom_IdAndAcademicYear_IdAndSchool_Id(
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
                exam.setStatus(resolveExamStatus(dto.getStartDate(), dto.getEndDate(), null));

                Exam saved = examRepository.save(exam);
                activityLogService.logActivity("Updated exam: " + saved.getName(), "Exam Management");
                return mapToResponse(saved);
        }

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
                return mapToResponse(saved);
        }

        @Transactional
        public void deleteExam(Long examId) {
                Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

                Exam exam = examRepository.findByIdAndSchool_Id(examId, schoolId)
                                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
                exam = synchronizeExamStatus(exam);

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

        private Exam synchronizeExamStatus(Exam exam) {
                ExamStatus resolvedStatus = resolveExamStatus(exam.getStartDate(), exam.getEndDate(), exam.getStatus());
                if (exam.getStatus() != resolvedStatus) {
                        exam.setStatus(resolvedStatus);
                        return examRepository.save(exam);
                }
                return exam;
        }

        private ExamStatus resolveExamStatus(LocalDate startDate, LocalDate endDate, ExamStatus currentStatus) {
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
}
