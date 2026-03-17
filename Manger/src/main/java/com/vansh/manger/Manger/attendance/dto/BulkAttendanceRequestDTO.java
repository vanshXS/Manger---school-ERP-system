package com.vansh.manger.Manger.attendance.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import com.vansh.manger.Manger.student.dto.StudentAttendanceRecord;

@Data
@Builder
@AllArgsConstructor @NoArgsConstructor
public class BulkAttendanceRequestDTO {

    @NotNull(message = "ClassroomId cannot be blank")
    private Long classroomId;

    @PastOrPresent(message = "Date cannot be null")
    private LocalDate date;

    @NotNull(message = "StudentRecords cannot be null")
    private List<StudentAttendanceRecord> records;
}


