package com.vansh.manger.Manger.DTO;

import com.vansh.manger.Manger.Entity.ClassroomStatus;
import com.vansh.manger.Manger.Entity.GradeLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClassroomRequestDTO {


    @NotNull(message = "Grade Level is required")
    private GradeLevel gradeLevel;

    @NotBlank(message = "Classroom section is required")
    @Size(min = 1, max = 15, message = "Class section must be between 2 and 20 characters")
    private String section;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;


}
