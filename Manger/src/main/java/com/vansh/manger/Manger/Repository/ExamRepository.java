package com.vansh.manger.Manger.Repository;

import com.vansh.manger.Manger.Entity.Exam;
import com.vansh.manger.Manger.Entity.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    // All exams for a school
    List<Exam> findBySchool_IdOrderByStartDateDesc(Long schoolId);

    // Exams for a specific classroom
    List<Exam> findByClassroom_IdAndSchool_IdOrderByStartDateDesc(Long classroomId, Long schoolId);

    // Exams for a specific academic year
    List<Exam> findByAcademicYear_IdAndSchool_IdOrderByStartDateDesc(Long academicYearId, Long schoolId);

    // Exams by status
    List<Exam> findBySchool_IdAndStatusOrderByStartDateDesc(Long schoolId, ExamStatus status);

    // Find exam by id scoped to school (security: prevent cross-school access)
    Optional<Exam> findByIdAndSchool_Id(Long id, Long schoolId);

    // Check duplicate name for same classroom + academic year
    boolean existsByNameIgnoreCaseAndClassroom_IdAndAcademicYear_IdAndSchool_Id(
            String name, Long classroomId, Long academicYearId, Long schoolId
    );

    // Count exams per classroom in a year
    long countByClassroom_IdAndAcademicYear_IdAndSchool_Id(Long classroomId, Long academicYearId, Long schoolId);

    // All exams in a year + classroom + status (used for filtering in frontend)
    @Query("SELECT e FROM Exam e WHERE e.school.id = :schoolId " +
           "AND (:academicYearId IS NULL OR e.academicYear.id = :academicYearId) " +
           "AND (:classroomId IS NULL OR e.classroom.id = :classroomId) " +
           "AND (:status IS NULL OR e.status = :status) " +
           "ORDER BY e.startDate DESC")
    List<Exam> findFiltered(
            @Param("schoolId") Long schoolId,
            @Param("academicYearId") Long academicYearId,
            @Param("classroomId") Long classroomId,
            @Param("status") ExamStatus status
    );
}
