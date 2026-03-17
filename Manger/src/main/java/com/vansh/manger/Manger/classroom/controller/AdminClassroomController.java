package com.vansh.manger.Manger.classroom.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vansh.manger.Manger.classroom.dto.ClassroomRequestDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.classroom.entity.ClassroomStatus;
import com.vansh.manger.Manger.classroom.service.AdminClassroomService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/classrooms")
public class AdminClassroomController {

    private final AdminClassroomService adminClassroomService;
    private final AdminSchoolConfig getCurrentSchool;

    // --- CREATE ---
    @PostMapping
    public ResponseEntity<ClassroomResponseDTO> createClassroom(
            @Valid @RequestBody ClassroomRequestDTO classroomRequestDTO) {
        // Exceptions like IllegalArgumentException will be handled globally
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminClassroomService.createClassroom(classroomRequestDTO));
    }

    // --- GET ACTIVE ---
    @GetMapping
    public ResponseEntity<List<ClassroomResponseDTO>> getAllActiveClassrooms() {
        return ResponseEntity.ok(adminClassroomService.getAllActiveClassrooms());
    }

    // --- GET ARCHIVED ---
    // Corrected path to match frontend usage
    @GetMapping("/archived")
    public ResponseEntity<List<ClassroomResponseDTO>> getArchivedClassrooms() {
        return ResponseEntity.ok(adminClassroomService.getClassroomsByStatus(ClassroomStatus.ARCHIVED));
    }

    // --- GET BY ID ---
    // Added regex constraint `:\\d+`
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ClassroomResponseDTO> getClassroomById(@PathVariable("id") Long id) {
        // EntityNotFoundException will be handled globally (e.g., return 404)
        return ResponseEntity
                .ok(adminClassroomService.getClassroomById(id, getCurrentSchool.requireCurrentSchool().getId()));
    }

    // --- UPDATE ---
    // Added regex constraint `:\\d+`
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ClassroomResponseDTO> updateClassroom(
            @PathVariable("id") Long id,
            @Valid @RequestBody ClassroomRequestDTO classroomRequestDTO) {
        // Exceptions like EntityNotFoundException or IllegalArgumentException handled
        // globally
        return ResponseEntity.ok(adminClassroomService.updateClassroom(id, classroomRequestDTO));
    }

    // --- ARCHIVE ---
    // Added regex constraint `:\\d+`
    @PutMapping("/{id:\\d+}/archive")
    public ResponseEntity<ClassroomResponseDTO> archiveClassroom(@PathVariable("id") Long id) {
        // Exceptions like EntityNotFoundException or IllegalStateException handled
        // globally
        return ResponseEntity.ok(adminClassroomService.updateClassroomStatus(id, ClassroomStatus.ARCHIVED));
    }

    // --- ACTIVATE ---
    // Added regex constraint `:\\d+`
    @PutMapping("/{id:\\d+}/activate")
    public ResponseEntity<ClassroomResponseDTO> activateClassroom(@PathVariable("id") Long id) {
        // Exceptions like EntityNotFoundException handled globally
        return ResponseEntity.ok(adminClassroomService.updateClassroomStatus(id, ClassroomStatus.ACTIVE));
    }

    // --- DELETE ---
    // Corrected path variable name from classroomId to id
    // Added regex constraint `:\\d+`
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable("id") Long id) {
        // Exceptions like EntityNotFoundException or IllegalStateException handled
        // globally
        adminClassroomService.deleteClassroom(id);
        return ResponseEntity.noContent().build(); // Standard 204 No Content response
    }

    // --- GET SUBJECTS ---
    @GetMapping("/{classroomId}/subjects")
    public ResponseEntity<?> getSubjectsByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(adminClassroomService.getSubjectsByClassroom(classroomId));
    }
}
