package com.vansh.manger.Manger.student.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vansh.manger.Manger.common.entity.BaseEntity;
import com.vansh.manger.Manger.common.entity.Gender;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "students", indexes = {
        @Index(name = "idx_student_admission_no_school", columnList = "admission_no, school_id"),
        @Index(name = "idx_student_email", columnList = "email")

})
public class Student extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String email;
    private String phoneNumber;
    private String admissionNo;
    private String password;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Enrollment> enrollments;

    @Column(nullable = true, length = 512)
    private String profilePictureUrl;

    @JsonIgnore
    @Column(nullable = true, length = 255)
    private String profilePicturePublicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column
    private Integer graduationYear;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    private String fatherName;
    private String motherName;
    private String guardianName;
    private String parentPhonePrimary;
    private String parentPhoneSecondary;
    private String parentEmail;
    private String parentOccupation;
    private String annualIncome;

    private String fullAddress;
    private String city;
    private String state;
    private String pincode;

    private String medicalConditions;
    private String allergies;
    private String emergencyContactName;
    private String emergencyContactNumber;

    private String previousSchoolName;
    private String previousClass;
    private LocalDate admissionDate;

    @Column(nullable = true)
    private Boolean transportRequired;
    @Column(nullable = true)
    private Boolean hostelRequired;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String feeCategory;
}