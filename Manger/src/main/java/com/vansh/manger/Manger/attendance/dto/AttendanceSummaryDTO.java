package com.vansh.manger.Manger.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSummaryDTO {
    private Double attendancePercentage;
    private Integer daysPresent;
    private Integer daysAbsent;
    private Integer totalWorkingDays;
}