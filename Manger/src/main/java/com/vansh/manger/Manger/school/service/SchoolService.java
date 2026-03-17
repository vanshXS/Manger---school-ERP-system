package com.vansh.manger.Manger.school.service;

import com.vansh.manger.Manger.school.dto.SchoolProfileDTO;
import com.vansh.manger.Manger.school.dto.SchoolRegistrationRequestDTO;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.SchoolRepository; // You will need to create this
import com.vansh.manger.Manger.common.repository.UserRepo;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.common.service.ActivityLogService;

@Service
@RequiredArgsConstructor
public class SchoolService {

    private final SchoolRepository schoolRepository;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final ActivityLogService activityLogService;


    @Transactional
    public School registerSchool(SchoolRegistrationRequestDTO requestDTO) {
        if (schoolRepository.findByName(requestDTO.getSchoolName()).isPresent()) {
            throw new IllegalStateException("A school with this name already exists.");
        }
        if (userRepo.findByEmail(requestDTO.getAdminEmail()).isPresent()) {
            throw new IllegalStateException("An account with this email already exists.");
        }

        // --- 1. Create and save the School FIRST (to get an ID) ---
        School newSchool = School.builder()
                .name(requestDTO.getSchoolName())
                .address(requestDTO.getSchoolAddress())
                .build();
        School savedSchool = schoolRepository.save(newSchool); // Save to get the ID

        // --- 2. Save the logo (if it exists) ---
        if (requestDTO.getLogoFile() != null && !requestDTO.getLogoFile().isEmpty()) {
            try {
                String logoUrl = fileStorageService.saveSchoolLogo(requestDTO.getLogoFile(), savedSchool.getId());
                savedSchool.setLogoUrl(logoUrl); // Set the URL
                savedSchool = schoolRepository.save(savedSchool); // Re-save with the URL
            } catch (IOException e) {
                // We throw a runtime exception to roll back the transaction
                throw new RuntimeException("Could not save logo file: " + e.getMessage(), e);
            }
        }

        // --- 3. Create the Admin User ---
        User admin = User.builder()
                .fullName(requestDTO.getAdminFullName())
                .email(requestDTO.getAdminEmail())
                .password(passwordEncoder.encode(requestDTO.getAdminPassword()))
                .roles(Roles.ADMIN)
                .school(savedSchool) // Link user to the new school
                .build();
        userRepo.save(admin);

        activityLogService.logActivityForSchool( savedSchool, 
                "New school registered: " + savedSchool.getName(),
                "Onboarding"
        );

        return savedSchool;
    }




}