package com.vansh.manger.Manger.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for returning academic years the student was enrolled in.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAcademicYearDTO {

    private Long id;
    private String name;
    private boolean isCurrent;
}
