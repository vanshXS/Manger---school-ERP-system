package com.vansh.manger.Manger.DTO;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vansh.manger.Manger.Entity.Classroom;
import com.vansh.manger.Manger.Entity.ClassroomStatus;
import com.vansh.manger.Manger.Entity.GradeLevel;
import com.vansh.manger.Manger.Entity.Subject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.convert.DataSizeUnit;

import java.util.List;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class ClassroomResponseDTO {

    private Long id;
    private String section;
    private Integer capacity;
    private GradeLevel gradeLevel;
    private Long studentCount;
    private ClassroomStatus status;


    public String getDisplayName(Classroom classroom) {
        if (classroom.getGradeLevel() == null || classroom.getSection() == null) return "Unknown";
        return classroom.getGradeLevel().getDisplayName() + " - " + classroom.getSection().toUpperCase();
    }


}
