package com.vansh.manger.Manger.timetable.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;

@Entity
@AllArgsConstructor @NoArgsConstructor
@Data
@Builder
public class TimeTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DayOfWeek day;



    @Column(nullable = false)
    private LocalTime startTime;

    @Column
    private LocalTime endTime;

    @ManyToOne
    @JoinColumn(name = "teacher_assignment_id", nullable = false)
    private TeacherAssignment teacherAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

}
