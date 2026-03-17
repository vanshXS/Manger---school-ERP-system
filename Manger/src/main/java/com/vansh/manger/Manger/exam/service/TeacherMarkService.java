package com.vansh.manger.Manger.exam.service;

import java.util.ArrayList;
import java.util.Collections;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.exam.dto.BulkMarksRequestDTO;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.dto.ExamSubjectResponseDTO;
import com.vansh.manger.Manger.exam.dto.GradingSheetDTO;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.academicyear.dto.AcademicYearDTO;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamSubject;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailService;
import com.vansh.manger.Manger.common.service.PDFService;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;

import lombok.RequiredArgsConstructor;
import com.vansh.manger.Manger.exam.entity.Grade;

@Service
@RequiredArgsConstructor
public class TeacherMarkService {

    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final TeacherSchoolConfig schoolConfig;
    private final AcademicYearRepository academicYearRepository;
    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final EmailService emailService;
    private final PDFService pdfService;
    private final ActivityLogService activityLogService;

    private AcademicYear getCurrentAcademicYear(School school) {
        return academicYearRepository.findByIsCurrentAndSchool_Id(true, school.getId())
                .orElseThrow(() -> new RuntimeException("Active academic year not found"));
    }

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

    @Transactional(readOnly = true)
    public Page<ExamResponseDTO> getAssignedExams(Long academicYearId, String status, Pageable pageable) {

        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();

        AcademicYear academicYear = academicYearId != null
                ? academicYearRepository.findById(academicYearId)
                        .orElseThrow(() -> new RuntimeException("Year not found"))
                : getCurrentAcademicYear(currentSchool);

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByTeacherAndAcademicYear(teacher,
                academicYear);
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
        // Fetch subject papers for this exam
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

    @Transactional(readOnly = true)
    public GradingSheetDTO getGradingSheet(Long examId, Long subjectId) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();
        Exam exam = examRepository.findByIdAndSchool_Id(examId, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = synchronizeExamStatus(exam);

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, exam.getClassroom())) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        examSubjectRepository.findByExam_IdAndSubject_Id(examId, subjectId)
                .orElseThrow(() -> new RuntimeException("Subject is not part of this exam"));

        Classroom classroom = exam.getClassroom();
        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndAcademicYear(classroom,
                exam.getAcademicYear());

        List<GradingSheetDTO.StudentGradeRecord> students = enrollments.stream().map(enrollment -> {
            Student student = enrollment.getStudent();
            Optional<StudentSubjectMarks> markOpt = marksRepository.findByEnrollment_StudentAndSubjectAndExam_Id(student, subject,
                    examId);
            return GradingSheetDTO.StudentGradeRecord.builder()
                    .enrollmentId(enrollment.getId())
                    .studentName(student.getFirstName() + " " + student.getLastName())
                    .rollNo(enrollment.getRollNo())
                    .marksObtained(markOpt.map(StudentSubjectMarks::getMarksObtained).orElse(null))
                    .build();
        }).collect(Collectors.toList());

        long gradedCount = students.stream().filter(s -> s.getMarksObtained() != null).count();

        // Look up actual maxMarks from ExamSubject instead of hardcoding 100.0
        Double maxMarks = examSubjectRepository.findByExam_IdAndSubject_Id(examId, subjectId)
                .map(ExamSubject::getMaxMarks)
                .orElse(100.0);

        return GradingSheetDTO.builder()
                .examName(exam.getName())
                .subjectName(subject.getName())
                .classroomName(classroom.getGradeLevel() + " " + classroom.getSection())
                .examStatus(exam.getStatus().getDisplayName())
                .marksEditable(exam.getStatus() == ExamStatus.ONGOING)
                .marksheetAllowed(exam.getStatus() == ExamStatus.COMPLETED)
                .maxMarks(maxMarks)
                .totalStudents(students.size())
                .gradedCount((int) gradedCount)
                .students(students)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
        School currentSchool = schoolConfig.requireCurrentSchool();
        Student student = studentRepository.findById(studentId)
                .filter(s -> s.getSchool().getId().equals(currentSchool.getId()))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Fetch all marks for this student
        // In a real optimized scenario, we would paginate the distinct exams first.
        // For accurate mapping, fetch all marks and group by exam.
        List<StudentSubjectMarks> allMarks = marksRepository.findByEnrollment_StudentId(studentId);

