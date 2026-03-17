package com.vansh.manger.Manger.common.service;

import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.common.entity.ActivityLog;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.repository.ActivityLogRepository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final AdminSchoolConfig schoolConfig;

    @Transactional
    public void logActivity(String description, String category) {
        logActivity(description, category, Roles.ADMIN);
    }

    @Transactional
    public void logActivity(String description, String category, Roles roles) {
        School school = schoolConfig.requireCurrentSchool();
        ActivityLog log = ActivityLog.builder()
                .description(description)
                .category(category)
                .role(roles)
                .school(school)
                .build();

        activityLogRepository.save(log);
    }

    @Transactional
    public void logActivityForSchool(School school, String description, String category) {
        ActivityLog log = ActivityLog.builder()
                .school(school)
                .category(category)
                .description(description)
                .role(Roles.ADMIN)
                .build();

        activityLogRepository.save(log);
    }

    @Transactional
    public void logTeacherActivity(School school, String description, String category) {
        ActivityLog log = ActivityLog.builder()
                .school(school)
                .category(category)
                .description(description)
                .role(Roles.TEACHER)
                .build();

        activityLogRepository.save(log);
    }

    @Transactional
    public Page<ActivityLogDTO> getActivityLogsByRole(String role, Long schoolId, Pageable pageable) {
        Roles parsedRole;
        try {
            parsedRole = Roles.valueOf(role.toUpperCase());
        } catch (Exception ex) {
            return activityLogRepository.findBySchool_IdOrderByCreatedAtDesc(schoolId, pageable)
                    .map(this::toDto);
        }

        return activityLogRepository.findBySchool_IdAndRoleOrderByCreatedAtDesc(schoolId, parsedRole, pageable)
                .map(this::toDto);
    }

    @Transactional
    public List<ActivityLogDTO> getRecentActivity(Long schoolId) {
        return activityLogRepository.findTop10BySchool_IdOrderByCreatedAtDesc(schoolId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public Page<ActivityLogDTO> getAllActivityLogs(Long schoolId, Pageable pageable) {
        return activityLogRepository.findBySchool_IdOrderByCreatedAtDesc(schoolId, pageable)
                .map(this::toDto);
    }

    private ActivityLogDTO toDto(ActivityLog log) {
        return ActivityLogDTO.builder()
                .description(log.getDescription())
                .category(log.getCategory())
                .date(log.getCreatedAt())
                .build();
    }
}
