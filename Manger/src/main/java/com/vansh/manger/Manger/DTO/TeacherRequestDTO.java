package com.vansh.manger.Manger.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import com.vansh.manger.Manger.Entity.EmploymentType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for create/update Teacher.
 * Required: firstName, lastName, email. All other fields are optional with
 * validation when provided.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherRequestDTO {

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

    @Pattern(regexp = "^$|^(\\+?[0-9]{1,3}[-.\\s]?)?[0-9]{10,14}$", message = "Phone number must be 10–14 digits (with optional country code)")
    @Size(max = 20)
    private String phoneNumber;

    private MultipartFile profilePicture;

    // --- Optional extended fields (validated when provided) ---
    @Size(max = 30, message = "Employee ID must not exceed 30 characters")
    private String employeeId;

    @Size(max = 200)
    private String qualification;
    @Size(max = 200)
    private String specialization;

    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 70, message = "Years of experience must be at most 70")
    private Integer yearsOfExperience;

    private EmploymentType employmentType;

    @DecimalMin(value = "0", message = "Salary cannot be negative")
    private BigDecimal salary;

    @PastOrPresent(message = "Joining date cannot be in the future")
    private LocalDate joiningDate;

    @Size(max = 500)
    private String fullAddress;
    @Size(max = 100)
    private String city;
    @Size(max = 100)
    private String state;
    @Pattern(regexp = "^$|^[0-9]{4,10}$", message = "Pincode must be 4 to 10 digits")
    @Size(max = 10)
    private String pincode;

    @Size(max = 100)
    private String emergencyContactName;
    @Pattern(regexp = "^$|^(\\+?[0-9]{1,3}[-.\\s]?)?[0-9]{10,14}$", message = "Emergency contact number must be valid")
    @Size(max = 20)
    private String emergencyContactNumber;

    private com.vansh.manger.Manger.Entity.Gender gender;

}