        Map<String, List<StudentSubjectMarks>> marksByExam = allMarks.stream()
                .filter(m -> m.getExam().getName() != null)
                .collect(Collectors.groupingBy(ss -> ss.getExam().getName()));

        List<StudentExamResultDTO> allResults = marksByExam.entrySet().stream()
                .map(entry -> {
                    String examName = entry.getKey();
                    List<StudentSubjectMarks> marks = entry.getValue();
                    StudentSubjectMarks firstMark = marks.get(0);
                    var exam = synchronizeExamStatus(firstMark.getExam());

                    List<StudentExamResultDTO.SubjectMark> subjectMarks = marks.stream().map(m -> {
                        return StudentExamResultDTO.SubjectMark.builder()
                                .subjectName(m.getSubject().getName())
                                .marksObtained(m.getMarksObtained())
                                .maxMarks(m.getTotalMarks() != null ? m.getTotalMarks() : 100.0)
                                .grade(m.getGrade())
                                .build();
                    }).collect(Collectors.toList());

                    double totalObtained = subjectMarks.stream()
                            .mapToDouble(m -> m.getMarksObtained() != null ? m.getMarksObtained() : 0).sum();
                    double totalMax = subjectMarks.stream()
                            .mapToDouble(m -> m.getMaxMarks() != null ? m.getMaxMarks() : 100).sum();
                    double percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

                    return StudentExamResultDTO.builder()
                            .examId(exam.getId())
                            .examName(examName)
                            .examStatus(exam.getStatus() != null ? exam.getStatus().getDisplayName() : "Completed")
                            .academicYearName(
                                    exam.getAcademicYear() != null ? exam.getAcademicYear().getName() : null)
                            .examType(exam.getExamType() != null ? exam.getExamType().name() : null)
                            .classroomName(
                                    exam.getClassroom() != null
                                            ? exam.getClassroom().getGradeLevel().getDisplayName() + " - "
                                                    + exam.getClassroom().getSection()
                                            : null)
                            .totalObtained(totalObtained)
                            .totalMaxMarks(totalMax)
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .overallGrade(firstMark.getGrade())
                            .subjectMarks(subjectMarks)
                            .build();
                })
                .sorted((a, b) -> b.getExamId().compareTo(a.getExamId())) // sort descending by id
                .collect(Collectors.toList());

        // Manual Pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allResults.size());

        List<StudentExamResultDTO> pagedList;
        if (start > allResults.size()) {
            pagedList = new ArrayList<>();
        } else {
            pagedList = allResults.subList(start, end);
        }

