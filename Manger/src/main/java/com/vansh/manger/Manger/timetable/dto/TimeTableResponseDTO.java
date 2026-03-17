package com.vansh.manger.Manger.timetable.dto;

import lombok.Builder;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@Builder
public class TimeTableResponseDTO {

    private Long id;
    private String teacherName;
    private String subjectName;
    private String classroomName;
    private String day;
    private LocalTime startTime;
    private LocalTime endTime;

}
