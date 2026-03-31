package com.vansh.manger.Manger.school.service;

import java.io.IOException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.SchoolRepository;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.school.dto.SchoolRegistrationRequestDTO;

import lombok.RequiredArgsConstructor;

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

       
            User admin = User.builder()
                    .fullName(requestDTO.getAdminFullName())
                    .email(requestDTO.getAdminEmail())
                    .password(passwordEncoder.encode(requestDTO.getAdminPassword()))
                    .roles(Roles.ADMIN)
                    .school(savedSchool)
                    .build();
            userRepo.save(admin);

            activityLogService.logActivityForSchool(
                    savedSchool,
                    "New school registered: " + savedSchool.getName(),
                    "Onboarding");

            return savedSchool;
    }

}
