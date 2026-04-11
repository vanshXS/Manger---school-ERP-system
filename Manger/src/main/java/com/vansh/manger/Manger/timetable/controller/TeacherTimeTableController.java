package com.vansh.manger.Manger.timetable.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vansh.manger.Manger.timetable.dto.TimeTableResponseDTO;
import com.vansh.manger.Manger.timetable.service.TimeTableService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/teacher/timetable")
@RequiredArgsConstructor
public class TeacherTimeTableController {

    private final TimeTableService timeTableService;

    @GetMapping
    public ResponseEntity<List<TimeTableResponseDTO>> getMyTimeTable() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(timeTableService.getMyTimeTable(email));
    }
}