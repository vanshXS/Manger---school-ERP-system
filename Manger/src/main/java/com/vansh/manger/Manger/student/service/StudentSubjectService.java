package com.vansh.manger.Manger.student.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.student.mapper.StudentResponseMapper;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles elective subject management for students.
 *
 * <p><b>SRP</b> — one responsibility: student subject assignment/removal.
 * <b>LSP</b> — faithfully implements {@link StudentSubjectOperations}.
 * <b>DIP</b> — depends on repository abstractions and {@link StudentResponseMapper}.</p>
 */
@Service
@RequiredArgsConstructor
public class StudentSubjectService implements StudentSubjectOperations {

    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AdminSchoolConfig getCurrentSchool;

    private final ActivityLogService activityLogService;
    private final StudentResponseMapper studentResponseMapper;

    @Override
    @Transactional
    public StudentResponseDTO assignStudentToSubject(Long studentId, Long subjectId) {
        School school = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Subject subject = subjectRepository.findByIdAndSchool_Id(subjectId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));

        Enrollment enrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElseThrow(() -> new IllegalStateException("Student not enrolled in any classroom"));

        Classroom classroom = enrollment.getClassroom();

        TeacherAssignment assignment = teacherAssignmentRepository
                .findByClassroomAndSubject(classroom, subject)
                .orElseThrow(() -> new IllegalArgumentException("Subject not part of classroom curriculum"));

        if (assignment.isMandatory()) {
            throw new IllegalStateException("Mandatory subjects are auto-assigned and cannot be manually added");
        }

        boolean exists = studentSubjectEnrollmentRepository.existsByStudentAndSubject(student, subject);
        if (exists) {
            throw new IllegalStateException("Subject already assigned to student");
        }

        StudentSubjectEnrollment enrollmentEntry = StudentSubjectEnrollment.builder()
                .student(student)
                .subject(subject)
                .mandatory(false)
                .build();

        studentSubjectEnrollmentRepository.save(enrollmentEntry);

        activityLogService.logActivity(
                "Optional subject " + subject.getName() + " assigned to student " + student.getFirstName(),
                "Student Subject Assignment");

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElse(null);

        return studentResponseMapper.toDTO(student, currentEnrollment, school.getId());
    }

    @Override
    @Transactional
    public void removeSubjectFromStudent(Long studentId, Long subjectId) {
        School school = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Subject subject = subjectRepository.findByIdAndSchool_Id(subjectId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));

        Enrollment enrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElseThrow(() -> new IllegalStateException("Student is not enrolled in any class"));

        Classroom classroom = enrollment.getClassroom();

        boolean isMandatoryForClass = teacherAssignmentRepository
                .existsByClassroomAndSubjectAndMandatoryTrue(classroom, subject);

        if (isMandatoryForClass) {
            throw new IllegalStateException("Mandatory subjects cannot be removed");
        }

        StudentSubjectEnrollment studentSubjectEnrollment = studentSubjectEnrollmentRepository
                .findByStudentAndSubject(student, subject)
                .orElseThrow(() -> new EntityNotFoundException("Subject not assigned to student"));

        studentSubjectEnrollmentRepository.delete(studentSubjectEnrollment);

        activityLogService.logActivity(
                "Optional subject " + subject.getName() + " removed from student " + student.getFirstName(),
                "Student Subject Update");
    }

    @Override
    @Transactional
    public List<SubjectResponseDTO> getSubjectsOfStudent(Long studentId) {
        School school = getCurrentSchool.requireCurrentSchool();

        studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        List<StudentSubjectEnrollment> enrollments = studentSubjectEnrollmentRepository
                .findByStudentId(studentId);

        return enrollments.stream()
                .map(enrollment -> {
                    Subject subject = enrollment.getSubject();
                    return SubjectResponseDTO.builder()
                            .id(subject.getId())
                            .name(subject.getName())
                            .code(subject.getCode())
                            .mandatory(enrollment.isMandatory())
                            .build();
                })
                .toList();
    }
}
