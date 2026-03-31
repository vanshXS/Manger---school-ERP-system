package com.vansh.manger.Manger.teacher.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.vansh.manger.Manger.common.util.ClassroomDisplayHelper;
import com.vansh.manger.Manger.teacher.dto.TeacherAssignmentDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;

/**
 * Single source of truth for mapping Teacher entities → response DTOs.
 *
 * <p><b>SRP</b> — one responsibility: entity-to-DTO conversion.
 * <b>DRY</b> — replaces the duplicated mapToResponseWithAssignments()
 * in AdminTeacherService and the static getTeacherResponseDTO() in
 * TeacherService.</p>
 */
@Component
public class TeacherResponseMapper {

    public TeacherResponseDTO toDTO(Teacher teacher, List<TeacherAssignment> assignments) {
        List<TeacherAssignmentDTO> assignmentDTOs = toAssignmentDTOs(assignments);

        return TeacherResponseDTO.builder()
                .id(teacher.getId())
                .firstName(teacher.getFirstName())
                .lastName(teacher.getLastName())
                .phoneNumber(teacher.getPhoneNumber())
                .email(teacher.getEmail())
                .profilePictureUrl(teacher.getProfilePictureUrl())
                .active(teacher.isActive())
                .joinDate(teacher.getJoiningDate() != null ? teacher.getJoiningDate().toString() : null)
                .assignedClassrooms(assignmentDTOs)
                .employeeId(teacher.getEmployeeId())
                .qualification(teacher.getQualification())
                .specialization(teacher.getSpecialization())
                .yearsOfExperience(teacher.getYearsOfExperience())
                .employmentType(teacher.getEmploymentType())
                .salary(teacher.getSalary())
                .fullAddress(teacher.getFullAddress())
                .city(teacher.getCity())
                .state(teacher.getState())
                .pincode(teacher.getPincode())
                .emergencyContactName(teacher.getEmergencyContactName())
                .emergencyContactNumber(teacher.getEmergencyContactNumber())
                .gender(teacher.getGender())
                .build();
    }

    public List<TeacherAssignmentDTO> toAssignmentDTOs(List<TeacherAssignment> assignments) {
        return assignments.stream()
                .map(a -> TeacherAssignmentDTO.builder()
                        .assignmentId(a.getId())
                        .teacherId(a.getTeacher() != null ? a.getTeacher().getId() : null)
                        .teacherName(a.getTeacher() != null
                                ? a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName()
                                : null)
                        .classroomId(a.getClassroom().getId())
                        .className(ClassroomDisplayHelper.formatName(a.getClassroom()))
                        .subjectId(a.getSubject().getId())
                        .subjectName(a.getSubject().getName())
                        .mandatory(a.isMandatory())
                        .build())
                .collect(Collectors.toList());
    }
}
