package com.vansh.manger.Manger.common.service;

import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.common.entity.ActivityLog;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.repository.ActivityLogRepository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final AdminSchoolConfig schoolConfig;
    private final TeacherSchoolConfig teacherSchoolConfig;

    public void logActivity(String description, String category) {
        logActivity(description, category, Roles.ADMIN);
    }

    public void logActivity(String description, String category, Roles roles) {
        School school = schoolConfig.requireCurrentSchool();
        saveLogInternal(description, category, roles, school, null);
    }

    public void logActivityForSchool(School school, String description, String category) {
        saveLogInternal(description, category, Roles.ADMIN, school, null);
    }

    public void logTeacherActivity(School school, String description, String category) {
        Teacher teacher = teacherSchoolConfig.getTeacher();
        saveLogInternal(description, category, Roles.TEACHER, school, teacher);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveLogInternal(String description, String category, Roles role, School school, Teacher teacher) {
        ActivityLog log = ActivityLog.builder()
                .description(description)
                .category(category)
                .role(role)
                .school(school)
                .teacher(teacher)
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
    public List<ActivityLogDTO> getRecentActivityByRole(String role, Long schoolId) {
        Roles parsedRole;
        try {
            parsedRole = Roles.valueOf(role.toUpperCase());
        } catch (Exception ex) {
            return getRecentActivity(schoolId);
        }

        return activityLogRepository.findTop10BySchool_IdAndRoleOrderByCreatedAtDesc(schoolId, parsedRole)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public Page<ActivityLogDTO> getAllActivityLogs(Long schoolId, Pageable pageable) {
        return activityLogRepository.findBySchool_IdOrderByCreatedAtDesc(schoolId, pageable)
                .map(this::toDto);
    }

    @Transactional
    public List<ActivityLogDTO> getRecentTeacherActivity(Long schoolId, Long teacherId) {
        return activityLogRepository
                .findTop10BySchool_IdAndRoleAndTeacher_IdOrderByCreatedAtDesc(schoolId, Roles.TEACHER, teacherId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public Page<ActivityLogDTO> getTeacherActivityLogs(Long schoolId, Long teacherId, Pageable pageable) {
        return activityLogRepository
                .findBySchool_IdAndRoleAndTeacher_IdOrderByCreatedAtDesc(schoolId, Roles.TEACHER, teacherId, pageable)
                .map(this::toDto);
    }

    private ActivityLogDTO toDto(ActivityLog log) {
        return ActivityLogDTO.builder()
                .description(log.getDescription())
                .category(log.getCategory())
                .date(log.getCreatedAt())
                .role(log.getRole() != null ? log.getRole().name() : null)
                .actorName(resolveActorName(log))
                .build();
    }

    private String resolveActorName(ActivityLog log) {
        if (log.getRole() == Roles.TEACHER && log.getTeacher() != null) {
            return log.getTeacher().getFirstName() + " " + log.getTeacher().getLastName();
        }
        if (log.getRole() == Roles.ADMIN) {
            return "Admin";
        }
        if (log.getRole() == Roles.STUDENT) {
            return "Student";
        }
        return "System";
    }
}
