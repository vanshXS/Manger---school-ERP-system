package com.vansh.manger.Manger.student.service;

import java.io.IOException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;
import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.common.util.InputNormalizer;
import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.mapper.StudentResponseMapper;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.student.util.StudentAssignSubjects;
import com.vansh.manger.Manger.student.util.StudentProfileUploader;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles the student admission pipeline.
 *
 * <p><b>SRP</b> — one responsibility: creating a new student (user + entity + enrollment + email).
 * <b>LSP</b> — faithfully implements {@link StudentAdmissionOperations}.
 * <b>DIP</b> — depends on abstractions ({@link StudentResponseMapper}, {@link StudentEnrollmentService})
 * rather than re-implementing logic locally.</p>
 */
@Service
@RequiredArgsConstructor
public class StudentAdmissionService implements StudentAdmissionOperations {

    private final StudentRepository studentRepository;
    private final ClassroomRespository classroomRespository;
    private final AcademicYearRepository academicYearRepository;
    private final StudentValidator studentValidator;
    private final StudentProfileUploader studentProfileUploader;
    private final AdminSchoolConfig getCurrentSchool;

    private final PasswordEncoder passwordEncoder;
    private final RandomPasswordGenerator randomPasswordGenerator;
    private final ActivityLogService activityLogService;
    private final EmailService emailService;
    private final StudentEnrollmentService studentEnrollmentService;
    private final StudentAssignSubjects studentAssignSubjects;
    private final StudentResponseMapper studentResponseMapper;

    @Override
    @Transactional
    public StudentResponseDTO createStudent(StudentRequestDTO studentRequestDTO) throws IOException {

        studentValidator.validate(studentRequestDTO);

        String normalizedEmail = InputNormalizer.requireEmail(studentRequestDTO.getEmail());
        School school = getCurrentSchool.requireCurrentSchool();

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, getCurrentSchool.requireCurrentSchoolId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found in this school: " + school.getName()));

        Classroom classroom = classroomRespository
                .findByIdAndSchool_Id(studentRequestDTO.getClassroomId(), getCurrentSchool.requireCurrentSchoolId())
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

        CloudinaryResponse uploadedProfilePicture = studentProfileUploader
                .uploadStudentProfile(studentRequestDTO, studentRequestDTO.getProfilePicture());

        // Password & User Creation
        String rawPassword = randomPasswordGenerator.generateRandomPassword();
        String encodedPassword = passwordEncoder.encode(rawPassword);

        User studentUser = User.builder()
                .fullName(studentRequestDTO.getFirstName() + " " + studentRequestDTO.getLastName())
                .email(normalizedEmail)
                .password(encodedPassword)
                .roles(Roles.STUDENT)
                .school(school)
                .build();

        // Student Entity Creation
        Student student = Student.builder()
                .firstName(studentRequestDTO.getFirstName())
                .lastName(studentRequestDTO.getLastName())
                .user(studentUser)
                .school(school)
                .email(normalizedEmail)
                .password(encodedPassword)
                .phoneNumber(studentRequestDTO.getPhoneNumber())
                .admissionNo(studentRequestDTO.getAdmissionNo())
                .profilePictureUrl(uploadedProfilePicture != null ? uploadedProfilePicture.getUrl() : null)
                .profilePicturePublicId(
                        uploadedProfilePicture != null ? uploadedProfilePicture.getPublicId() : null)
                .fatherName(studentRequestDTO.getFatherName())
                .motherName(studentRequestDTO.getMotherName())
                .guardianName(studentRequestDTO.getGuardianName())
                .parentPhonePrimary(studentRequestDTO.getParentPhonePrimary())
                .parentPhoneSecondary(studentRequestDTO.getParentPhoneSecondary())
                .parentEmail(studentRequestDTO.getParentEmail())
                .parentOccupation(studentRequestDTO.getParentOccupation())
                .annualIncome(studentRequestDTO.getAnnualIncome())
                .fullAddress(studentRequestDTO.getFullAddress())
                .city(studentRequestDTO.getCity())
                .state(studentRequestDTO.getState())
                .pincode(studentRequestDTO.getPincode())
                .medicalConditions(studentRequestDTO.getMedicalConditions())
                .allergies(studentRequestDTO.getAllergies())
                .emergencyContactName(studentRequestDTO.getEmergencyContactName())
                .emergencyContactNumber(studentRequestDTO.getEmergencyContactNumber())
                .previousSchoolName(studentRequestDTO.getPreviousSchoolName())
                .previousClass(studentRequestDTO.getPreviousClass())
                .admissionDate(studentRequestDTO.getAdmissionDate())
                .transportRequired(studentRequestDTO.getTransportRequired())
                .hostelRequired(studentRequestDTO.getHostelRequired())
                .feeCategory(studentRequestDTO.getFeeCategory())
                .gender(studentRequestDTO.getGender())
                .build();

        Student savedStudent = studentRepository.save(student);

        // Auto-Generated Roll Number + Mandatory Subjects
        String newRollNo = studentEnrollmentService.generateNextRollNoForClass(classroom, currentYear);
        studentAssignSubjects.autoAssignMandatorySubjects(savedStudent, classroom);

        // Create the Enrollment Record
        Enrollment firstEnrollment = studentEnrollmentService.createEnrollment(
                student, classroom, newRollNo, currentYear, StudentStatus.ACTIVE,
                getCurrentSchool.requireCurrentSchool());

        // Send Welcome Email (non-blocking)
        try {
            emailService.sendNewUserWelcomeEmail(
                    savedStudent.getEmail(), savedStudent.getFirstName(), rawPassword);
            activityLogService.logActivity(
                    "New student enrolled: " + savedStudent.getFirstName()
                            + " (" + newRollNo + "). Welcome email sent.",
                    "Student Enrollment");
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to send welcome email for student "
                    + savedStudent.getId() + ": " + e.getMessage());
            activityLogService.logActivity(
                    "New student enrolled: " + savedStudent.getFirstName()
                            + ". FAILED TO SEND EMAIL.",
                    "Student Enrollment (Error)");
        }

        // Map to Response DTO
        StudentResponseDTO responseDTO = studentResponseMapper.toDTO(
                savedStudent, firstEnrollment, getCurrentSchool.requireCurrentSchoolId());
        responseDTO.setPassword(rawPassword); // One-time response for admin
        return responseDTO;
    }
}
