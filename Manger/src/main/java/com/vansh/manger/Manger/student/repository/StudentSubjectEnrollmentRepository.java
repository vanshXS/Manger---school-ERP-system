package com.vansh.manger.Manger.student.repository;

import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface StudentSubjectEnrollmentRepository extends JpaRepository<StudentSubjectEnrollment, Long> {

    boolean existsByStudentAndSubject(Student student, Subject subject);

    @EntityGraph(attributePaths = {"student", "subject"})
    List<StudentSubjectEnrollment> findByStudentId(Long studentId);

    @EntityGraph(attributePaths = {"student", "subject"})
    List<StudentSubjectEnrollment> findByStudentIdIn(List<Long> studentIds);

    void deleteByStudentAndSubject(Student student, Subject subject);

    @EntityGraph(attributePaths = {"student", "subject"})
    Optional<StudentSubjectEnrollment> findByStudentAndSubject(Student student, Subject subject);

    void deleteByStudentId(Long studentId);
}
