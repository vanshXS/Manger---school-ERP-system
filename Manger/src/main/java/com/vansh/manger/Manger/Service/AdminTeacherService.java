package com.vansh.manger.Manger.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.vansh.manger.Manger.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.vansh.manger.Manger.Config.RandomPasswordGenerator;
import com.vansh.manger.Manger.DTO.ClassroomResponseDTO;
import com.vansh.manger.Manger.DTO.TeacherAssignmentDTO;
import com.vansh.manger.Manger.DTO.TeacherRequestDTO;
import com.vansh.manger.Manger.DTO.TeacherResponseDTO;
import com.vansh.manger.Manger.Entity.Roles;
import com.vansh.manger.Manger.Entity.School;
import com.vansh.manger.Manger.Entity.Teacher;
import com.vansh.manger.Manger.Repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.Repository.TeacherRespository;
import com.vansh.manger.Manger.Specification.TeacherSpecification;
import com.vansh.manger.Manger.util.AdminSchoolConfig;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

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

        if (teacherRespository.existsByEmailAndSchool_Id(dto.getEmail(),
                adminSchoolConfig.getOptionalCurrentSchool().getId()))
            throw new IllegalArgumentException("Teacher already exists with this email");

        String pictureUrl = saveProfilePicture(dto.getProfilePicture(), dto.getEmail());
        String rawPassword = generator.generateRandomPassword();
        String encodedPassword = passwordEncoder.encode(rawPassword);

        String employeeId = dto.getEmployeeId();
        if (employeeId == null || employeeId.isBlank()) {
            long count = teacherRespository.countBySchool_Id(adminSchoolConfig.requireCurrentSchool().getId());
            employeeId = "EMP-" + adminSchoolConfig.requireCurrentSchool().getId() + "-" + (count + 1);
        }

        User teacherUser = User.builder()
                .fullName(dto.getFirstName() + " " + dto.getLastName())
                .email(dto.getEmail())
                .password(encodedPassword)
                .roles(Roles.TEACHER)
                .school(adminSchoolConfig.requireCurrentSchool())
                .build();

        Teacher teacher = Teacher.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .phoneNumber(
                        dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank() ? dto.getPhoneNumber() : null)
                .password(encodedPassword)
                .email(dto.getEmail())
                .role(Roles.TEACHER)
                .school(adminSchoolConfig.requireCurrentSchool())
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

        Teacher teacher = teacherRespository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        String newPic = saveProfilePicture(dto.getProfilePicture(), dto.getEmail());

        teacher.setFirstName(dto.getFirstName());
        teacher.setLastName(dto.getLastName());
        teacher.setEmail(dto.getEmail());
        teacher.setPhoneNumber(dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank() ? dto.getPhoneNumber()
                : teacher.getPhoneNumber());

        if (newPic != null) {
            teacher.setProfilePictureUrl(newPic);
        }

        if (dto.getEmployeeId() != null && !dto.getEmployeeId().isBlank()) {
            teacher.setEmployeeId(dto.getEmployeeId());
        }
        teacher.setQualification(dto.getQualification());
        teacher.setSpecialization(dto.getSpecialization());
        teacher.setYearsOfExperience(dto.getYearsOfExperience());
        if (dto.getEmploymentType() != null)
            teacher.setEmploymentType(dto.getEmploymentType());
        teacher.setSalary(dto.getSalary());
        if (dto.getJoiningDate() != null)
            teacher.setJoiningDate(dto.getJoiningDate());
        teacher.setFullAddress(dto.getFullAddress());
        teacher.setCity(dto.getCity());
        teacher.setState(dto.getState());
        teacher.setPincode(dto.getPincode());
        teacher.setEmergencyContactName(dto.getEmergencyContactName());
        teacher.setEmergencyContactNumber(dto.getEmergencyContactNumber());
        teacher.setGender(dto.getGender());

        teacher.getUser().setFullName(dto.getFirstName() + " " + dto.getLastName());
        teacher.getUser().setEmail(dto.getEmail());

        teacherRespository.save(teacher);

        // ✅ ACTIVITY LOG
        activityLogService.logActivity(
                "Teacher updated: " + teacher.getFirstName() + " " + teacher.getLastName(),
                "Teacher Management");

        return mapToResponseWithAssignments(teacher);
    }

    // ----------------TOGGLE STATUS-----------------

    public void toggleStatus(Long teacherId, boolean active) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found in the current admin school."));

        if (teacherAssignmentRepository.existsByTeacher(teacher)) {
            throw new IllegalStateException("Assigned Teacher cannot be deactive");
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
            throw new IllegalStateException("Teacher status is active. Cannot deleted..");
        } else {
            teacherRespository.delete(teacher);
        }

        activityLogService.logActivity(
                "Teacher deleted: " + teacher.getFirstName() + " " + teacher.getLastName(), "Teacher Management");
    }

    // ---------------- FETCH ----------------

    public Page<TeacherResponseDTO> getTeacherPage(
            Boolean active,
            String search,
            Pageable pageable) {
        School school = adminSchoolConfig.requireCurrentSchool();

        Specification<Teacher> specification = TeacherSpecification.build(active, search, school.getId());

        return teacherRespository.findAll(specification, pageable)
                .map(this::mapToResponseWithAssignments);
    }

    public TeacherResponseDTO getTeacherById(Long teacherId) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found."));
        return mapToResponseWithAssignments(teacher);
    }

    // ---------------- MAPPER ----------------
    private TeacherResponseDTO mapToResponseWithAssignments(Teacher teacher) {

        List<TeacherAssignmentDTO> assignments = teacherAssignmentRepository.findByTeacher(teacher)
                .stream()
                .map(a -> TeacherAssignmentDTO.builder()
                        .assignmentId(a.getId())
                        .classroomId(a.getClassroom().getId())
                        .className(new ClassroomResponseDTO().getDisplayName(a.getClassroom()))
                        .subjectId(a.getSubject().getId())
                        .subjectName(a.getSubject().getName())
                        .mandatory(a.isMandatory())
                        .build())
                .collect(Collectors.toList());

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
