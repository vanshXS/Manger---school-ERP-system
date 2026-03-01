package com.vansh.manger.Manger.DTO;

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
        private Boolean present;

}
