package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.common.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeacherSchoolConfig {

    private final UserRepo userRepo;
    private final TeacherRespository teacherRespository;

    public School requireCurrentSchool() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if(auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException(
                    "No authenticated user found."
            );
        }

       String email = auth.getName();

        User currentUser = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        School school = currentUser.getSchool();

        if(school == null) throw new IllegalStateException("User not associated with any school.");

        return school;
    }

    public Teacher getTeacher() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if(auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("No autenticated userFound");
        }

       User user = userRepo.findByEmail(auth.getName())
               .orElseThrow(() -> new RuntimeException("User not found."));

        return teacherRespository.findByEmailAndSchool_Id(user.getEmail(), requireCurrentSchool().getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found."));



    }



}
