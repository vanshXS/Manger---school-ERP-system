package com.vansh.manger.Manger.attendance.dto;

import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class AttendanceResponseDTO {

        private Long id;
        private String studentName;
        private String teacherName;
        private String classroomName;
        private AttendanceStatus status;

}
