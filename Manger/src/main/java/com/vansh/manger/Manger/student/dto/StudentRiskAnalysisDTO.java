package com.vansh.manger.Manger.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for the Student Self Risk Analysis endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentRiskAnalysisDTO {

    private String riskLevel;
    private int riskScore;
    private Double attendancePercentage;
    private Double averagePercentage;
    private String weakestSubject;
    private List<String> reasons;
    private String recommendedAction;
}
