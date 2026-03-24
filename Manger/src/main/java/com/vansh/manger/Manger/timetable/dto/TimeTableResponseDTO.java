package com.vansh.manger.Manger.timetable.dto;

import lombok.Builder;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@Builder
public class TimeTableResponseDTO {

    private Long id;
    private String teacherName;
    private String subjectName;
    private String classroomName;
    private String day;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime startTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime endTime;

}
