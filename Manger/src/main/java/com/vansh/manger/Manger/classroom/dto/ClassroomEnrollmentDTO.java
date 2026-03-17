package com.vansh.manger.Manger.classroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ClassroomEnrollmentDTO {

    private String classroomName;
    private int capacity;
    private int enrolled;
}
