package com.vansh.manger.Manger.student.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import com.vansh.manger.Manger.subject.entity.Subject;

@Entity
@Table(name = "student_subject_enrollment",
 uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "subject_id"}))
@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StudentSubjectEnrollment {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Student student;

    @ManyToOne(optional = false)
    private Subject subject;

    @Column(nullable = false)
    private boolean mandatory; // true = auto-assigned

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
