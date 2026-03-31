package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.security.SecurityContextHelper;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentSchoolConfig {

    private final SchoolRepository schoolRepository;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    public Long requireCurrentSchoolId() {
        User currentUser = SecurityContextHelper.getCurrentUser();
        if (currentUser.getSchool() == null) {
            throw new IllegalStateException("User is not associated with any school");
        }
        return currentUser.getSchool().getId();
    }

    public School requireCurrentSchool() {
        return schoolRepository.findById(requireCurrentSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found"));
    }

    public Student currentStudent() {
        User currentUser = SecurityContextHelper.getCurrentUser();

        return studentRepo.findByEmailAndSchool_Id(currentUser.getUsername(), requireCurrentSchoolId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public Enrollment getCurrentEnrollment() {

        Student student = currentStudent();

        return enrollmentRepo.findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, requireCurrentSchoolId(), true)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
    }
}
