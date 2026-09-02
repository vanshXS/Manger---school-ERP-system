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

    public String sendPasswordReset(Long studentId) {
        return passwordService.sendPasswordReset(studentId);
    }

    // ─── Academic Queries ───────────────────────────────────────────

    public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
        return academicQueryService.getStudentExamResults(studentId, pageable);
    }

    public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
        return academicQueryService.getStudentAttendanceSummary(studentId);
    }
}
