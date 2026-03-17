package com.vansh.manger.Manger.student.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;

@Entity
@Table(name = "enrollments",
uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "academic_year_id"}) ,
indexes = {
        @Index(columnList = "status"),
        @Index(columnList = "academic_year_id"),
        @Index(columnList = "classroom_id"),
        @Index(columnList = "student_id,academic_year_id")
}
)
@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String rollNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    private StudentStatus status = StudentStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @OneToMany(mappedBy = "enrollment", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<StudentSubjectMarks> studentSubjects;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
}
