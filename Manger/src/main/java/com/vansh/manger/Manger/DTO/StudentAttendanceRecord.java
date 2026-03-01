package com.vansh.manger.Manger.DTO;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor @NoArgsConstructor
public class StudentAttendanceRecord{

    private Long studentId;
    private boolean present;
}
