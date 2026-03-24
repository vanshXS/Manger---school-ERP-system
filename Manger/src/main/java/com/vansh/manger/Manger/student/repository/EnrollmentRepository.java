package com.vansh.manger.Manger.student.repository;

import com.vansh.manger.Manger.academicyear.entity.*;
import com.vansh.manger.Manger.attendance.entity.*;
import com.vansh.manger.Manger.auth.entity.*;
import com.vansh.manger.Manger.classroom.entity.*;
import com.vansh.manger.Manger.common.entity.*;
import com.vansh.manger.Manger.exam.entity.*;
import com.vansh.manger.Manger.student.entity.*;
import com.vansh.manger.Manger.subject.entity.*;
import com.vansh.manger.Manger.teacher.entity.*;
import com.vansh.manger.Manger.timetable.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> , JpaSpecificationExecutor<Enrollment> {

    /**
     * Counts how many students are enrolled in a specific class for a specific year.
     * This is used to generate the next roll number.
     */
    long countByClassroomAndAcademicYearAndSchool_Id(Classroom classroom, AcademicYear academicYear, Long schoolId);

    /**
     * Finds the specific enrollment for a student in the current year.
     */
    @EntityGraph(attributePaths = {"student", "classroom", "academicYear"})
    Optional<Enrollment> findByStudentAndSchool_IdAndAcademicYearIsCurrent(Student student, Long school_Id, boolean isCurrent);

    /**
     * Finds all enrollments for a specific classroom and academic year.
     */
    List<Enrollment> findByClassroomAndSchool_IdAndAcademicYear(Classroom classroom, Long schoolId, AcademicYear academicYear);

    /**
     * Deletes all enrollments for a given student ID.
     * Part of the delete cascade.
     */
    @Transactional
    void deleteByStudentId(Long studentId);

    long countByAcademicYear(AcademicYear currentYear);

    boolean existsByClassroom(Classroom classroom);
    boolean existsByAcademicYearAndStudent(AcademicYear academicYear, Student student);
    boolean existsByStudentAndClassroomAndAcademicYear(Student student, Classroom classroom,AcademicYear academicYear);

    List<Enrollment> findByClassroomId(Long classroomId);

    Optional<Enrollment> findActiveByStudent(Student student);
    @EntityGraph(attributePaths = {"student", "classroom", "academicYear"})
    List<Enrollment> findByClassroomAndAcademicYear(Classroom classroom, AcademicYear academicYear);
    int countByClassroomAndAcademicYearAndStatus(Classroom classroom, AcademicYear academicYear, StudentStatus status);

    /** All enrollments for a student within a school (academic year history). */
    @EntityGraph(attributePaths = {"student", "classroom", "academicYear"})
    List<Enrollment> findByStudentAndSchool_IdOrderByAcademicYear_StartDateDesc(Student student, Long schoolId);

    /** Find specific enrollment for a student in a given academic year. */
    @EntityGraph(attributePaths = {"student", "classroom", "academicYear"})
    Optional<Enrollment> findByStudentAndAcademicYear(Student student, AcademicYear academicYear);

    @EntityGraph(attributePaths = {"student", "classroom", "academicYear"})
    List<Enrollment> findByStudentInAndSchool_IdAndAcademicYearIsCurrent(List<Student> students, Long schoolId, boolean isCurrent);

    @EntityGraph(attributePaths = {"student", "classroom", "academicYear"})
    List<Enrollment> findByClassroomInAndAcademicYear(List<Classroom> classrooms, AcademicYear academicYear);

    @Query("""
            select e.classroom.id, count(e)
            from Enrollment e
            where e.school.id = :schoolId
              and e.academicYear.isCurrent = true
              and e.classroom.id in :classroomIds
            group by e.classroom.id
            """)
    List<Object[]> countCurrentEnrollmentsByClassroomIds(@Param("schoolId") Long schoolId,
                                                         @Param("classroomIds") List<Long> classroomIds);

    @Query("""
            select e.classroom.id, count(e)
            from Enrollment e
            where e.academicYear = :academicYear
              and e.status = :status
              and e.classroom.id in :classroomIds
            group by e.classroom.id
            """)
    List<Object[]> countByClassroomIdsAndAcademicYearAndStatus(@Param("classroomIds") List<Long> classroomIds,
                                                               @Param("academicYear") AcademicYear academicYear,
                                                               @Param("status") StudentStatus status);

}


