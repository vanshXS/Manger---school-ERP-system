package com.vansh.manger.Manger.teacher.service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
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
import com.vansh.manger.Manger.teacher.specification.TeacherSpecification;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles teacher profile queries and updates only.
 * Read operations (getById, getPage) and profile mutations (updateTeacher).
 *
 * DIP: Depends on TeacherResponseMapper, ImageCleanupHelper, InputNormalizer abstractions.
 */
@Service
@RequiredArgsConstructor
public class TeacherProfileService implements TeacherProfileOperations {

    private final TeacherRespository teacherRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final ActivityLogService activityLogService;
    private final FileStorageService fileStorageService;
    private final ImageCleanupHelper imageCleanupHelper;
    private final TeacherResponseMapper teacherResponseMapper;

    @Override
    @Transactional
    public TeacherResponseDTO updateTeacher(Long teacherId, TeacherRequestDTO dto) throws IOException {
        School currentSchool = adminSchoolConfig.requireCurrentSchool();
        String normalizedEmail = InputNormalizer.requireEmail(dto.getEmail());

        Teacher teacher = teacherRespository.findByIdAndSchool_Id(teacherId, currentSchool.getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        teacherRespository.findByEmailAndSchool_Id(normalizedEmail, currentSchool.getId()).ifPresent(existing -> {
            if (!existing.getId().equals(teacherId)) {
                throw new IllegalArgumentException("This email is already taken by another teacher");
            }
        });

        CloudinaryResponse uploadedProfilePicture = null;
        String previousPublicId = teacher.getProfilePicturePublicId();

        try {
            if (hasProfilePicture(dto)) {
                uploadedProfilePicture = fileStorageService.uploadTeacherProfile(
                        dto.getProfilePicture(), normalizedEmail);
            }

            teacher.setFirstName(dto.getFirstName());
            teacher.setLastName(dto.getLastName());
            teacher.setEmail(normalizedEmail);
            teacher.setPhoneNumber(InputNormalizer.optional(dto.getPhoneNumber()));

            if (Boolean.TRUE.equals(dto.getRemoveProfilePicture())) {
                teacher.setProfilePictureUrl(null);
                teacher.setProfilePicturePublicId(null);
            } else if (uploadedProfilePicture != null) {
                teacher.setProfilePictureUrl(uploadedProfilePicture.getUrl());
                teacher.setProfilePicturePublicId(uploadedProfilePicture.getPublicId());
            }

            if (dto.getEmployeeId() != null && !dto.getEmployeeId().isBlank()) {
                teacher.setEmployeeId(dto.getEmployeeId().trim());
            }
            teacher.setQualification(InputNormalizer.optional(dto.getQualification()));
            teacher.setSpecialization(InputNormalizer.optional(dto.getSpecialization()));
            teacher.setYearsOfExperience(dto.getYearsOfExperience());
            if (dto.getEmploymentType() != null) {
                teacher.setEmploymentType(dto.getEmploymentType());
            }
            teacher.setSalary(dto.getSalary());
            if (dto.getJoiningDate() != null) {
                teacher.setJoiningDate(dto.getJoiningDate());
            }
            teacher.setFullAddress(InputNormalizer.optional(dto.getFullAddress()));
            teacher.setCity(InputNormalizer.optional(dto.getCity()));
            teacher.setState(InputNormalizer.optional(dto.getState()));
            teacher.setPincode(InputNormalizer.optional(dto.getPincode()));
            teacher.setEmergencyContactName(InputNormalizer.optional(dto.getEmergencyContactName()));
            teacher.setEmergencyContactNumber(InputNormalizer.optional(dto.getEmergencyContactNumber()));
            teacher.setGender(dto.getGender());

            teacher.getUser().setFullName(dto.getFirstName() + " " + dto.getLastName());
            teacher.getUser().setEmail(normalizedEmail);

            Teacher updatedTeacher = teacherRespository.save(teacher);
            imageCleanupHelper.deleteOldImage(previousPublicId,
                    uploadedProfilePicture != null ? uploadedProfilePicture.getPublicId() : null);

            activityLogService.logActivity(
                    "Teacher updated: " + updatedTeacher.getFirstName() + " " + updatedTeacher.getLastName(),
                    "Teacher Management");

            return teacherResponseMapper.toDTO(updatedTeacher,
                    teacherAssignmentRepository.findByTeacher(updatedTeacher));
        } catch (IOException e) {
            imageCleanupHelper.cleanupOnFailure(uploadedProfilePicture);
            throw new RuntimeException("Failed to upload teacher profile picture.", e);
        } catch (RuntimeException e) {
            imageCleanupHelper.cleanupOnFailure(uploadedProfilePicture);
            throw e;
        }
    }

    @Override
    public TeacherResponseDTO getTeacherById(Long teacherId) {
        Teacher teacher = teacherRespository
                .findByIdAndSchool_Id(teacherId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found."));
        return teacherResponseMapper.toDTO(teacher, teacherAssignmentRepository.findByTeacher(teacher));
    }

    @Override
    public Page<TeacherResponseDTO> getTeacherPage(Boolean active, String search, Pageable pageable) {
        School school = adminSchoolConfig.requireCurrentSchool();
        Specification<Teacher> specification = TeacherSpecification.build(active, search, school.getId());

        Page<Teacher> teacherPage = teacherRespository.findAll(specification, pageable);
        List<Teacher> teachers = teacherPage.getContent();
        if (teachers.isEmpty()) {
            return teacherPage.map(t -> teacherResponseMapper.toDTO(t, List.of()));
        }

        var assignmentsByTeacherId = teacherAssignmentRepository.findByTeacherIn(teachers).stream()
                .collect(Collectors.groupingBy(assignment -> assignment.getTeacher().getId()));

        List<TeacherResponseDTO> content = teachers.stream()
                .map(teacher -> teacherResponseMapper.toDTO(
                        teacher,
                        assignmentsByTeacherId.getOrDefault(teacher.getId(), List.of())))
                .toList();

        return new PageImpl<>(content, pageable, teacherPage.getTotalElements());
    }

    private boolean hasProfilePicture(TeacherRequestDTO dto) {
        return dto.getProfilePicture() != null && !dto.getProfilePicture().isEmpty();
    }
}
