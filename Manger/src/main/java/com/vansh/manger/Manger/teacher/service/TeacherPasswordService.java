package com.vansh.manger.Manger.teacher.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailSender;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Handles teacher password/security operations.
 *
 * <p><b>SRP</b> — one responsibility: password lifecycle.
 * <b>LSP</b> — faithfully implements {@link TeacherPasswordOperations}.
 * <b>DIP</b> — depends on injected abstractions ({@link RandomPasswordGenerator},
 * {@link PasswordEncoder}, {@link EmailSender}).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherPasswordService implements TeacherPasswordOperations {

    private final TeacherRespository teacherRepository;
    private final UserRepo userRepo;
    private final AdminSchoolConfig getCurrentSchool;

    private final PasswordEncoder passwordEncoder;
    private final RandomPasswordGenerator randomPasswordGenerator;
    private final ActivityLogService activityLogService;
    private final EmailSender emailSender;

    @Override
    @Transactional
    public void sendPasswordReset(Long teacherId) {
        School school = getCurrentSchool.requireCurrentSchool();
        Teacher teacher = teacherRepository.findByIdAndSchool_Id(teacherId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        User user = teacher.getUser();
        if (user == null) {
            throw new EntityNotFoundException("Associated user account not found for this teacher.");
        }

        String newRawPassword = randomPasswordGenerator.generateRandomPassword();
        String newEncodedPassword = passwordEncoder.encode(newRawPassword);

        // Update password on both User and Teacher entities
        user.setPassword(newEncodedPassword);
        teacher.setPassword(newEncodedPassword);

        userRepo.save(user);
        teacherRepository.save(teacher);

        // Send the new password to the teacher's email
        try {
            emailSender.sendPasswordResetEmail(
                    teacher.getEmail(), 
                    teacher.getFirstName() + " " + teacher.getLastName(), 
                    newRawPassword
            );
            
            activityLogService.logActivity(
                    "Admin triggered password reset for teacher: " + teacher.getFirstName() + " "
                            + teacher.getLastName(),
                    "Security");
        } catch (Exception e) {
            log.error("Failed to send password reset email for teacher ID {}: {}", teacherId, e.getMessage());
            throw new RuntimeException(
                    "Password was reset, but failed to send email. Please notify the teacher manually.");
        }
    }
}
