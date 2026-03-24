package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentSchoolConfig {

    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    public School requireCurrentSchool() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User user = (User) authentication.getPrincipal();

        if(user == null) throw new RuntimeException("Authentication user not founded");

        return user.getSchool();
    }

    public Student currentStudent() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return studentRepo.findByEmailAndSchool_Id(email, requireCurrentSchool().getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

    }

    public Enrollment getCurrentEnrollment() {

        Student student = currentStudent();

        return  enrollmentRepo.findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, requireCurrentSchool().getId(), true)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));


    }
}
