package com.vansh.manger.Manger.subject.dto;


import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.vansh.manger.Manger.teacher.entity.Teacher;

@Data
public class UpdateAssignmentTeacherDTO {

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;
}
