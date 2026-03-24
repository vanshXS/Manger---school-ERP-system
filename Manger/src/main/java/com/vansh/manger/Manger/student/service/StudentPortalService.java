package com.vansh.manger.Manger.student.service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.RiskScoreCalculator;
import com.vansh.manger.Manger.common.util.StudentSchoolConfig;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.dto.*;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.timetable.entity.TimeTable;
import com.vansh.manger.Manger.timetable.repository.TimeTableRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Concrete implementation of {@link StudentPortalOperations}.
 *
 * <p>SOLID compliance:</p>
 * <ul>
 *   <li><b>SRP</b> — only handles student-portal read operations;
 *       risk scoring delegated to {@link RiskScoreCalculator}.</li>
 *   <li><b>OCP</b> — new portal features add new methods without
 *       modifying existing ones.</li>
 *   <li><b>LSP</b> — implements {@link StudentPortalOperations} faithfully.</li>
 *   <li><b>ISP</b> — interface exposes only what the controller needs.</li>
 *   <li><b>DIP</b> — depends on repository abstractions, not concrete classes.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentPortalService implements StudentPortalOperations {

    private final StudentSchoolConfig studentSchoolConfig;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final ExamRepository examRepository;
    private final TimeTableRepository timeTableRepository;
    private final AcademicYearRepository academicYearRepository;

    // ──────────────────────────────────────────────────────────────
    //  Profile
    // ──────────────────────────────────────────────────────────────

    @Override
    public StudentResponseDTO getMyProfile() {

        Student student = studentSchoolConfig.currentStudent();
        Enrollment enrollment = studentSchoolConfig.getCurrentEnrollment();

        return StudentResponseDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .email(student.getEmail())
                .phoneNumber(student.getPhoneNumber())
                .profilePictureUrl(student.getProfilePictureUrl())
                .admissionNo(student.getAdmissionNo())
                .gender(student.getGender())
                .rollNo(enrollment.getRollNo())
                .status(enrollment.getStatus())
                .academicYearName(enrollment.getAcademicYear().getName())
                // Parent Details
                .fatherName(student.getFatherName())
                .motherName(student.getMotherName())
                .guardianName(student.getGuardianName())
                .parentPhonePrimary(student.getParentPhonePrimary())
                .parentPhoneSecondary(student.getParentPhoneSecondary())
                .parentEmail(student.getParentEmail())
                .parentOccupation(student.getParentOccupation())
                .annualIncome(student.getAnnualIncome())
                // Address
                .fullAddress(student.getFullAddress())
                .city(student.getCity())
                .state(student.getState())
                .pincode(student.getPincode())
                // Health & Emergency
                .medicalConditions(student.getMedicalConditions())
                .allergies(student.getAllergies())
                .emergencyContactName(student.getEmergencyContactName())
                .emergencyContactNumber(student.getEmergencyContactNumber())
                // Previous School & Transport
                .previousSchoolName(student.getPreviousSchoolName())
                .previousClass(student.getPreviousClass())
                .admissionDate(student.getAdmissionDate())
                .transportRequired(student.getTransportRequired())
                .hostelRequired(student.getHostelRequired())
                .feeCategory(student.getFeeCategory())
                .classroomResponseDTO(ClassroomResponseDTO.builder()
                        .id(enrollment.getClassroom().getId())
                        .gradeLevel(enrollment.getClassroom().getGradeLevel())
                        .section(enrollment.getClassroom().getSection())
                        .build())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    //  Academic Year Switcher
    // ──────────────────────────────────────────────────────────────

    @Override
    public List<StudentAcademicYearDTO> getAcademicYears() {

        Student student = studentSchoolConfig.currentStudent();
        School school = studentSchoolConfig.requireCurrentSchool();

        List<Enrollment> enrollments = enrollmentRepository
                .findByStudentAndSchool_IdOrderByAcademicYear_StartDateDesc(student, school.getId());

        return enrollments.stream()
                .map(e -> StudentAcademicYearDTO.builder()
                        .id(e.getAcademicYear().getId())
                        .name(e.getAcademicYear().getName())
                        .isCurrent(e.getAcademicYear().getIsCurrent())
                        .build())
                .toList();
    }

    // ──────────────────────────────────────────────────────────────
    //  Attendance Summary (yearly)
    // ──────────────────────────────────────────────────────────────

    @Override
    public StudentAttendanceSummaryDTO getAttendanceSummary(Long academicYearId) {

        Enrollment enrollment = resolveEnrollmentForYear(academicYearId);
        List<Attendance> records = attendanceRepository
                .findByEnrollmentAndAcademicYear(enrollment, enrollment.getAcademicYear());

        long total   = records.size();
        long present = records.stream()
                .filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT)
                .count();
        long absent  = total - present;

        Double pct = total == 0 ? null : roundTwo((present * 100.0) / total);

        return StudentAttendanceSummaryDTO.builder()
                .totalDays(total)
                .presentDays(present)
                .absentDays(absent)
                .percentage(pct)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    //  Monthly Attendance Comparison
    // ──────────────────────────────────────────────────────────────

    @Override
    public StudentAttendanceMonthDTO getMonthlyAttendance(int year, int month) {

        Enrollment enrollment = studentSchoolConfig.getCurrentEnrollment();
        AcademicYear academicYear = enrollment.getAcademicYear();

        List<Attendance> allRecords = attendanceRepository
                .findByEnrollmentAndAcademicYear(enrollment, academicYear);

        Double currentPct  = attendancePercentageForMonth(allRecords, year, month);

        // handle January → December of previous year
        int prevMonth = month == 1 ? 12 : month - 1;
        int prevYear  = month == 1 ? year - 1 : year;
        Double prevPct = attendancePercentageForMonth(allRecords, prevYear, prevMonth);

        Double delta = (currentPct != null && prevPct != null)
                ? roundTwo(currentPct - prevPct) : null;

        return StudentAttendanceMonthDTO.builder()
                .currentMonth(month)
                .currentYear(year)
                .currentPercentage(currentPct)
                .previousMonth(prevMonth)
                .previousYear(prevYear)
                .previousPercentage(prevPct)
                .delta(delta)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    //  Exams
    // ──────────────────────────────────────────────────────────────

    @Override
    public List<StudentExamDTO> getExams(Long academicYearId) {

        Enrollment enrollment = resolveEnrollmentForYear(academicYearId);
        School school = studentSchoolConfig.requireCurrentSchool();

        List<Exam> exams = examRepository.findFiltered(
                school.getId(), academicYearId, enrollment.getClassroom().getId(), null);

        return exams.stream()
                .map(e -> StudentExamDTO.builder()
                        .id(e.getId())
                        .name(e.getName())
                        .examType(e.getExamType())
                        .status(e.getStatus())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .totalMarks(e.getTotalMarks())
                        .build())
                .toList();
    }

    @Override
    public StudentExamResultDTO getExamResults(Long examId) {

        Student student = studentSchoolConfig.currentStudent();
        School school = studentSchoolConfig.requireCurrentSchool();

        // verify exam belongs to student's school
        Exam exam = examRepository.findByIdAndSchool_Id(examId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Exam not found"));

        List<StudentSubjectMarks> marks = marksRepository
                .findByEnrollment_StudentAndExam_Id(student, examId);

        List<StudentExamResultDTO.SubjectMarkDTO> subjects = marks.stream()
                .map(m -> {
                    double pct = (m.getTotalMarks() != null && m.getTotalMarks() > 0)
                            ? roundTwo((m.getMarksObtained() / m.getTotalMarks()) * 100.0) : 0.0;
                    return StudentExamResultDTO.SubjectMarkDTO.builder()
                            .subjectName(m.getSubject().getName())
                            .marksObtained(m.getMarksObtained())
                            .totalMarks(m.getTotalMarks())
                            .percentage(pct)
                            .grade(m.getGrade())
                            .build();
                })
                .sorted(Comparator.comparing(StudentExamResultDTO.SubjectMarkDTO::getSubjectName))
                .toList();

        return StudentExamResultDTO.builder()
                .examName(exam.getName())
                .subjects(subjects)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    //  Timetable
    // ──────────────────────────────────────────────────────────────

    @Override
    public List<StudentTimetableDTO> getTimetable() {

        Enrollment enrollment = studentSchoolConfig.getCurrentEnrollment();
        Long classroomId = enrollment.getClassroom().getId();

        List<TimeTable> entries = timeTableRepository
                .findByTeacherAssignment_Classroom_Id(classroomId);

        return entries.stream()
                .sorted(Comparator.comparing(TimeTable::getDay)
                        .thenComparing(TimeTable::getStartTime))
                .map(tt -> StudentTimetableDTO.builder()
                        .day(tt.getDay())
                        .startTime(tt.getStartTime())
                        .endTime(tt.getEndTime())
                        .subjectName(tt.getTeacherAssignment().getSubject().getName())
                        .teacherName(tt.getTeacherAssignment().getTeacher().getFirstName()
                                + " " + tt.getTeacherAssignment().getTeacher().getLastName())
                        .build())
                .toList();
    }

    // ──────────────────────────────────────────────────────────────
    //  MVP: Student Self Risk Analysis
    // ──────────────────────────────────────────────────────────────

    @Override
    public StudentRiskAnalysisDTO getRiskAnalysis() {

       
        Enrollment enrollment = studentSchoolConfig.getCurrentEnrollment();
        AcademicYear currentYear = enrollment.getAcademicYear();

        List<Attendance> attendance = attendanceRepository
                .findByEnrollmentAndAcademicYear(enrollment, currentYear);

        List<StudentSubjectMarks> marks = marksRepository
                .findByEnrollmentIn(List.of(enrollment));

        // delegate to shared calculator (SRP — no duplication)
        RiskScoreCalculator.RiskResult result = RiskScoreCalculator.computeRisk(attendance, marks);

        return StudentRiskAnalysisDTO.builder()
                .riskScore(result.riskScore())
                .riskLevel(result.riskLevel())
                .attendancePercentage(result.attendancePercentage())
                .averagePercentage(result.averagePercentage())
                .weakestSubject(result.weakestSubject())
                .reasons(result.reasons())
                .recommendedAction(result.recommendedAction())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────────────────────

    /**
     * Resolves the enrollment for a given academic year, verifying the
     * student was actually enrolled that year.
     */
    private Enrollment resolveEnrollmentForYear(Long academicYearId) {

        Student student = studentSchoolConfig.currentStudent();
        School school = studentSchoolConfig.requireCurrentSchool();

        AcademicYear year = academicYearRepository
                .findByIdAndSchool_Id(academicYearId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found for id: " + academicYearId));

        return enrollmentRepository.findByStudentAndAcademicYear(student, year)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Student was not enrolled in academic year: " + year.getName()));
    }

    /**
     * Computes attendance % for a specific month from a pre-fetched list.
     * Returns null if no records exist for that month (per SRS spec).
     */
    private Double attendancePercentageForMonth(List<Attendance> allRecords, int year, int month) {

        List<Attendance> monthRecords = allRecords.stream()
                .filter(a -> a.getLocalDate().getMonthValue() == month
                        && a.getLocalDate().getYear() == year)
                .toList();

        if (monthRecords.isEmpty()) return null;

        long present = monthRecords.stream()
                .filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT)
                .count();

        return roundTwo((present * 100.0) / monthRecords.size());
    }

    private static double roundTwo(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
