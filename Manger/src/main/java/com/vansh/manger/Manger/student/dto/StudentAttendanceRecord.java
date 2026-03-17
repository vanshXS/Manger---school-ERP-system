package com.vansh.manger.Manger.student.dto;


import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor @NoArgsConstructor
public class StudentAttendanceRecord{

    private Long studentId;
    private AttendanceStatus status;
}
