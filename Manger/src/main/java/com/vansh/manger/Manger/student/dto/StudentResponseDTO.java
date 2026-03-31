package com.vansh.manger.Manger.student.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.common.entity.Gender;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a Student's profile AND their *current* enrollment status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponseDTO {

    // --- Student Details ---
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String profilePictureUrl;

    // --- Current Enrollment Details ---
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long currentEnrollmentId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String rollNo;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private ClassroomResponseDTO classroomResponseDTO;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String academicYearName;

    private StudentStatus status;

    // --- Academic Details ---
    private List<SubjectResponseDTO> subjectResponseDTOS;

    // --- Extended fields (optional in response) ---
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String admissionNo;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String fatherName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String motherName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String guardianName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String parentPhonePrimary;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String parentPhoneSecondary;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String parentEmail;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String parentOccupation;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String annualIncome;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String fullAddress;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String city;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String state;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String pincode;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String medicalConditions;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String allergies;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String emergencyContactName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String emergencyContactNumber;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String previousSchoolName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String previousClass;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDate admissionDate;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean transportRequired;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean hostelRequired;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String feeCategory;

    private Gender gender;

    // --- For Create ONLY ---
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String password;
}