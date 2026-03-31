package com.vansh.manger.Manger.student.service;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Thin facade over the 6 single-responsibility student services.
 *
 * <p><b>SRP</b> — this class has exactly one responsibility: routing controller
 * calls to the correct sub-service. It contains zero business logic.
 * <b>DIP</b> — depends on the <em>interfaces</em> (abstractions), not the
 * concrete implementations. Spring injects the implementations at runtime.
 * <b>ISP</b> — each dependency exposes only the methods relevant to its concern;
 * the facade composes them into the full admin API surface.
 * <b>OCP</b> — adding a new student concern (e.g. fee management) only requires
 * adding a new interface + implementation and one new delegation here.
 * <b>LSP</b> — every sub-service faithfully implements its interface contract,
 * so the facade can substitute any implementation without changes.</p>
 *
 * <p>The controller ({@code AdminStudentController}) keeps its single
 * {@code AdminStudentService} dependency — zero API breakage.</p>
 */
@Service
@RequiredArgsConstructor
public class AdminStudentService {

    // --- DIP: depend on abstractions (interfaces), not concrete classes ---
    private final StudentAdmissionOperations admissionService;
    private final StudentProfileOperations profileService;
    private final StudentClassroomOperations classroomService;
    private final StudentSubjectOperations subjectService;
    private final StudentPasswordOperations passwordService;
    private final StudentAcademicQueryOperations academicQueryService;

    // ─── Admission ──────────────────────────────────────────────────

    public StudentResponseDTO createStudent(StudentRequestDTO dto) throws IOException {
        return admissionService.createStudent(dto);
    }

    // ─── Profile CRUD ───────────────────────────────────────────────

    public StudentResponseDTO getStudentById(Long studentId) {
        return profileService.getStudentById(studentId);
    }

    public Page<StudentResponseDTO> getAllStudents(StudentStatus status, String search, Pageable pageable) {
        return profileService.getAllStudents(status, search, pageable);
    }

    public StudentResponseDTO updateStudent(Long studentId, StudentRequestDTO dto) throws IOException {
        return profileService.updateStudent(studentId, dto);
    }

    public void deleteById(Long studentId) {
        profileService.deleteById(studentId);
    }

    public List<StudentResponseDTO> getStudentsByClassroom(Long classroomId) {
        return profileService.getStudentsByClassroom(classroomId);
    }

    // ─── Classroom Enrollment ───────────────────────────────────────

    public StudentResponseDTO assignStudentToClassroom(Long studentId, Long newClassroomId) {
        return classroomService.assignStudentToClassroom(studentId, newClassroomId);
    }

    public void removeStudentFromClassroom(Long studentId) {
        classroomService.removeStudentFromClassroom(studentId);
    }

    public void updateStatus(Long studentId, StudentStatus status) {
        classroomService.updateStatus(studentId, status);
    }

    // ─── Subject Management ─────────────────────────────────────────

    public StudentResponseDTO assignStudentToSubject(Long studentId, Long subjectId) {
        return subjectService.assignStudentToSubject(studentId, subjectId);
    }

    public void removeSubjectFromStudent(Long studentId, Long subjectId) {
        subjectService.removeSubjectFromStudent(studentId, subjectId);
    }

    public List<SubjectResponseDTO> getSubjectsOfStudent(Long studentId) {
        return subjectService.getSubjectsOfStudent(studentId);
    }

    // ─── Password / Security ────────────────────────────────────────

    public void sendPasswordReset(Long studentId) {
        passwordService.sendPasswordReset(studentId);
    }

    // ─── Academic Queries ───────────────────────────────────────────

    public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
        return academicQueryService.getStudentExamResults(studentId, pageable);
    }

    public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
        return academicQueryService.getStudentAttendanceSummary(studentId);
    }
}
