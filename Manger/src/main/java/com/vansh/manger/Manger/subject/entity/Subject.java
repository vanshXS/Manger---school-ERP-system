package com.vansh.manger.Manger.subject.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Fetch;

import java.util.Set;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;

@Entity
@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(
        name = "subjects",
        uniqueConstraints = @UniqueConstraint(columnNames = {"school_id", "code"})
)
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Subject name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Subject code is required")
    @Size(min = 3, max = 15)
    @Column(nullable = false, length = 15)
    private String code;

   @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
   @JsonInclude(JsonInclude.Include.NON_NULL)
   private Set<StudentSubjectMarks>studentSubjects;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "school_id", nullable = false)
   private School school;

   @OneToMany(mappedBy = "subject", cascade = CascadeType.PERSIST)
   @JsonIgnore
   private Set<TeacherAssignment> teacherAssignments;

}
