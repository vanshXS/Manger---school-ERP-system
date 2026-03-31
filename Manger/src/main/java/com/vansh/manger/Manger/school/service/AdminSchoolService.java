package com.vansh.manger.Manger.school.service;

import java.io.IOException;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.vansh.manger.Manger.auth.dto.ChangePasswordRequestDTO;
import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.school.dto.SchoolProfileDTO;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminSchoolService {

    private final SchoolRepository schoolRepository;
    private final ActivityLogService activityLogService;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final UserRepo userRepo;

    /*
     * -------------------------------------------------------
     * 🔐 AUTH HELPERS
     * -------------------------------------------------------
     */

    private Long getAuthenticatedUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            return ((User) principal).getId();
        }

        if (principal instanceof String) {
            String email = (String) principal;
            return userRepo.findByEmail(email)
                    .orElseThrow(() -> new EntityNotFoundException("User not found via email."))
                    .getId();
        }

        throw new IllegalStateException("Invalid authentication principal.");
    }

    private User getAuthenticatedUserEntity() {
        Long userId = getAuthenticatedUserId();
        return userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found."));
    }

    /*
     * -------------------------------------------------------
     * 📌 DTO MAPPER
     * -------------------------------------------------------
     */
    private SchoolProfileDTO mapToDTO(School school) {
        SchoolProfileDTO dto = new SchoolProfileDTO();
        dto.setId(school.getId());
        dto.setName(school.getName());
        dto.setAddress(school.getAddress());
        dto.setPhoneNumber(school.getPhoneNumber());
        return dto;
    }

    /*
     * -------------------------------------------------------
     * 📌 FETCH SCHOOL PROFILE
     * -------------------------------------------------------
     */
    @Transactional(readOnly = true)
    public SchoolProfileDTO getSchoolProfile() {

        User admin = getAuthenticatedUserEntity();
        School school = admin.getSchool();

        if (school == null) {
            throw new EntityNotFoundException("No school is associated with this admin.");
        }

        return mapToDTO(school);
    }

    /*
     * -------------------------------------------------------
     * 📌 UPDATE SCHOOL INFO
     * -------------------------------------------------------
     */
    @Transactional
    public SchoolProfileDTO updateSchoolProfile(SchoolProfileDTO dto) {

        User admin = getAuthenticatedUserEntity();
        School school = admin.getSchool();

        if (school == null) {
            throw new EntityNotFoundException("No school is associated with this admin.");
        }

        school.setName(dto.getName());
        school.setAddress(dto.getAddress());
        school.setPhoneNumber(dto.getPhoneNumber());

        School updated = schoolRepository.save(school);

        activityLogService.logActivity(
                admin.getFullName() + " updated school profile.",
                "Settings");

        return mapToDTO(updated);
    }

    /*
     * -------------------------------------------------------
     * 🔐 CHANGE PASSWORD
     * -------------------------------------------------------
     */
    @Transactional
    public void changePassword(ChangePasswordRequestDTO dto) {

        User admin = getAuthenticatedUserEntity();

        // 1. Verify old password
        if (!passwordEncoder.matches(dto.getOldPassword(), admin.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password.");
        }

        // 2. Prevent using the same password
        if (passwordEncoder.matches(dto.getNewPassword(), admin.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the old password.");
        }

        // 3. Update password
        admin.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepo.save(admin);

        activityLogService.logActivity(
                admin.getFullName() + " changed their password.",
                "Security");
    }

    /*
     * -------------------------------------------------------
     * 📷 UPDATE SCHOOL LOGO
     * -------------------------------------------------------
     */
    @Transactional
    public SchoolProfileDTO updateSchoolLogo(MultipartFile file) {

        User admin = getAuthenticatedUserEntity();
        School school = admin.getSchool();

        if (school == null) {
            throw new EntityNotFoundException("No school associated with this admin.");
        }

        CloudinaryResponse uploadedLogo = null;
        String previousPublicId = school.getLogoPublicId();

        try {
            uploadedLogo = fileStorageService.uploadSchoolLogo(file, school.getId());
            school.setLogoUrl(uploadedLogo.getUrl());
            school.setLogoPublicId(uploadedLogo.getPublicId());
            School updated = schoolRepository.save(school);
            deletePreviousImage(previousPublicId, uploadedLogo.getPublicId());

            activityLogService.logActivity(
                    admin.getFullName() + " updated the school logo.",
                    "Settings");

            return mapToDTO(updated);

        } catch (IOException e) {
            cleanupUploadedImage(uploadedLogo);
            throw new RuntimeException("Failed to upload school logo.", e);
        } catch (RuntimeException e) {
            cleanupUploadedImage(uploadedLogo);
            throw e;
        }
    }

    private void cleanupUploadedImage(CloudinaryResponse uploadedImage) {
        if (uploadedImage == null) {
            return;
        }
        try {
            fileStorageService.deleteFile(uploadedImage.getPublicId());
        } catch (RuntimeException ignored) {
        }
    }

    private void deletePreviousImage(String previousPublicId, String replacementPublicId) {
        if (previousPublicId == null || previousPublicId.equals(replacementPublicId)) {
            return;
        }
        try {
            fileStorageService.deleteFile(previousPublicId);
        } catch (RuntimeException ignored) {
        }
    }
}
