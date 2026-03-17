package com.vansh.manger.Manger.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeacherWorkloadDTO {

    private String name;
    private long assignedClassesCount;
}
