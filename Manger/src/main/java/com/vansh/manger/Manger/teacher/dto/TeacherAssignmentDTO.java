package com.vansh.manger.Manger.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TeacherAssignmentDTO implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    private Long assignmentId;

    private Long classroomId;
    private String className;

    private Long teacherId;
    private String teacherName;

    private Long subjectId;
    private String subjectName;

    private boolean mandatory;
}
