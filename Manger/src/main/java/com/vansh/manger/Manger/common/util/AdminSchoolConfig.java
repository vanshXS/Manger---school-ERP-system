package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.security.SecurityContextHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminSchoolConfig {

    private final SchoolRepository schoolRepository;

    public Long requireCurrentSchoolId() {
        User currentUser = SecurityContextHelper.getCurrentUser();
        if (currentUser.getSchool() == null) {
            throw new IllegalStateException("User is not associated with any school");
        }
        // Lazy proxy — Hibernate already has the FK, no extra DB query
        return currentUser.getSchool().getId();
    }

    public School requireCurrentSchool() {
        return schoolRepository.findById(requireCurrentSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found"));
    }
}
