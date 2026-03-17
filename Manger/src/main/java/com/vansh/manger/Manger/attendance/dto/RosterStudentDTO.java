package com.vansh.manger.Manger.attendance.dto;


import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class RosterStudentDTO {

    private Long studentId;
    private String studentName;
    private String rollNo;
    private AttendanceStatus status;
}
