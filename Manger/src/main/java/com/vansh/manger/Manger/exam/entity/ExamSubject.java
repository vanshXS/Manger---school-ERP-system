package com.vansh.manger.Manger.exam.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.vansh.manger.Manger.subject.entity.Subject;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "exam_subjects", uniqueConstraints = @UniqueConstraint(name = "uk_exam_subject", columnNames = {
        "exam_id", "subject_id" }), indexes = {
                @Index(name = "idx_exam_subject_exam_id", columnList = "exam_id"),
                @Index(name = "idx_exam_subject_date", columnList = "exam_date")
        })
public class ExamSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** The date this particular paper is scheduled */
    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    /** Optional start time for this paper */
    @Column(name = "start_time")
    private LocalTime startTime;

    /** Optional end time for this paper */
    @Column(name = "end_time")
    private LocalTime endTime;

    /** Maximum marks for this paper (e.g. 80, 50, 100) */
    @Column(name = "max_marks", nullable = false)
    @Builder.Default
    private Double maxMarks = 100.0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
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
