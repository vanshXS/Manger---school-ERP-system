package com.vansh.manger.Manger.exam.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles student exam result analytics/reporting only.
 * Groups marks by exam, computes totals/percentages, and paginates results.
 */
@Service
@RequiredArgsConstructor
public class StudentExamResultService implements StudentExamResultOperations {

    private final TeacherSchoolConfig schoolConfig;
    private final StudentRepository studentRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final ExamStatusResolver examStatusResolver;

    @Override
    @Transactional(readOnly = true)
    public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
        School currentSchool = schoolConfig.requireCurrentSchool();
        Student student = studentRepository.findById(studentId)
                .filter(s -> s.getSchool().getId().equals(currentSchool.getId()))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<StudentSubjectMarks> allMarks = marksRepository.findByEnrollment_StudentId(studentId);

        Map<String, List<StudentSubjectMarks>> marksByExam = allMarks.stream()
                .filter(m -> m.getExam().getName() != null)
                .collect(Collectors.groupingBy(ss -> ss.getExam().getName()));

        List<StudentExamResultDTO> allResults = marksByExam.entrySet().stream()
                .map(entry -> {
                    String examName = entry.getKey();
                    List<StudentSubjectMarks> marks = entry.getValue();
                    StudentSubjectMarks firstMark = marks.get(0);
                    var exam = examStatusResolver.synchronize(firstMark.getExam());

                    List<StudentExamResultDTO.SubjectMark> subjectMarks = marks.stream().map(m ->
                        StudentExamResultDTO.SubjectMark.builder()
                                .subjectName(m.getSubject().getName())
                                .marksObtained(m.getMarksObtained())
                                .maxMarks(m.getTotalMarks() != null ? m.getTotalMarks() : 100.0)
                                .grade(m.getGrade())
                                .build()
                    ).collect(Collectors.toList());

                    double totalObtained = subjectMarks.stream()
                            .mapToDouble(m -> m.getMarksObtained() != null ? m.getMarksObtained() : 0).sum();
                    double totalMax = subjectMarks.stream()
                            .mapToDouble(m -> m.getMaxMarks() != null ? m.getMaxMarks() : 100).sum();
                    double percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

                    return StudentExamResultDTO.builder()
                            .examId(exam.getId())
                            .examName(examName)
                            .examStatus(exam.getStatus() != null ? exam.getStatus().getDisplayName() : "Completed")
                            .academicYearName(exam.getAcademicYear() != null ? exam.getAcademicYear().getName() : null)
                            .examType(exam.getExamType() != null ? exam.getExamType().name() : null)
                            .classroomName(exam.getClassroom() != null
                                    ? exam.getClassroom().getGradeLevel().getDisplayName() + " - "
                                            + exam.getClassroom().getSection()
                                    : null)
                            .totalObtained(totalObtained)
                            .totalMaxMarks(totalMax)
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .overallGrade(firstMark.getGrade())
                            .subjectMarks(subjectMarks)
                            .build();
                })
                .sorted((a, b) -> b.getExamId().compareTo(a.getExamId()))
                .collect(Collectors.toList());

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allResults.size());

        List<StudentExamResultDTO> pagedList;
        if (start > allResults.size()) {
            pagedList = new ArrayList<>();
        } else {
            pagedList = allResults.subList(start, end);
        }

        return new PageImpl<>(pagedList, pageable, allResults.size());
    }
}
