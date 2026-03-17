package com.vansh.manger.Manger.exam.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.subject.entity.Subject;

@Entity
@Data
@NoArgsConstructor @AllArgsConstructor
@Table(name = "student_subject_marks" ,
 uniqueConstraints = @UniqueConstraint(columnNames =  {"enrollment_id", "subject_id", "exam_id"}))
@Builder
public class StudentSubjectMarks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private Double marksObtained;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

   private String grade;

   @Builder.Default
   private Double totalMarks = 100.0;

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
