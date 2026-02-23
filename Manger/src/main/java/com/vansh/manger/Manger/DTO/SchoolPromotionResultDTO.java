package com.vansh.manger.Manger.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class SchoolPromotionResultDTO {

    private String currentYear;
    private String nextYear;
    private boolean executed;

    private int totalClassrooms;
    private List<ClassroomPromotionResultDTO> classroomResults;

    private int totalPromoted;
    private int totalGraduated;
    private int totalDetained;
    private int totalSkipped;
    private int totalAlreadyDone;
    private int failedClassrooms;
    private boolean readyToPromote;

    public int getTotalStudents() {
        return totalPromoted + totalGraduated + totalDetained + totalSkipped + totalAlreadyDone;
    }
}
