package com.vansh.manger.Manger.teacher.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.subject.entity.Subject;

@Entity
@Table(
        name = "teacher_assignments",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"classroom_id", "subject_id"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ===============================
       RELATIONS
       =============================== */

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    /* ===============================
       BUSINESS LOGIC
       =============================== */

    /**
     * true  → mandatory subject (auto-assigned to students)
     * false → optional subject (student chooses)
     */
    @Column(nullable = false)
    private boolean mandatory = true;

    /* ===============================
       AUDIT
       =============================== */

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
