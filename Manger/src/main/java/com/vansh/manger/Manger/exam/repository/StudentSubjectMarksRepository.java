package com.vansh.manger.Manger.exam.repository;

import java.util.List;
import java.util.Optional;

import com.vansh.manger.Manger.student.entity.Enrollment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.subject.entity.Subject;

import jakarta.transaction.Transactional;

@Repository
public interface StudentSubjectMarksRepository extends JpaRepository<StudentSubjectMarks, Long> {

    Optional<StudentSubjectMarks> findByEnrollment_StudentAndSubjectAndExam_Name(Student student, Subject subject, String examName);

    List<StudentSubjectMarks> findByEnrollment_StudentAndExam_Name(Student student, String examName);

    List<StudentSubjectMarks> findBySubjectAndExamName(Subject subject, String examName);

    @Transactional
    void deleteByEnrollment_StudentId(Long studentId);

    /**
     * Checks if an assignment already exists between a student and a subject.
     */
    boolean existsByEnrollment_StudentAndSubject(Student student, Subject subject);

    /**
     * Finds the specific assignment link between a student and a subject.
     */
    Optional<StudentSubjectMarks> findByEnrollment_StudentAndSubject(Student student, Subject subject);

    /**
     * Finds all elective subjects for a single student.
     * Used in the Student Profile.
     */
    List<StudentSubjectMarks> findByEnrollment_StudentId(Long studentId);

    List<StudentSubjectMarks> findByExamName(String examName);

    // New methods added for analytics and improved data integrity
    List<StudentSubjectMarks> findByExam_Id(Long examId);
    @EntityGraph(attributePaths = {"subject", "exam", "enrollment"})
    List<StudentSubjectMarks> findByEnrollmentIn(List<Enrollment> enrollments);

    Optional<StudentSubjectMarks> findByEnrollment_StudentAndSubjectAndExam_Id(Student student, Subject subject, Long examId);

    @EntityGraph(attributePaths = {"subject", "exam", "enrollment"})
    List<StudentSubjectMarks> findByEnrollment_StudentAndExam_Id(Student student, Long examId);

    List<StudentSubjectMarks> findBySubjectAndExam_Id(Subject subject, Long examId);
}
