package com.vansh.manger.Manger.classroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomAttendanceStatsDTO {
    private Long id;
    private String gradeLevel;
    private String section;
    private Integer activeStudents;
    private Double attendancePercentage; // This will hold the O(n) calculated percentage
}
