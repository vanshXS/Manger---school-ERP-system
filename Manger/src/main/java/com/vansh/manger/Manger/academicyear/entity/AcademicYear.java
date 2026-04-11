package com.vansh.manger.Manger.academicyear.entity;

import com.vansh.manger.Manger.common.entity.BaseEntity;
import com.vansh.manger.Manger.common.entity.School;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;

@Entity
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
@Table(
    name = "academic_year",
    uniqueConstraints = @UniqueConstraint(columnNames = { "school_id", "name" }),
    indexes = {
        @Index(columnList = "school_id"),
        @Index(columnList = "school_id, is_current"),
        @Index(columnList = "school_id, closed")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYear extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent = false;

    @Column(nullable = false)
    private Boolean closed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
}