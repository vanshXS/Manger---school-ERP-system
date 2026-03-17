package com.vansh.manger.Manger.teacher.controller;


import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.teacher.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping("/profile")
    public ResponseEntity<TeacherResponseDTO> getMyProfile() {
        return ResponseEntity.ok(teacherService.getMyProfile());
    }


}