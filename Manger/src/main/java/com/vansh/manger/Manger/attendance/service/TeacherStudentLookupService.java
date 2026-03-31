package com.vansh.manger.Manger.attendance.service;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.mapper.StudentResponseMapper;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles teacher-facing student profile lookup.
 * This was previously a misplaced concern inside AttendanceService.
 * Now isolated via ISP so consumers can depend on it independently.
 *
 * DIP: Uses StudentResponseMapper for DTO conversion.
 */
@Service
@RequiredArgsConstructor
public class TeacherStudentLookupService implements TeacherStudentLookupOperations {

    private final TeacherSchoolConfig schoolConfig;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentResponseMapper studentResponseMapper;

    @Override
    @Transactional
    public StudentResponseDTO getStudentById(Long studentId) {
        Teacher teacher = schoolConfig.getTeacher();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, teacher.getSchool().getId(), true)
                .orElse(null);

        if (currentEnrollment != null) {
            boolean isAssigned = teacherAssignmentRepository
                    .existsByTeacherAndClassroom(teacher, currentEnrollment.getClassroom());
            if (!isAssigned) {
                throw new RuntimeException("Teacher is not assigned to this student's classroom");
            }
        }

        return studentResponseMapper.toDTO(student, currentEnrollment, teacher.getSchool().getId());
    }
}
