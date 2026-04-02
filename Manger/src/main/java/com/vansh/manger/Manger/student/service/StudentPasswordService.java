package com.vansh.manger.Manger.student.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailSender;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.StudentRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles student password/security operations.
 *
 * <p><b>SRP</b> — one responsibility: password lifecycle.
 * <b>LSP</b> — faithfully implements {@link StudentPasswordOperations}.
 * <b>DIP</b> — depends on injected abstractions ({@link RandomPasswordGenerator},
 * {@link PasswordEncoder}, {@link EmailSender}).</p>
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
    private final EmailSender emailSender;

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

        // Update password on both User and Student entities
        user.setPassword(newEncodedPassword);
        student.setPassword(newEncodedPassword);

        userRepo.save(user);
        studentRepository.save(student);

        // Send the new password to the student's email
        try {
            emailSender.sendNewUserWelcomeEmail(
                    student.getEmail(), student.getFirstName(), newRawPassword);
            activityLogService.logActivity(
                    "Admin triggered password reset for student: " + student.getFirstName() + " "
                            + student.getLastName(),
                    "Security");
        } catch (Exception e) {
            System.err.println(
                    "Failed to send password reset email for student " + student.getId() + ": "
                            + e.getMessage());
            throw new RuntimeException(
                    "Password was reset, but failed to send email. Please notify the student manually.");
        }
    }
}
