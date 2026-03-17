package com.vansh.manger.Manger.student.repository;

import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentSubjectEnrollmentRepository extends JpaRepository<StudentSubjectEnrollment, Long> {

    boolean existsByStudentAndSubject(Student student, Subject subject);

    List<StudentSubjectEnrollment> findByStudentId(Long studentId);

    void deleteByStudentAndSubject(Student student, Subject subject);

    Optional<StudentSubjectEnrollment> findByStudentAndSubject(Student student, Subject subject);

    void deleteByStudentId(Long studentId);
}
