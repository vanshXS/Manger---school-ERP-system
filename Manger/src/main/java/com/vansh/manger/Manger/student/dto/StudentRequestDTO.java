package com.vansh.manger.Manger.student.dto;

import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.vansh.manger.Manger.common.entity.Gender;
import com.vansh.manger.Manger.student.entity.Student;

/**
 * Request DTO for create/update Student.
 * Required: firstName, lastName, email. All other fields are optional with
 * validation when provided.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentRequestDTO {

    // --- Required ---
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    @Size(max = 100)
    private String email;

    @Pattern(regexp = "^$|^(\\+?[0-9]{1,3}[-.\\s]?)?(\\(?[0-9]{3}\\)?[-.\\s]?)?[0-9]{3}[-.\\s]?[0-9]{4,}$", message = "Invalid phone number format")
    @Size(max = 20)
    private String phoneNumber;

    private Long classroomId;
    private MultipartFile profilePicture;

    // --- Optional extended fields (validated when provided) ---
    @Size(max = 30, message = "Admission number must not exceed 30 characters")
    private String admissionNo;

    @Size(max = 100)
    private String fatherName;
    @Size(max = 100)
    private String motherName;
    @Size(max = 100)
    private String guardianName;

    @Pattern(regexp = "^$|^(\\+?[0-9]{1,3}[-.\\s]?)?[0-9]{10,14}$", message = "Parent primary phone must be valid")
    @Size(max = 20)
    private String parentPhonePrimary;
    @Pattern(regexp = "^$|^(\\+?[0-9]{1,3}[-.\\s]?)?[0-9]{10,14}$", message = "Parent secondary phone must be valid")
    @Size(max = 20)
    private String parentPhoneSecondary;

    @Email(message = "Parent email must be valid when provided")
    @Size(max = 100)
    private String parentEmail;
    @Size(max = 100)
    private String parentOccupation;
    @Size(max = 50)
    private String annualIncome;

    @Size(max = 500)
    private String fullAddress;
    @Size(max = 100)
    private String city;
    @Size(max = 100)
    private String state;
    @Pattern(regexp = "^$|^[0-9]{4,10}$", message = "Pincode must be 4 to 10 digits")
    @Size(max = 10)
    private String pincode;

    @Size(max = 500)
    private String medicalConditions;
    @Size(max = 500)
    private String allergies;

    @Size(max = 100)
    private String emergencyContactName;
    @Pattern(regexp = "^$|^(\\+?[0-9]{1,3}[-.\\s]?)?[0-9]{10,14}$", message = "Emergency contact number must be valid")
    @Size(max = 20)
    private String emergencyContactNumber;

    @Size(max = 200)
    private String previousSchoolName;
    @Size(max = 50)
    private String previousClass;

    @PastOrPresent(message = "Admission date cannot be in the future")
    private LocalDate admissionDate;

    private Boolean transportRequired;
    private Boolean hostelRequired;
    @Size(max = 50)
    private String feeCategory;

    private Gender gender;
}
