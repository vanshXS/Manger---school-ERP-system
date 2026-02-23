package com.vansh.manger.Manger.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@Table(
        name = "classrooms",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grade_level", "section", "school_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Changed from int to GradeLevel enum.
     * Stored as STRING in DB — covers Nursery, LKG, UKG, Grade 1–12.
     * Use gradeLevel.next() in promotion logic instead of gradeLevel + 1.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "grade_level")
    private GradeLevel gradeLevel;

    @Column(name = "section", nullable = false)
    private String section;

    @Column(nullable = false)
    private int capacity;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Enrollment> enrollments;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeacherAssignment> teacherAssignments;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClassroomStatus status = ClassroomStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    @JsonIgnore
    private School school;

    /**
     * Optional explicit promotion target.
     * If set, promotion uses this instead of auto-matching by section.
     * Mirrors how real schools work — principal decides which section students move to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotes_to_classroom_id")
    @JsonIgnore
    private Classroom promotesToClassroom;
}