package com.vansh.manger.Manger.exam.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailSender;
import com.vansh.manger.Manger.common.service.PDFService;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles marksheet PDF generation and email distribution only.
 * Pure orchestration — delegates PDF creation to PDFService, email to EmailService.
 *
 * DIP: Depends on PDFService and EmailService abstractions for infrastructure concerns.
 */
@Service
@RequiredArgsConstructor
public class MarksheetDistributionService implements MarksheetDistributionOperations {

    private final TeacherSchoolConfig schoolConfig;
    private final ExamRepository examRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final PDFService pdfService;
    private final EmailSender emailSender;
    private final ActivityLogService activityLogService;
    private final ExamStatusResolver examStatusResolver;

    @Override
    @Transactional
    public void sendMarksheet(Long examId, Long enrollmentId) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = examStatusResolver.synchronize(exam);

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
        emailSender.sendMarksheet(
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

    @Override
    @Transactional
    public void sendAllMarksheets(Long examId) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();

        Exam exam = examRepository.findByIdAndSchool_Id(examId, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = examStatusResolver.synchronize(exam);

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
            emailSender.sendMarksheet(
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
}
