package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.common.repository.UserRepo;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeacherSchoolConfig {

    private final UserRepo userRepo;
    private final TeacherRespository teacherRespository;

    public School requireCurrentSchool() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepo.findByEmailAndRoles(email, Roles.TEACHER)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getSchool();
    }

    public Teacher getTeacher() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return teacherRespository.findByEmailAndSchool_Id(email, requireCurrentSchool().getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

    }



}
