package com.vansh.manger.Manger.subject.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.subject.entity.Subject;

@Data
public class AssignmentRequestDTO {

    @NotNull(message = "Classroom ID is required")
    private Long classroomId;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    private boolean mandatory;
}
