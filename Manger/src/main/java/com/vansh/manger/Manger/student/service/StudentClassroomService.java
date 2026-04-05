package com.vansh.manger.Manger.student.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.mapper.StudentResponseMapper;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.student.util.StudentAssignSubjects;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles classroom enrollment operations (assign, transfer, remove, status).
 *
 * <p><b>SRP</b> — one responsibility: classroom enrollment lifecycle.
 * <b>LSP</b> — faithfully implements {@link StudentClassroomOperations}.
 * <b>DIP</b> — depends on {@link StudentResponseMapper} and
 * {@link StudentEnrollmentService} abstractions.</p>
 */
@Service
@RequiredArgsConstructor
public class StudentClassroomService implements StudentClassroomOperations {

    private final StudentRepository studentRepository;
    private final ClassroomRespository classroomRespository;
    private final AcademicYearRepository academicYearRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AdminSchoolConfig getCurrentSchool;

    private final ActivityLogService activityLogService;
    private final StudentEnrollmentService studentEnrollmentService;
    private final StudentAssignSubjects studentAssignSubjects;
    private final StudentResponseMapper studentResponseMapper;

    @Override
    @Transactional
    public StudentResponseDTO assignStudentToClassroom(Long studentId, Long newClassroomId) {
        School adminSchool = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, adminSchool.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));
        Classroom newClassroom = classroomRespository.findByIdAndSchool(newClassroomId, adminSchool)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));
        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, adminSchool.getId())
                .orElseThrow(() -> new IllegalStateException("No active academic year is set!"));

        if (student.getUser().getSchool() == null || newClassroom.getSchool() == null) {
            throw new IllegalStateException("School information is missing.");
        }
        if (!student.getUser().getSchool().getId().equals(newClassroom.getSchool().getId())) {
            throw new IllegalArgumentException("Student and Classroom must be in the same school.");
        }

        // Find the student's *current* enrollment
        Optional<Enrollment> existingEnrollmentOpt = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, adminSchool.getId(), true);

        Enrollment enrollmentToSave;
        if (existingEnrollmentOpt.isPresent()) {
            // --- This is a TRANSFER ---
            Enrollment existingEnrollment = existingEnrollmentOpt.get();
            if (existingEnrollment.getClassroom().getId().equals(newClassroom.getId())) {
                throw new IllegalArgumentException("Student is already assigned to this classroom.");
            }
            String oldClassroomName = existingEnrollment.getClassroom().getSection();

            String newRollNo = studentEnrollmentService.generateNextRollNoForClass(newClassroom, currentYear);
            existingEnrollment.setClassroom(newClassroom);
            existingEnrollment.setRollNo(newRollNo);
            enrollmentToSave = enrollmentRepository.save(existingEnrollment);
            studentAssignSubjects.autoAssignMandatorySubjects(student, newClassroom);

            activityLogService.logActivity(
                    "Student " + student.getFirstName() + " transferred from " + oldClassroomName
                            + " to " + newClassroom.getSection(),
                    "Student Transfer");
        } else {
            // --- This is a NEW ENROLLMENT (for an unassigned student) ---
            String newRollNo = studentEnrollmentService.generateNextRollNoForClass(newClassroom, currentYear);
            Enrollment newEnrollment = Enrollment.builder()
                    .student(student)
                    .classroom(newClassroom)
                    .academicYear(currentYear)
                    .rollNo(newRollNo)
                    .build();
            enrollmentToSave = enrollmentRepository.save(newEnrollment);
            studentAssignSubjects.autoAssignMandatorySubjects(student, newClassroom);

            activityLogService.logActivity(
                    "Student " + student.getFirstName() + " enrolled in " + newClassroom.getSection(),
                    "Student Enrollment");
        }

        return studentResponseMapper.toDTO(student, enrollmentToSave, adminSchool.getId());
    }

    @Override
    @Transactional
    public void removeStudentFromClassroom(Long studentId) {
        School school = getCurrentSchool.requireCurrentSchool();
        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Student is not currently enrolled in any class."));

        String classroomName = currentEnrollment.getClassroom().getSection();
        enrollmentRepository.delete(currentEnrollment);

        activityLogService.logActivity(
                "Student " + student.getFirstName() + " was unenrolled from " + classroomName,
                "Student Unenrollment");
    }

    @Override
    @Transactional
    public void updateStatus(Long studentId, StudentStatus status) {
        School school = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found."));

        Enrollment enrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElseThrow(() -> new EntityNotFoundException("Student has no active enrollment"));

        if (enrollment.getStatus() == status)
            return;

        enrollment.setStatus(status);
        enrollmentRepository.save(enrollment);

        activityLogService.logActivity(
                "Student: " + student.getFirstName() + " status change to " + status,
                "Student Status Update");
    }
}
