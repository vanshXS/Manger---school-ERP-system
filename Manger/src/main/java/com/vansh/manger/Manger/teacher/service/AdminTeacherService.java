package com.vansh.manger.Manger.teacher.service;

import java.io.IOException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.teacher.dto.TeacherRequestDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Facade — backward-compatible entry point for admin teacher operations.
 *
 * <p><b>OCP</b> — new teacher concerns (e.g. onboarding workflow) can be added
 * as new sub-services without modifying this class.
 * <b>DIP</b> — depends on ISP interfaces, not concrete implementations.
 * <b>SRP</b> — sole responsibility is delegation/orchestration.
 * <b>LSP</b> — any implementation of the interfaces is interchangeable.</p>
 *
 * <p>The {@code AdminTeacherController} continues to inject this single class,
 * so the API surface is unchanged.</p>
 */
@Service
@RequiredArgsConstructor
public class AdminTeacherService {

    private final TeacherAdmissionOperations admissionOperations;
    private final TeacherProfileOperations profileOperations;
    private final TeacherLifecycleOperations lifecycleOperations;

    // ── Admission ───────────────────────────────────────────────

    public TeacherResponseDTO createTeacher(TeacherRequestDTO dto) throws IOException {
        return admissionOperations.createTeacher(dto);
    }

    // ── Profile ─────────────────────────────────────────────────

    public TeacherResponseDTO updateTeacher(Long teacherId, TeacherRequestDTO dto) throws IOException {
        return profileOperations.updateTeacher(teacherId, dto);
    }

    public TeacherResponseDTO getTeacherById(Long teacherId) {
        return profileOperations.getTeacherById(teacherId);
    }

    public Page<TeacherResponseDTO> getTeacherPage(Boolean active, String search, Pageable pageable) {
        return profileOperations.getTeacherPage(active, search, pageable);
    }

    // ── Lifecycle ───────────────────────────────────────────────

    public void toggleStatus(Long teacherId, boolean active) {
        lifecycleOperations.toggleStatus(teacherId, active);
    }

    public void delete(Long teacherId) {
        lifecycleOperations.delete(teacherId);
    }
}
