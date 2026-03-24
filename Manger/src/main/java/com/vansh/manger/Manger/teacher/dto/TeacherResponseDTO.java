package com.vansh.manger.Manger.teacher.dto;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.vansh.manger.Manger.teacher.entity.EmploymentType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.vansh.manger.Manger.common.entity.Gender;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;

    private String joinDate;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<TeacherAssignmentDTO> assignedClassrooms;

    private boolean active;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String profilePictureUrl;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String employeeId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String qualification;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String specialization;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer yearsOfExperience;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private EmploymentType employmentType;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private BigDecimal salary;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String fullAddress;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String city;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String state;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String pincode;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String emergencyContactName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String emergencyContactNumber;

    private Gender gender;

}
