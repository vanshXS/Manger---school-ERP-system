package com.vansh.manger.Manger.student.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PromotionPreviewDTO {

    private String fromClassroom;
    private String toClassroom;
    private int studentCount;
    private int alreadyPromotedCount;
    private int toBePromotedCount;
    private List<String> studentNames;
    private boolean nextYearExists;
    private boolean targetClassroomExists;
}
