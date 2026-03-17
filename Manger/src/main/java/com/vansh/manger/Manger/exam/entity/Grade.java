package com.vansh.manger.Manger.exam.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import com.vansh.manger.Manger.teacher.entity.Teacher;

@Entity
@Table(name = "grades")
@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

    @Column(name = "value", length = 50)
    private String value;

    @Column(name = "assigned_at")
    private LocalDateTime assignAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_teacher_id")
    private Teacher assignedBy;

}
