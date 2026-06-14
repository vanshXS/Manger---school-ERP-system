package com.vansh.manger.Manger.student.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailNotificationService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.StudentRepository;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles student password/security operations.
 *
 * <p><b>SRP</b> — one responsibility: password lifecycle.
 * <b>LSP</b> — faithfully implements {@link StudentPasswordOperations}.
 * {@link PasswordEncoder}, {@link EmailNotificationService}).</p>
 */
@Service
@RequiredArgsConstructor
public class StudentPasswordService implements StudentPasswordOperations {

    private final StudentRepository studentRepository;
    private final UserRepo userRepo;
    private final AdminSchoolConfig getCurrentSchool;

    private final PasswordEncoder passwordEncoder;
    private final RandomPasswordGenerator randomPasswordGenerator;
    private final ActivityLogService activityLogService;
    private final EmailNotificationService emailNotificationService;

    @Override
    @Transactional
    public void sendPasswordReset(Long studentId) {
        School school = getCurrentSchool.requireCurrentSchool();
        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        User user = student.getUser();
        if (user == null) {
            throw new EntityNotFoundException("Associated user account not found for this student.");
        }

        String newRawPassword = randomPasswordGenerator.generateRandomPassword();
        String newEncodedPassword = passwordEncoder.encode(newRawPassword);

        // Update password on User entity
        user.setPassword(newEncodedPassword);

        userRepo.save(user);

        // Send the new password to the student's email (non-blocking, failure resistant)
        emailNotificationService.sendNewUserWelcomeEmailSafe(
                student.getEmail(), student.getFirstName(), newRawPassword, "Student");
        
        activityLogService.logActivity(
                "Admin triggered password reset for student: " + student.getFirstName() + " "
                        + student.getLastName(),
                "Security");
    }
}
