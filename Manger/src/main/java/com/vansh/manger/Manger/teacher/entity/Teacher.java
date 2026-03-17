package com.vansh.manger.Manger.teacher.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.Gender;
import com.vansh.manger.Manger.common.entity.Roles;

@Entity
@Table(name = "teachers", indexes = {
    @Index(name = "idx_teacher_active", columnList = "active"),
    @Index(name = "idx_teacher_email", columnList = "email"),
    @Index(name = "idx_teacher_active_id", columnList = "active, id"),
    @Index(name = "idx_teacher_employee_id_school", columnList = "employee_id, school_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Long id;

  @NotBlank(message = "First name is required")
  private String firstName;

  @NotBlank(message = "Last name is required")
  private String lastName;

  @Email(message = "Email must be valid")
  @NotBlank(message = "Email is required")
  private String email;

  @Column(name = "phone_number")
  private String phoneNumber;

  @Column(nullable = false)
  private boolean active = true;

  @NotBlank(message = "Password is required")
  private String password;

  private String profilePictureUrl;

  private LocalDate joiningDate;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "school_id", nullable = false)
  private School school;

  @Enumerated(EnumType.STRING)
  private Roles role;

  @OneToOne(cascade = CascadeType.ALL)
  @JoinColumn(name = "user_id", unique = true, nullable = false)
  private User user;

  // --- Extended fields (optional, backward compatible) ---
  @Column(name = "employee_id")
  private String employeeId;

  private String qualification;
  private String specialization;
  private Integer yearsOfExperience;

  @Enumerated(EnumType.STRING)
  @Column(name = "employment_type")
  private EmploymentType employmentType;

  @Column(precision = 12, scale = 2)
  private BigDecimal salary;

  private String fullAddress;
  private String city;
  private String state;
  private String pincode;

  private String emergencyContactName;
  private String emergencyContactNumber;

  @Enumerated(EnumType.STRING)
  private Gender gender;

  @PrePersist
  public void onCreate() {
    if (this.joiningDate == null) {
      this.joiningDate = LocalDate.now();
    }

  }
}
