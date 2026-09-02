package com.vansh.manger.Manger.teacher.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;

@Repository
public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Long> {

    Optional<TeacherAssignment> findByTeacherAndClassroom(Teacher teacher, Classroom classroom);

    boolean existsByTeacherAndClassroom(Teacher teacher, Classroom classroom);

    boolean existsByClassroomAndSubject(Classroom classroom, Subject subject);

    boolean existsByTeacher(Teacher teacher);

    void deleteByTeacher(Teacher teacher);

    Optional<TeacherAssignment> findByClassroomAndSubject(Classroom classroom, Subject subject);

    @Query("SELECT ta.subject FROM TeacherAssignment ta WHERE ta.classroom.id = :classroomId")
    List<Subject> findSubjectByClassroom(@Param("classroomId") Long classroomId);

    @Query("""
            SELECT ta.teacher.id, count(ta)
            FROM TeacherAssignment ta
            WHERE ta.teacher.school.id = :schoolId
            GROUP BY ta.teacher.id
            """)
    List<Object[]> countAssignmentsGroupByTeacherId(@Param("schoolId") Long schoolId);

    @EntityGraph(attributePaths = {"classroom", "subject", "teacher"})
    List<TeacherAssignment> findByTeacher(Teacher teacher);

    @EntityGraph(attributePaths = {"classroom", "subject", "teacher"})
    List<TeacherAssignment> findByTeacherIn(List<Teacher> teachers);

    @Query("""
            SELECT ta
            FROM TeacherAssignment ta
            WHERE ta.teacher = :teacher
              AND EXISTS (
                    SELECT 1
                    FROM Enrollment e
                    WHERE e.classroom = ta.classroom
                      AND e.academicYear = :academicYear
              )
            """)
    List<TeacherAssignment> findByTeacherAndAcademicYear(@Param("teacher") Teacher teacher,
            @Param("academicYear") AcademicYear academicYear);

    Optional<TeacherAssignment> findByTeacher_IdAndSubject_IdAndClassroom_Id(Long teacherId, Long subjectId,
            Long classroomId);

    long countByTeacher(Teacher teacher);

    boolean existsBySubject(Subject subject);

    long countBySubject(Subject subject);

    boolean existsByClassroomAndSubjectAndTeacherIsNull(Classroom classroom, Subject subject);

    @EntityGraph(attributePaths = {"classroom", "subject", "teacher"})
    List<TeacherAssignment> findByClassroomId(Long classroomId);

    @EntityGraph(attributePaths = {"classroom", "subject", "teacher"})
    List<TeacherAssignment> findBySubject(Subject subject);

    boolean existsByClassroom(Classroom classroom);

    @EntityGraph(attributePaths = {"classroom", "subject", "teacher"})
    List<TeacherAssignment> findByClassroomAndMandatoryTrue(Classroom classroom);

    boolean existsByClassroomAndSubjectAndMandatoryTrue(
            Classroom classroom,
            Subject subject);

    @Query("SELECT s FROM Subject s JOIN TeacherAssignment ta ON s.id = ta.subject.id WHERE ta.classroom = :classroom AND ta.mandatory = true")
    List<Subject> findMandatorySubjectsByClassroom(@Param("classroom") Classroom classroom);

    @EntityGraph(attributePaths = {"classroom", "subject", "teacher"})
    @Query("select ta from TeacherAssignment ta where ta.classroom.school.id = :schoolId")
    List<TeacherAssignment> findAllBySchoolIdWithDetails(@Param("schoolId") Long schoolId);
}
