package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.security.SecurityContextHelper;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeacherSchoolConfig {

    private final SchoolRepository schoolRepository;
    private final TeacherRespository teacherRespository;

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

    public Teacher getTeacher() {
        User currentUser = SecurityContextHelper.getCurrentUser();

        return teacherRespository.findByEmailAndSchool_Id(currentUser.getUsername(), requireCurrentSchoolId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
    }
}
