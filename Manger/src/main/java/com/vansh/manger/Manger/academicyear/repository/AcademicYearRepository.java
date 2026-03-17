package com.vansh.manger.Manger.academicyear.repository;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {

    Optional<AcademicYear> findByIsCurrentAndSchool_Id(boolean isCurrent, Long schoolId);

    List<AcademicYear> findBySchool_IdOrderByStartDateDesc(Long schoolId);

    boolean existsBySchool_IdAndName(Long schoolId, String name);

    Optional<AcademicYear> findByIdAndSchool_Id(Long yearId, Long schoolId);

    Optional<AcademicYear> findByClosedAndSchool_Id(boolean isClosed, Long schoolId);

    Optional<AcademicYear> findTopByClosedTrueAndSchool_IdOrderByEndDateDesc(Long schoolId);

    List<AcademicYear> findBySchool_IdAndIdNot(Long schoolId, Long excludedId);

    @Modifying
    @Query("""
        UPDATE AcademicYear a
        SET a.isCurrent = false
        WHERE a.school.id = :schoolId AND a.isCurrent = true
    """)
    int unsetAllCurrentYearsBySchool(@Param("schoolId") Long schoolId);


    @Query("""
        SELECT ay FROM AcademicYear ay
        WHERE ay.school.id = :schoolId
          AND ay.endDate > :currentEndDate
          AND ay.isCurrent = false
        ORDER BY ay.endDate ASC
    """)
    List<AcademicYear> findNextAcademicYearCandidates(
            @Param("currentEndDate") LocalDate currentEndDate,
            @Param("schoolId") Long schoolId
    );

    default Optional<AcademicYear> findNextAcademicYear(LocalDate currentEndDate, Long schoolId) {
        List<AcademicYear> candidates = findNextAcademicYearCandidates(currentEndDate, schoolId);
        return candidates.isEmpty() ? Optional.empty() : Optional.of(candidates.get(0));
    }
}