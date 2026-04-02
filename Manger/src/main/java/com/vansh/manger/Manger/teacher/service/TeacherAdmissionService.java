package com.vansh.manger.Manger.teacher.service;

import java.io.IOException;
import java.time.LocalDate;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;
import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailSender;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.common.util.ImageCleanupHelper;
import com.vansh.manger.Manger.common.util.InputNormalizer;
import com.vansh.manger.Manger.teacher.dto.TeacherRequestDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.mapper.TeacherResponseMapper;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles teacher admission (creation) only.
 * Orchestrates user creation, password generation, email, and profile picture upload.
 *
 * DIP: Depends on injected abstractions (PasswordEncoder, RandomPasswordGenerator,
 * ImageCleanupHelper, InputNormalizer, TeacherResponseMapper).
 */
@Service
@RequiredArgsConstructor
public class TeacherAdmissionService implements TeacherAdmissionOperations {

    private final TeacherRespository teacherRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ActivityLogService activityLogService;
    private final FileStorageService fileStorageService;
    private final RandomPasswordGenerator randomPasswordGenerator;
    private final ImageCleanupHelper imageCleanupHelper;
    private final TeacherResponseMapper teacherResponseMapper;

    @Override
    @Transactional
    public TeacherResponseDTO createTeacher(TeacherRequestDTO dto) throws IOException {
        School currentSchool = adminSchoolConfig.requireCurrentSchool();
        String normalizedEmail = InputNormalizer.requireEmail(dto.getEmail());

        if (teacherRespository.existsByEmailAndSchool_Id(normalizedEmail, currentSchool.getId())) {
            throw new IllegalArgumentException("Teacher already exists with this email");
        }

        CloudinaryResponse uploadedProfilePicture = null;

        try {
            if (hasProfilePicture(dto)) {
                uploadedProfilePicture = fileStorageService.uploadTeacherProfile(
                        dto.getProfilePicture(), normalizedEmail);
            }

            String rawPassword = randomPasswordGenerator.generateRandomPassword();
            String encodedPassword = passwordEncoder.encode(rawPassword);

            User teacherUser = User.builder()
                    .fullName(dto.getFirstName() + " " + dto.getLastName())
                    .email(normalizedEmail)
                    .password(encodedPassword)
                    .roles(Roles.TEACHER)
                    .school(currentSchool)
                    .build();

            Teacher teacher = Teacher.builder()
                    .firstName(dto.getFirstName())
                    .lastName(dto.getLastName())
                    .phoneNumber(InputNormalizer.optional(dto.getPhoneNumber()))
                    .password(encodedPassword)
                    .email(normalizedEmail)
                    .role(Roles.TEACHER)
                    .school(currentSchool)
                    .profilePictureUrl(uploadedProfilePicture != null ? uploadedProfilePicture.getUrl() : null)
                    .profilePicturePublicId(uploadedProfilePicture != null ? uploadedProfilePicture.getPublicId() : null)
                    .user(teacherUser)
                    .employeeId(resolveEmployeeId(dto, currentSchool))
                    .qualification(InputNormalizer.optional(dto.getQualification()))
                    .specialization(InputNormalizer.optional(dto.getSpecialization()))
                    .yearsOfExperience(dto.getYearsOfExperience())
                    .employmentType(dto.getEmploymentType())
                    .salary(dto.getSalary())
                    .joiningDate(dto.getJoiningDate() != null ? dto.getJoiningDate() : LocalDate.now())
                    .fullAddress(InputNormalizer.optional(dto.getFullAddress()))
                    .city(InputNormalizer.optional(dto.getCity()))
                    .state(InputNormalizer.optional(dto.getState()))
                    .pincode(InputNormalizer.optional(dto.getPincode()))
                    .emergencyContactName(InputNormalizer.optional(dto.getEmergencyContactName()))
                    .emergencyContactNumber(InputNormalizer.optional(dto.getEmergencyContactNumber()))
                    .gender(dto.getGender())
                    .build();

            Teacher savedTeacher = teacherRespository.save(teacher);

            activityLogService.logActivity(
                    "Teacher created: " + savedTeacher.getFirstName() + " " + savedTeacher.getLastName(),
                    "Teacher Management");

            try {
                emailSender.sendNewUserWelcomeEmail(
                        savedTeacher.getEmail(),
                        savedTeacher.getFirstName(),
                        rawPassword);
            } catch (Exception e) {
                activityLogService.logActivity(
                        "Failed to send welcome email to " + savedTeacher.getEmail(),
                        "Teacher Email Error");
            }

            return teacherResponseMapper.toDTO(savedTeacher,
                    teacherAssignmentRepository.findByTeacher(savedTeacher));
        } catch (IOException e) {
            imageCleanupHelper.cleanupOnFailure(uploadedProfilePicture);
            throw new RuntimeException("Failed to upload teacher profile picture.", e);
        } catch (RuntimeException e) {
            imageCleanupHelper.cleanupOnFailure(uploadedProfilePicture);
            throw e;
        }
    }

    private String resolveEmployeeId(TeacherRequestDTO dto, School currentSchool) {
        if (dto.getEmployeeId() != null && !dto.getEmployeeId().isBlank()) {
            return dto.getEmployeeId().trim();
        }
        long count = teacherRespository.countBySchool_Id(currentSchool.getId());
        return "EMP-" + currentSchool.getId() + "-" + (count + 1);
    }

    private boolean hasProfilePicture(TeacherRequestDTO dto) {
        return dto.getProfilePicture() != null && !dto.getProfilePicture().isEmpty();
    }
}
