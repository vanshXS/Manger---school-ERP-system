package com.vansh.manger.Manger.subject.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubjectAssignmentDetailDTO implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

   private String classroomName;
   private String teacherName;
}
