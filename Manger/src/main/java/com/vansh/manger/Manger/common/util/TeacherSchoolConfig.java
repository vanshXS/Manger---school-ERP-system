package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.security.CurrentUserPrincipal;
import com.vansh.manger.Manger.common.security.SecurityContextHelper;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeacherSchoolConfig {

    private final SchoolRepository schoolRepository;
    private final TeacherRespository teacherRespository;

    public Long requireCurrentSchoolId() {
        CurrentUserPrincipal currentUser = SecurityContextHelper.getCurrentPrincipal();
        if (currentUser.schoolId() == null) {
            throw new IllegalStateException("User is not associated with any school");
        }
        return currentUser.schoolId();
    }

    public School requireCurrentSchool() {
        return schoolRepository.findById(requireCurrentSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found"));
    }

    public Teacher getTeacher() {
        CurrentUserPrincipal currentUser = SecurityContextHelper.getCurrentPrincipal();

        return teacherRespository.findByEmailAndSchool_Id(currentUser.email(), requireCurrentSchoolId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
    }
}