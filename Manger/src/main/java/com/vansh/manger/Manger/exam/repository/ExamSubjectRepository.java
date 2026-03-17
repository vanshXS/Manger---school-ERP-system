package com.vansh.manger.Manger.exam.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vansh.manger.Manger.exam.entity.ExamSubject;

@Repository
public interface ExamSubjectRepository extends JpaRepository<ExamSubject, Long> {

    /** All subject papers for a given exam, ordered by date then start time */
    List<ExamSubject> findByExam_IdOrderByExamDateAscStartTimeAsc(Long examId);

    /** Find a specific exam-subject paper */
    Optional<ExamSubject> findByIdAndExam_Id(Long id, Long examId);

    /** Check if a subject paper already exists for this exam */
    boolean existsByExam_IdAndSubject_Id(Long examId, Long subjectId);

    /** Find ExamSubject by exam and subject */
    Optional<ExamSubject> findByExam_IdAndSubject_Id(Long examId, Long subjectId);

    /** Count papers in an exam */
    long countByExam_Id(Long examId);

    /** Delete all papers for an exam */
    void deleteAllByExam_Id(Long examId);
}
