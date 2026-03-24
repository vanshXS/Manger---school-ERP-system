package com.vansh.manger.Manger.teacher.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.vansh.manger.Manger.common.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;

import com.vansh.manger.Manger.teacher.dto.TeacherAssignmentDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherRequestDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.teacher.specification.TeacherSpecification;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import static com.vansh.manger.Manger.teacher.service.TeacherService.getTeacherResponseDTO;
import com.vansh.manger.Manger.common.service.EmailService;
import com.vansh.manger.Manger.common.service.ActivityLogService;

@Service
@RequiredArgsConstructor
public class AdminTeacherService {

    private final TeacherRespository teacherRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;

    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AdminSchoolConfig adminSchoolConfig;

    // ✅ FIX: Proper injection
    private final ActivityLogService activityLogService;

    private final RandomPasswordGenerator generator = new RandomPasswordGenerator();
    private final String UPLOAD_DIR = System.getProperty("user.home") + "/manger/uploads/teachers";

    // ---------------- PROFILE PICTURE ----------------
    public String saveProfilePicture(MultipartFile file, String email) {
        if (file == null || file.isEmpty())
            return null;

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = "";

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFileName = email + "-" + System.currentTimeMillis() + extension;

            Path filePath = uploadPath.resolve(uniqueFileName);
            file.transferTo(filePath.toFile());

            return uniqueFileName;

        } catch (IOException e) {
            throw new RuntimeException("Failed to save profile picture: " + e.getMessage(), e);
        }
    }

    // ---------------- CREATE TEACHER ----------------
    @Transactional
    public TeacherResponseDTO createTeacher(TeacherRequestDTO dto) {
        School currentSchool = adminSchoolConfig.requireCurrentSchool();
        String normalizedEmail = dto.getEmail().trim().toLowerCase();

        if (teacherRespository.existsByEmailAndSchool_Id(normalizedEmail, currentSchool.getId()))
            throw new IllegalArgumentException("Teacher already exists with this email");

        String pictureUrl = saveProfilePicture(dto.getProfilePicture(), normalizedEmail);
        String rawPassword = generator.generateRandomPassword();
        String encodedPassword = passwordEncoder.encode(rawPassword);

        String employeeId = dto.getEmployeeId();
        if (employeeId == null || employeeId.isBlank()) {
            long count = teacherRespository.countBySchool_Id(currentSchool.getId());
            employeeId = "EMP-" + currentSchool.getId() + "-" + (count + 1);
        }

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
                .phoneNumber(
                        dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank() ? dto.getPhoneNumber() : null)
                .password(encodedPassword)
                .email(normalizedEmail)
                .role(Roles.TEACHER)
                .school(currentSchool)
                .profilePictureUrl(pictureUrl)
                .user(teacherUser)
                .employeeId(employeeId)
                .qualification(dto.getQualification())
                .specialization(dto.getSpecialization())
                .yearsOfExperience(dto.getYearsOfExperience())
                .employmentType(dto.getEmploymentType())
                .salary(dto.getSalary())
                .joiningDate(dto.getJoiningDate() != null ? dto.getJoiningDate() : LocalDate.now())
                .fullAddress(dto.getFullAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .emergencyContactName(dto.getEmergencyContactName())
                .emergencyContactNumber(dto.getEmergencyContactNumber())
                .gender(dto.getGender())
                .build();

        Teacher savedTeacher = teacherRespository.save(teacher);

        // ✅ ACTIVITY LOG
        activityLogService.logActivity(
                "Teacher created: " + savedTeacher.getFirstName() + " " + savedTeacher.getLastName(),
                "Teacher Management");

        try {
            emailService.sendNewUserWelcomeEmail(
                    savedTeacher.getEmail(),
                    savedTeacher.getFirstName(),
                    rawPassword);
        } catch (Exception e) {
            activityLogService.logActivity(
                    "Failed to send welcome email to " + savedTeacher.getEmail(),
                    "Teacher Email Error");
        }

        return mapToResponseWithAssignments(savedTeacher);
    }

    

    // ---------------- UPDATE TEACHER ----------------
    @Transactional
    public TeacherResponseDTO updateTeacher(Long teacherId, TeacherRequestDTO dto) {
        School currentSchool = adminSchoolConfig.requireCurrentSchool();
        String normalizedEmail = normalizeRequiredEmail(dto.getEmail());

        Teacher teacher = teacherRespository.findByIdAndSchool_Id(teacherId, currentSchool.getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        teacherRespository.findByEmailAndSchool_Id(normalizedEmail, currentSchool.getId()).ifPresent(existing -> {
            if (!existing.getId().equals(teacherId)) {
                throw new IllegalArgumentException("This email is already taken by another teacher");
            }
        });

        String newPic = saveProfilePicture(dto.getProfilePicture(), normalizedEmail);

        teacher.setFirstName(dto.getFirstName());
        teacher.setLastName(dto.getLastName());
        teacher.setEmail(normalizedEmail);


        teacher.setPhoneNumber(normalizeOptional(dto.getPhoneNumber()));

        if (newPic != null) {
            teacher.setProfilePictureUrl(newPic);
        }

        if (dto.getEmployeeId() != null && !dto.getEmployeeId().isBlank()) {
            teacher.setEmployeeId(dto.getEmployeeId().trim());
        }
        teacher.setQualification(normalizeOptional(dto.getQualification()));
        teacher.setSpecialization(normalizeOptional(dto.getSpecialization()));
        teacher.setYearsOfExperience(dto.getYearsOfExperience());
        if (dto.getEmploymentType() != null)
            teacher.setEmploymentType(dto.getEmploymentType());
        teacher.setSalary(dto.getSalary());
        if (dto.getJoiningDate() != null)
            teacher.setJoiningDate(dto.getJoiningDate());
        teacher.setFullAddress(normalizeOptional(dto.getFullAddress()));
        teacher.setCity(normalizeOptional(dto.getCity()));
        teacher.setState(normalizeOptional(dto.getState()));
        teacher.setPincode(normalizeOptional(dto.getPincode()));
        teacher.setEmergencyContactName(normalizeOptional(dto.getEmergencyContactName()));
        teacher.setEmergencyContactNumber(normalizeOptional(dto.getEmergencyContactNumber()));
        teacher.setGender(dto.getGender());

        teacher.getUser().setFullName(dto.getFirstName() + " " + dto.getLastName());
        teacher.getUser().setEmail(normalizedEmail);

        teacherRespository.save(teacher);

        // ✅ ACTIVITY LOG
        activityLogService.logActivity(
                "Teacher updated: " + teacher.getFirstName() + " " + teacher.getLastName(),
                "Teacher Management");

        return mapToResponseWithAssignments(teacher);
    }

    private String normalizeRequiredEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Teacher email is required.");
        }
        return email.trim().toLowerCase();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // ----------------TOGGLE STATUS-----------------

    public void toggleStatus(Long teacherId, boolean active) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found in the current admin school."));

        if (!active && teacherAssignmentRepository.existsByTeacher(teacher)) {
            throw new IllegalStateException("Assigned Teacher cannot be deactivated");
        }

        teacher.setActive(active);
        teacherRespository.save(teacher);

        activityLogService.logActivity(
                "Teacher " + teacher.getFirstName() + " " + teacher.getLastName() +
                        (active ? " activated" : " deactivated"),
                "Teacher Status Update");

    }

    // ---------------- DELETE TEACHER ----------------
    @Transactional
    public void delete(Long teacherId) {

        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        if (teacher.isActive()) {
            throw new IllegalStateException("Teacher status is active. Cannot delete.");
        } else {
            teacherRespository.delete(teacher);
            activityLogService.logActivity(
                    "Teacher deleted: " + teacher.getFirstName() + " " + teacher.getLastName(), "Teacher Management");
        }
    }

    // ---------------- FETCH ----------------

    public Page<TeacherResponseDTO> getTeacherPage(
            Boolean active,
            String search,
            Pageable pageable) {
        School school = adminSchoolConfig.requireCurrentSchool();

        Specification<Teacher> specification = TeacherSpecification.build(active, search, school.getId());

        Page<Teacher> teacherPage = teacherRespository.findAll(specification, pageable);
        List<Teacher> teachers = teacherPage.getContent();
        if (teachers.isEmpty()) {
            return teacherPage.map(this::mapToResponseWithAssignments);
        }

        var assignmentsByTeacherId = teacherAssignmentRepository.findByTeacherIn(teachers).stream()
                .collect(Collectors.groupingBy(assignment -> assignment.getTeacher().getId()));

        List<TeacherResponseDTO> content = teachers.stream()
                .map(teacher -> mapToResponseWithAssignments(
                        teacher,
                        assignmentsByTeacherId.getOrDefault(teacher.getId(), List.of())))
                .toList();

        return new org.springframework.data.domain.PageImpl<>(content, pageable, teacherPage.getTotalElements());
    }

    public TeacherResponseDTO getTeacherById(Long teacherId) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found."));
        return mapToResponseWithAssignments(teacher);
    }

    // ---------------- MAPPER ----------------
    private TeacherResponseDTO mapToResponseWithAssignments(Teacher teacher) {
        return mapToResponseWithAssignments(teacher, teacherAssignmentRepository.findByTeacher(teacher));
    }

    private TeacherResponseDTO mapToResponseWithAssignments(Teacher teacher, List<TeacherAssignment> teacherAssignments) {
        List<TeacherAssignmentDTO> assignments = teacherAssignments
                .stream()
                .map(a -> TeacherAssignmentDTO.builder()
                        .assignmentId(a.getId())
                        .classroomId(a.getClassroom().getId())
                        .className(a.getClassroom().getGradeLevel().getDisplayName() + " - " + a.getClassroom().getSection().toUpperCase())
                        .subjectId(a.getSubject().getId())
                        .subjectName(a.getSubject().getName())
                        .mandatory(a.isMandatory())
                        .build())
                .collect(Collectors.toList());

        return getTeacherResponseDTO(teacher, assignments);
    }

}
