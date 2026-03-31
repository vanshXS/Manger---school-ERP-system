package com.vansh.manger.Manger.exam.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * DRY: Centralised exam-to-DTO mapping.
 * Used by both AdminExamService (admin side) and TeacherMarkService (teacher side)
 * to eliminate duplicated mapping logic.
 */
@Component
@RequiredArgsConstructor
public class ExamResponseMapper {

    private final ExamSubjectRepository examSubjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentSubjectMarksRepository marksRepository;

    /**
     * Maps an Exam entity to a basic ExamResponseDTO (without statistics).
     */
    public ExamResponseDTO toBasicDTO(Exam exam) {
        Classroom c = exam.getClassroom();
        String classroomName = (c.getGradeLevel() != null && c.getSection() != null)
                ? c.getGradeLevel().getDisplayName() + " - " + c.getSection().toUpperCase()
                : c.getSection().toUpperCase();

        return ExamResponseDTO.builder()
                .id(exam.getId())
                .name(exam.getName())
                .examType(exam.getExamType())
                .status(exam.getStatus())
                .startDate(exam.getStartDate())
                .endDate(exam.getEndDate())
                .totalMarks(exam.getTotalMarks())
                .description(exam.getDescription())
                .classroomId(c.getId())
                .classroomName(classroomName)
                .academicYearId(exam.getAcademicYear().getId())
                .academicYearName(exam.getAcademicYear().getName())
                .createdAt(exam.getCreatedAt())
                .subjectCount((int) examSubjectRepository.countByExam_Id(exam.getId()))
                .totalStudents(null)
                .marksEnteredCount(null)
                .classAverage(null)
                .passCount(null)
                .failCount(null)
                .build();
    }

    /**
     * Maps an Exam entity to an ExamResponseDTO with full statistics (student counts, averages, pass/fail).
     */
    public ExamResponseDTO toDTOWithStats(Exam exam) {
        ExamResponseDTO dto = toBasicDTO(exam);

        List<Enrollment> enrollments = enrollmentRepository
                .findByClassroomAndAcademicYear(exam.getClassroom(), exam.getAcademicYear());
        int totalStudents = enrollments.size();
        dto.setTotalStudents(totalStudents);

        if (totalStudents == 0) {
            dto.setMarksEnteredCount(0);
            dto.setClassAverage(0.0);
            dto.setPassCount(0);
            dto.setFailCount(0);
            return dto;
        }

        List<StudentSubjectMarks> allMarks = marksRepository.findByExam_Id(exam.getId());
        List<Long> enrolledEnrollmentIds = enrollments.stream()
                .map(Enrollment::getId)
                .toList();

        List<StudentSubjectMarks> relevantMarks = allMarks.stream()
                .filter(m -> enrolledEnrollmentIds.contains(m.getEnrollment().getId()))
                .toList();

        long studentsWithMarks = relevantMarks.stream()
                .map(m -> m.getEnrollment().getStudent().getId())
                .distinct()
                .count();
        dto.setMarksEnteredCount((int) studentsWithMarks);

        if (!relevantMarks.isEmpty()) {
            double avg = relevantMarks.stream()
                    .mapToDouble(m -> (m.getMarksObtained() / m.getTotalMarks()) * 100)
                    .average()
                    .orElse(0.0);
            dto.setClassAverage(Math.round(avg * 100.0) / 100.0);

            long passCount = relevantMarks.stream()
                    .filter(m -> (m.getMarksObtained() / m.getTotalMarks()) * 100 >= 40.0)
                    .map(m -> m.getEnrollment().getStudent().getId())
                    .distinct()
                    .count();
            dto.setPassCount((int) passCount);
            dto.setFailCount((int) studentsWithMarks - (int) passCount);
        } else {
            dto.setClassAverage(0.0);
            dto.setPassCount(0);
            dto.setFailCount(0);
        }

        return dto;
    }
}
