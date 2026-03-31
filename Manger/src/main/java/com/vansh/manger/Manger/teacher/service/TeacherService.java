package com.vansh.manger.Manger.teacher.service;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.mapper.TeacherResponseMapper;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;

/**
 * Provides teacher-facing read operations (teacher's own profile).
 *
 * <p><b>SRP</b> — only the teacher's self-service read operations.
 * <b>DIP</b> — depends on {@link TeacherResponseMapper} abstraction for
 * mapping (was previously a static method duplicated here).
 * <b>DRY</b> — eliminated the static {@code getTeacherResponseDTO} duplicate.</p>
 */
@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherSchoolConfig schoolConfig;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final TeacherResponseMapper teacherResponseMapper;

    public TeacherResponseDTO getMyProfile() {
        Teacher teacher = schoolConfig.getTeacher();
        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByTeacher(teacher);
        return teacherResponseMapper.toDTO(teacher, assignments);
    }
}