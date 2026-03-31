package com.vansh.manger.Manger.exam.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.dto.GradingSheetDTO;
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
import com.vansh.manger.Manger.classroom.entity.Classroom;

import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles grading sheet retrieval — read-only marks query for a specific exam + subject.
 */
@Service
@RequiredArgsConstructor
public class GradingSheetService implements GradingSheetOperations {

    private final TeacherSchoolConfig schoolConfig;
    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final ExamStatusResolver examStatusResolver;

    @Override
    @Transactional(readOnly = true)
    public GradingSheetDTO getGradingSheet(Long examId, Long subjectId) {
        Teacher teacher = schoolConfig.getTeacher();
        School currentSchool = teacher.getSchool();
        Exam exam = examRepository.findByIdAndSchool_Id(examId, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam = examStatusResolver.synchronize(exam);

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, exam.getClassroom())) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        examSubjectRepository.findByExam_IdAndSubject_Id(examId, subjectId)
                .orElseThrow(() -> new RuntimeException("Subject is not part of this exam"));

        Classroom classroom = exam.getClassroom();
        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndAcademicYear(
                classroom, exam.getAcademicYear());

        List<GradingSheetDTO.StudentGradeRecord> students = enrollments.stream().map(enrollment -> {
            Student student = enrollment.getStudent();
            Optional<StudentSubjectMarks> markOpt = marksRepository
                    .findByEnrollment_StudentAndSubjectAndExam_Id(student, subject, examId);
            return GradingSheetDTO.StudentGradeRecord.builder()
                    .enrollmentId(enrollment.getId())
                    .studentName(student.getFirstName() + " " + student.getLastName())
                    .rollNo(enrollment.getRollNo())
                    .marksObtained(markOpt.map(StudentSubjectMarks::getMarksObtained).orElse(null))
                    .build();
        }).collect(Collectors.toList());

        long gradedCount = students.stream().filter(s -> s.getMarksObtained() != null).count();

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
}
