package com.vansh.manger.Manger.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Response DTO for a single timetable slot.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTimetableDTO {

    private DayOfWeek day;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime startTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime endTime;

    private String subjectName;
    private String teacherName;
}
