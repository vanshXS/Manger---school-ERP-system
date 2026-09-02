package com.vansh.manger.Manger.student.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.mapper.StudentResponseMapper;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles read-only academic queries (exam results, attendance summary).
 *
 * <p><b>SRP</b> — one responsibility: academic data read operations.
 * <b>LSP</b> — faithfully implements {@link StudentAcademicQueryOperations}.
 * <b>DIP</b> — depends on {@link StudentResponseMapper} for exam-result mapping.
 * <b>OCP</b> — new query types (e.g. progress trends) can be added as new
 * methods without modifying existing ones.</p>
 */
@Service
@RequiredArgsConstructor
public class StudentAcademicQueryService implements StudentAcademicQueryOperations {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final StudentSubjectMarksRepository studentSubjectsRepository;
    private final AttendanceRepository attendanceRepository;
    private final AdminSchoolConfig getCurrentSchool;

    private final StudentResponseMapper studentResponseMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
        School school = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Page<Long> examIdPage = studentSubjectsRepository.findDistinctExamIdsByStudentId(student.getId(), pageable);
        List<Long> examIds = examIdPage.getContent();
        if (examIds.isEmpty()) {
            return new PageImpl<>(java.util.Collections.emptyList(), pageable, examIdPage.getTotalElements());
        }

        List<StudentSubjectMarks> pageMarks = studentSubjectsRepository
                .findByEnrollment_StudentIdAndExam_IdIn(student.getId(), examIds);

        Map<Long, List<StudentSubjectMarks>> marksByExam = pageMarks.stream()
                .filter(mark -> mark.getExam() != null)
                .collect(Collectors.groupingBy(mark -> mark.getExam().getId()));

        List<StudentExamResultDTO> results = examIds.stream()
                .filter(marksByExam::containsKey)
                .map(examId -> {
                    List<StudentSubjectMarks> marks = marksByExam.get(examId);
                    return studentResponseMapper.toExamResultDTO(marks.get(0).getExam(), marks);
                })
                .toList();

        return new PageImpl<>(results, pageable, examIdPage.getTotalElements());
    }

    @Override
    @Transactional
    public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
        School school = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElseThrow(() -> new EntityNotFoundException("Student has no current enrollment"));

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, school.getId())
                .orElseThrow(() -> new IllegalStateException("No active academic year"));

        List<Attendance> attendances = attendanceRepository.findByEnrollmentAndAcademicYear(
                currentEnrollment, currentYear);

        int totalWorkingDays = attendances.size();
        int daysPresent = (int) attendances.stream()
                .filter(attendance -> attendance.getAttendanceStatus() == AttendanceStatus.PRESENT)
                .count();
        int daysAbsent = totalWorkingDays - daysPresent;

        Double attendancePercentage = null;
        if (totalWorkingDays > 0) {
            attendancePercentage = (double) daysPresent / totalWorkingDays * 100.0;
            attendancePercentage = Math.round(attendancePercentage * 100.0) / 100.0;
        }

        return AttendanceSummaryDTO.builder()
                .attendancePercentage(attendancePercentage)
                .daysPresent(daysPresent)
                .daysAbsent(daysAbsent)
                .totalWorkingDays(totalWorkingDays)
                .build();
    }
}
