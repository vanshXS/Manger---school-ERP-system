package com.vansh.manger.Manger.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "attendance",
 uniqueConstraints = {@UniqueConstraint(columnNames = {"student_id","date","classroom_id"})}
)
@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
   private Student student;


    @ManyToOne(fetch = FetchType.LAZY)
   private Teacher markedBy;

    @ManyToOne(fetch = FetchType.LAZY)
   private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    private AcademicYear academicYear;

    @Column(name = "date", nullable = false)
    private LocalDate localDate;
    @Column(nullable = false)
    private boolean present;
}