        return new PageImpl<>(pagedList, pageable, allResults.size());
    }

    @Transactional
    public void saveBulkMarks(BulkMarksRequestDTO request) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();
        Exam exam = examRepository.findByIdAndSchool_Id(request.getExamId(), currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = synchronizeExamStatus(exam);

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, exam.getClassroom())) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        if (exam.getStatus() != ExamStatus.ONGOING) {
            throw new RuntimeException("Marks can only be entered while the exam is ongoing.");
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        ExamSubject examSubject = examSubjectRepository.findByExam_IdAndSubject_Id(exam.getId(), subject.getId())
                .orElseThrow(() -> new RuntimeException("Subject is not part of this exam"));

        double maxMarks = examSubject.getMaxMarks() != null ? examSubject.getMaxMarks() : 100.0;

        for (BulkMarksRequestDTO.StudentMarkInput markDto : request.getMarks()) {
            Enrollment enrollment = enrollmentRepository.findById(markDto.getEnrollmentId())
                    .orElseThrow(() -> new RuntimeException("Enrollment not found " + markDto.getEnrollmentId()));

            if (!enrollment.getClassroom().getId().equals(exam.getClassroom().getId())
                    || !enrollment.getAcademicYear().getId().equals(exam.getAcademicYear().getId())) {
                throw new RuntimeException("Enrollment does not belong to this exam");
            }

            Student student = enrollment.getStudent();
            Optional<StudentSubjectMarks> markOpt = marksRepository.findByEnrollment_StudentAndSubjectAndExam_Id(student, subject,
                    exam.getId());

            final Exam exam1 = exam;

            StudentSubjectMarks markEntity = markOpt.orElseGet(() -> {
                StudentSubjectMarks newMark = new StudentSubjectMarks();
                newMark.setEnrollment(enrollment);
                newMark.setSubject(subject);
                newMark.setExam(exam1);
                return newMark;
            });

            if (markDto.getMarksObtained() != null
                    && (markDto.getMarksObtained() < 0 || markDto.getMarksObtained() > maxMarks)) {
                throw new RuntimeException(
                        "Marks for " + student.getFirstName() + " " + student.getLastName()
                                + " must be between 0 and " + maxMarks);
            }

            markEntity.setMarksObtained(markDto.getMarksObtained());
            markEntity.setTotalMarks(maxMarks);

            // Recompute Grade using actual maxMarks from ExamSubject
            if (markDto.getMarksObtained() != null) {
                double pct = (markDto.getMarksObtained() / maxMarks) * 100;
                if (pct >= 90)
                    markEntity.setGrade("A+");
                else if (pct >= 80)
                    markEntity.setGrade("A");
                else if (pct >= 70)
                    markEntity.setGrade("B");
                else if (pct >= 60)
                    markEntity.setGrade("C");
                else if (pct >= 40)
                    markEntity.setGrade("D");
                else
                    markEntity.setGrade("F");
            } else {
                markEntity.setGrade(null);
            }

            marksRepository.save(markEntity);
        }
    }

    @Transactional
    public void sendMarksheet(Long examId, Long enrollmentId) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = synchronizeExamStatus(exam);

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .filter(e -> e.getStudent().getSchool().getId().equals(currentSchool.getId()))
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, exam.getClassroom())) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        if (!enrollment.getClassroom().getId().equals(exam.getClassroom().getId())) {
            throw new RuntimeException("Student is not enrolled in this exam's classroom");
        }

        if (exam.getStatus() != ExamStatus.COMPLETED) {
            throw new RuntimeException("Marksheets can only be sent after the exam is completed.");
        }

        List<StudentSubjectMarks> subjectRecords = marksRepository.findByEnrollment_StudentAndExam_Id(
                enrollment.getStudent(), examId);

        if (subjectRecords.isEmpty()) {
            throw new RuntimeException("No marks found for this student in the selected exam");
        }

        byte[] pdfBytes = pdfService.generateMarksSheet(enrollment, subjectRecords, exam.getName());
        emailService.sendMarksheet(
                enrollment.getStudent().getEmail(),
                pdfBytes,
                enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName(),
                exam.getName(),
                enrollment.getRollNo(),
                exam.getExamType() != null ? exam.getExamType().name() : "Exam");

        activityLogService.logTeacherActivity(
                currentSchool,
                "Sent marksheet for " + enrollment.getStudent().getFirstName() + " " +
                        enrollment.getStudent().getLastName() + " in " + exam.getName(),
                "Exams");
    }

    @Transactional
    public void sendAllMarksheets(Long examId) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = synchronizeExamStatus(exam);

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, exam.getClassroom())) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        if (exam.getStatus() != ExamStatus.COMPLETED) {
            throw new RuntimeException("Marksheets can only be sent after the exam is completed.");
        }

        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndAcademicYear(
                exam.getClassroom(), exam.getAcademicYear());

        int sentCount = 0;
        for (Enrollment enrollment : enrollments) {
            List<StudentSubjectMarks> subjectRecords = marksRepository.findByEnrollment_StudentAndExam_Id(
                    enrollment.getStudent(), examId);

            if (subjectRecords.isEmpty()) {
                continue;
            }

            byte[] pdfBytes = pdfService.generateMarksSheet(enrollment, subjectRecords, exam.getName());
            emailService.sendMarksheet(
                    enrollment.getStudent().getEmail(),
                    pdfBytes,
                    enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName(),
                    exam.getName(),
                    enrollment.getRollNo(),
                    exam.getExamType() != null ? exam.getExamType().name() : "Exam");
            sentCount++;
        }

        activityLogService.logTeacherActivity(
                currentSchool,
                "Sent " + sentCount + " marksheet(s) for " + exam.getName(),
                "Exams");
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
