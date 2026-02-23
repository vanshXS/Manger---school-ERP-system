package com.vansh.manger.Manger.Repository;

import java.util.List;
import java.util.Optional;

import com.vansh.manger.Manger.Entity.GradeLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.vansh.manger.Manger.Entity.Classroom;
import com.vansh.manger.Manger.Entity.ClassroomStatus;
import com.vansh.manger.Manger.Entity.School;

@Repository
public interface ClassroomRespository extends JpaRepository<Classroom, Long>, JpaSpecificationExecutor<Classroom> {

    // --- NEW SCHOOL-SCOPED METHODS ---

    /** Finds all classrooms for a specific school with a specific status. */
    List<Classroom> findBySchoolAndStatus(School school, ClassroomStatus status);

    /** Checks if a classroom section exists WITHIN a specific school. */
    boolean existsBySectionAndSchool(String section, School school);

    /** Finds a classroom by section WITHIN a specific school. */
    Optional<Classroom> findBySectionAndSchool(String section, School school);

    /** Finds a classroom by ID and ensures it belongs to the given school. */
    Optional<Classroom> findByIdAndSchool(Long id, School school);

    List<Classroom> findBySchool_Id(Long schoolId);

    /**
     * Find classrooms that have enrollments in a specific year
     */
    @Query("SELECT DISTINCT c FROM Enrollment e " +
            "JOIN e.classroom c " +
            "WHERE e.academicYear.id = :yearId " +
            "AND e.school.id = :schoolId " +
            "AND (e.status = 'ACTIVE' OR e.status = 'COMPLETED')")
    List<Classroom> findClassroomsWithEnrollments(
            @Param("yearId") Long yearId,
            @Param("schoolId") Long schoolId
    );

    boolean existsByGradeLevelAndSectionAndSchool(GradeLevel gradeLevel, String section, School school);
    List<Classroom> findBySchoolOrderByGradeLevelAsc(School school);
    Optional<Classroom>findByIdAndSchool_Id(Long classroomId, Long schoolId);
    Optional<Classroom> findByGradeLevelAndSectionAndSchool(GradeLevel gradeLevel, String section, School school);
}
