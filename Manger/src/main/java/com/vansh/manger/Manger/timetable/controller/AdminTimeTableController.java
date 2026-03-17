package com.vansh.manger.Manger.timetable.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.vansh.manger.Manger.timetable.dto.TimeTableRequestDTO;
import com.vansh.manger.Manger.timetable.dto.TimeTableResponseDTO;
import com.vansh.manger.Manger.timetable.service.TimeTableService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/timetable")
@RequiredArgsConstructor
public class AdminTimeTableController {

    private final TimeTableService timeTableService;

    @PostMapping
    public ResponseEntity<TimeTableResponseDTO> createTimeTable(@RequestBody @Valid TimeTableRequestDTO dto) {
        return ResponseEntity.ok(timeTableService.createTimeTable(dto));
    }

    @GetMapping("/teacher/{teacherId:\\d+}")
    public ResponseEntity<List<TimeTableResponseDTO>> getTimeTableByTeacherId(@PathVariable Long teacherId) {
        return ResponseEntity.ok(timeTableService.getByTeacherId(teacherId));
    }

    @GetMapping("/classroom/{classroomId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<TimeTableResponseDTO>> getTimeTableByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(timeTableService.getByClassroomId(classroomId));
    }

    @PutMapping("/{timeTableId:\\d+}")
    public ResponseEntity<TimeTableResponseDTO> update(@PathVariable Long timeTableId,
            @Valid @RequestBody TimeTableRequestDTO dto) {
        return ResponseEntity.ok(timeTableService.updateTimeTable(timeTableId, dto));
    }

    @DeleteMapping("/{timeTableId:\\d+}")
    public ResponseEntity<Void> delete(@PathVariable Long timeTableId) {
        timeTableService.deleteTimeTable(timeTableId);
        return ResponseEntity.noContent().build();
    }
}
