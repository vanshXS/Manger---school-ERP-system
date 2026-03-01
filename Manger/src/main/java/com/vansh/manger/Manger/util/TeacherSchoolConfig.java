package com.vansh.manger.Manger.util;

import com.vansh.manger.Manger.Entity.School;
import com.vansh.manger.Manger.Entity.Teacher;
import com.vansh.manger.Manger.Entity.User;
import com.vansh.manger.Manger.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeacherSchoolConfig {

    private final UserRepo userRepo;

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

        Teacher teacher = (Teacher) auth.getPrincipal();

        if(teacher == null) throw new RuntimeException("User not associated with any teacher.");

        return teacher;
    }



}
