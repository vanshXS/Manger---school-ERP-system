package com.vansh.manger.Manger.exam.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.GradeCalculator;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.dto.BulkMarksRequestDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamSubject;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles mark entry (write-side) only.
 * Validates marks, computes grades, and persists StudentSubjectMarks.
 *
 * DIP: Uses GradeCalculator for grade computation, ExamStatusResolver for status sync.
 */
@Service
@RequiredArgsConstructor
public class MarkEntryService implements MarkEntryOperations {

    private final TeacherSchoolConfig schoolConfig;
    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final ExamStatusResolver examStatusResolver;

    @Override
    @Transactional
    public void saveBulkMarks(BulkMarksRequestDTO request) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();
        Exam exam = examRepository.findByIdAndSchool_Id(request.getExamId(), currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = examStatusResolver.synchronize(exam);

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
            Optional<StudentSubjectMarks> markOpt = marksRepository
                    .findByEnrollment_StudentAndSubjectAndExam_Id(student, subject, exam.getId());

            final Exam finalExam = exam;

            StudentSubjectMarks markEntity = markOpt.orElseGet(() -> {
                StudentSubjectMarks newMark = new StudentSubjectMarks();
                newMark.setEnrollment(enrollment);
                newMark.setSubject(subject);
                newMark.setExam(finalExam);
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

            if (markDto.getMarksObtained() != null) {
                double pct = (markDto.getMarksObtained() / maxMarks) * 100;
                markEntity.setGrade(GradeCalculator.computeGrade(pct));
            } else {
                markEntity.setGrade(null);
            }

            marksRepository.save(markEntity);
        }
    }
}
