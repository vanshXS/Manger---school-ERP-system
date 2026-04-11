package com.vansh.manger.Manger.timetable.entity;

import com.vansh.manger.Manger.common.entity.BaseEntity;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class TimeTable extends BaseEntity {

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