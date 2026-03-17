package com.vansh.manger.Manger.attendance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.teacher.entity.Teacher;

@Entity
@Table(name = "attendance",
 uniqueConstraints = {@UniqueConstraint(columnNames = {"enrollment_id", "date"})}
)
@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id")
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
   private Teacher markedBy;


    @Enumerated(EnumType.STRING)
    private AttendanceStatus attendanceStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    private AcademicYear academicYear;

    @Column(name = "date", nullable = false)
    private LocalDate localDate;


}
