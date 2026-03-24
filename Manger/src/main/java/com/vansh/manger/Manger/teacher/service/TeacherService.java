package com.vansh.manger.Manger.teacher.service;


import com.vansh.manger.Manger.teacher.dto.TeacherAssignmentDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherService{

    private final TeacherSchoolConfig schoolConfig;
    private final TeacherAssignmentRepository teacherAssignmentRepository;



     public TeacherResponseDTO getMyProfile() {

         Teacher teacher = schoolConfig.getTeacher();

         List<TeacherAssignmentDTO> assignments = teacherAssignmentRepository.findByTeacher(teacher)
                 .stream()
                 .map(ta -> {
                      return TeacherAssignmentDTO
                             .builder()
                             .teacherId(teacher.getId())
                             .teacherName(teacher.getFirstName() + " " + teacher.getLastName())
                             .classroomId(ta.getClassroom().getId())
                             .className(ta.getClassroom().getGradeLevel().getDisplayName() + " - " + ta.getClassroom().getSection().toUpperCase())
                             .subjectId(ta.getSubject().getId())
                             .subjectName(ta.getSubject().getName())
                             .mandatory(ta.isMandatory())
                             .build();

                 }).toList();

         return getTeacherResponseDTO(teacher, assignments);
     }


    static TeacherResponseDTO getTeacherResponseDTO(Teacher teacher, List<TeacherAssignmentDTO> assignments) {
        return TeacherResponseDTO.builder()
                .id(teacher.getId())
                .firstName(teacher.getFirstName())
                .lastName(teacher.getLastName())
                .phoneNumber(teacher.getPhoneNumber())
                .email(teacher.getEmail())
                .profilePictureUrl(teacher.getProfilePictureUrl())
                .active(teacher.isActive())
                .joinDate(teacher.getJoiningDate() != null ? teacher.getJoiningDate().toString() : null)
                .assignedClassrooms(assignments)
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


}