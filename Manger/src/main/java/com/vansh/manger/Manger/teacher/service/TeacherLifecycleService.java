package com.vansh.manger.Manger.teacher.service;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.common.util.ImageCleanupHelper;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles teacher lifecycle operations only (activation/deactivation/deletion).
 * Contains business rules: assigned teachers cannot be deactivated, active teachers cannot be deleted.
 *
 * DIP: Depends on ImageCleanupHelper for profile picture cleanup on deletion.
 */
@Service
@RequiredArgsConstructor
public class TeacherLifecycleService implements TeacherLifecycleOperations {

    private final TeacherRespository teacherRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ActivityLogService activityLogService;
    private final ImageCleanupHelper imageCleanupHelper;

    @Override
    public void toggleStatus(Long teacherId, boolean active) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found in the current admin school."));

        if (!active && teacherAssignmentRepository.existsByTeacher(teacher)) {
            throw new IllegalStateException("Assigned Teacher cannot be deactivated");
        }

        teacher.setActive(active);
        teacherRespository.save(teacher);

        activityLogService.logActivity(
                "Teacher " + teacher.getFirstName() + " " + teacher.getLastName()
                        + (active ? " activated" : " deactivated"),
                "Teacher Status Update");
    }

    @Override
    @Transactional
    public void delete(Long teacherId) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        if (teacher.isActive()) {
            throw new IllegalStateException("Teacher status is active. Cannot delete.");
        }

        String profilePicturePublicId = teacher.getProfilePicturePublicId();
        teacherRespository.delete(teacher);
        imageCleanupHelper.deleteOldImage(profilePicturePublicId, null);

        activityLogService.logActivity(
                "Teacher deleted: " + teacher.getFirstName() + " " + teacher.getLastName(),
                "Teacher Management");
    }
}
