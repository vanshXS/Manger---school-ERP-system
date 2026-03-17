package com.vansh.manger.Manger.subject.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vansh.manger.Manger.subject.dto.SubjectRequestDTO;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;
import com.vansh.manger.Manger.subject.service.AdminSubjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
public class AdminSubjectController {

    private final AdminSubjectService adminSubjectService;

    @PostMapping
    public ResponseEntity<SubjectResponseDTO> createSubject(@Valid @RequestBody SubjectRequestDTO subjectRequestDTO) {

        return ResponseEntity.status(HttpStatus.CREATED).body(adminSubjectService.createSubject(subjectRequestDTO));
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponseDTO>> getAllSubjects() {
        return ResponseEntity.ok(adminSubjectService.getAllSubjects());
    }

    @DeleteMapping("/{subjectId:\\d+}")
    public ResponseEntity<Void> deleteSubject(@PathVariable("subjectId") Long subjectId) {
        adminSubjectService.deleteSubject(subjectId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{subjectId:\\d+}")
    public ResponseEntity<SubjectResponseDTO> updateSubject(
            @PathVariable("subjectId") Long subjectId,
            @Valid @RequestBody SubjectRequestDTO subjectRequestDTO) {
        return ResponseEntity.ok(adminSubjectService.updateSubject(subjectId, subjectRequestDTO));
    }
}