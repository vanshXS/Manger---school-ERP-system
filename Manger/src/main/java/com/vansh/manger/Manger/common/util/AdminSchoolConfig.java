package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.security.CurrentUserPrincipal;
import com.vansh.manger.Manger.common.security.SecurityContextHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminSchoolConfig {

    private final SchoolRepository schoolRepository;

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
}