package com.vansh.manger.Manger.teacher.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.attendance.service.AttendanceService;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;
import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.teacher.dto.TeacherDashboardResponseDTO;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.timetable.entity.TimeTable;
import com.vansh.manger.Manger.timetable.repository.TimeTableRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TeacherDashboardService {

    private final TeacherRespository teacherRepository;
    private final TeacherSchoolConfig schoolConfig;
    private final AcademicYearRepository academicYearRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final TimeTableRepository timeTableRepository;
    private final AttendanceService attendanceService;
    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamRepository examRepository;
    private final StudentSubjectMarksRepository marksRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public TeacherDashboardResponseDTO getDashboardSummary() {
        School currentSchool = schoolConfig.requireCurrentSchool();
        String userEmail = schoolConfig.getTeacher().getEmail();

        Teacher teacher = teacherRepository.findByEmailAndSchool_Id(userEmail, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found with this id"));

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByTeacherAndAcademicYear(teacher, currentYear);

        int classesAssigned = (int) assignments.stream()
                .map(a -> a.getClassroom().getId())
                .distinct()
                .count();

        int subjectsTaught = (int) assignments.stream()
                .map(a -> a.getSubject().getId())
                .distinct()
                .count();

        List<ClassroomAttendanceStatsDTO> classroomStats = new ArrayList<>(attendanceService.getAssignedClassrooms());
        int totalStudents = classroomStats.stream()
                .mapToInt(ClassroomAttendanceStatsDTO::getActiveStudents)
                .sum();

        List<TimeTable> allTimeTable = timeTableRepository.findByTeacherAssignment_Teacher_Id(teacher.getId());
        int weeklyClasses = allTimeTable.size();

        TeacherDashboardResponseDTO.QuickStats quickStats = TeacherDashboardResponseDTO.QuickStats.builder()
                .totalStudentsTaught(totalStudents)
                .weeklyClasses(weeklyClasses)
                .classesAssigned(classesAssigned)
                .subjectsTaught(subjectsTaught)
                .build();

        DayOfWeek today = LocalDate.now().getDayOfWeek();
        List<TimeTable> todayTimeTable = timeTableRepository.findByTeacherAssignment_Teacher_IdAndDay(
                teacher.getId(), today);

        List<TeacherDashboardResponseDTO.TodayClassDTO> todayClasses = todayTimeTable.stream()
                .sorted(Comparator.comparing(TimeTable::getStartTime))
                .map(tt -> {
                    String timeSlot = formatTime(tt.getStartTime()) + " - " + formatTime(tt.getEndTime());
                    String className = formatClassName(
                            tt.getTeacherAssignment().getClassroom().getGradeLevel().getDisplayName(),
                            tt.getTeacherAssignment().getClassroom().getSection());
                    return TeacherDashboardResponseDTO.TodayClassDTO.builder()
                            .id(tt.getId())
                            .subjectName(tt.getTeacherAssignment().getSubject().getName())
                            .className(className)
                            .timeSlot(timeSlot)
                            .startTime(tt.getStartTime())
                            .endTime(tt.getEndTime())
                            .build();
                })
                .toList();

        List<TeacherDashboardResponseDTO.WeakStudentDTO> weakStudents = buildWeakStudentQueue(assignments, currentYear);
        List<TeacherDashboardResponseDTO.PendingTaskDTO> pendingTasks = buildPendingTasks(assignments, currentYear);

        Page<ActivityLogDTO> recentActivityPage = activityLogService.getActivityLogsByRole(
                "TEACHER", currentSchool.getId(), Pageable.ofSize(5));
        List<ActivityLogDTO> recentActivities = new ArrayList<>(recentActivityPage.getContent());

        return TeacherDashboardResponseDTO.builder()
                .quickStats(quickStats)
                .todayClasses(todayClasses)
                .pendingTasks(pendingTasks)
                .weakStudents(weakStudents)
                .recentActivity(recentActivities)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getAllActivityLogs(Pageable pageable) {
        School currentSchool = schoolConfig.requireCurrentSchool();
        return activityLogService.getActivityLogsByRole("TEACHER", currentSchool.getId(), pageable);
    }

    private List<TeacherDashboardResponseDTO.WeakStudentDTO> buildWeakStudentQueue(
            List<TeacherAssignment> assignments,
            AcademicYear currentYear) {

        List<Enrollment> enrollments = assignments.stream()
                .map(TeacherAssignment::getClassroom)
                .distinct()
                .flatMap(classroom -> enrollmentRepository.findByClassroomAndAcademicYear(classroom, currentYear).stream())
                .filter(enrollment -> enrollment.getStatus() == StudentStatus.ACTIVE)
                .toList();

        if (enrollments.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, Enrollment> enrollmentById = enrollments.stream()
                .collect(Collectors.toMap(Enrollment::getId, Function.identity()));

        Map<Long, List<Attendance>> attendanceByEnrollment = attendanceRepository
                .findByEnrollmentInAndAcademicYear(enrollments, currentYear)
                .stream()
                .collect(Collectors.groupingBy(a -> a.getEnrollment().getId()));

        Map<Long, List<StudentSubjectMarks>> marksByEnrollment = marksRepository.findByEnrollmentIn(enrollments)
                .stream()
                .collect(Collectors.groupingBy(m -> m.getEnrollment().getId()));

        return enrollmentById.values().stream()
                .map(enrollment -> toWeakStudentDTO(
                        enrollment,
                        attendanceByEnrollment.getOrDefault(enrollment.getId(), List.of()),
                        marksByEnrollment.getOrDefault(enrollment.getId(), List.of())))
                .filter(dto -> dto != null)
                .sorted(Comparator
                        .comparing(TeacherDashboardResponseDTO.WeakStudentDTO::getRiskScore, Comparator.reverseOrder())
                        .thenComparing(TeacherDashboardResponseDTO.WeakStudentDTO::getStudentName))
                .toList();
    }

    private List<TeacherDashboardResponseDTO.PendingTaskDTO> buildPendingTasks(
            List<TeacherAssignment> assignments,
            AcademicYear currentYear) {

        List<TeacherDashboardResponseDTO.PendingTaskDTO> tasks = new ArrayList<>();
        LocalDate today = LocalDate.now();

        assignments.stream()
                .map(TeacherAssignment::getClassroom)
                .distinct()
                .forEach(classroom -> {
                    List<Enrollment> classroomEnrollments = enrollmentRepository
                            .findByClassroomAndAcademicYear(classroom, currentYear)
                            .stream()
                            .filter(enrollment -> enrollment.getStatus() == StudentStatus.ACTIVE)
                            .toList();

                    boolean attendanceMarked = !classroomEnrollments.isEmpty()
                            && attendanceRepository.findByEnrollment_ClassroomAndLocalDate(classroom, today).size() >= classroomEnrollments.size();

                    if (!attendanceMarked) {
                        tasks.add(TeacherDashboardResponseDTO.PendingTaskDTO.builder()
                                .title("Mark attendance for " + formatClassName(
                                        classroom.getGradeLevel().getDisplayName(),
                                        classroom.getSection()))
                                .type("Attendance")
                                .actionUrl("/teacher/attendance")
                                .build());
                    }
                });

        List<Long> classroomIds = assignments.stream()
                .map(a -> a.getClassroom().getId())
                .distinct()
                .toList();

        if (!classroomIds.isEmpty()) {
            examRepository.findBySchool_IdOrderByStartDateDesc(schoolConfig.requireCurrentSchool().getId()).stream()
                    .filter(exam -> classroomIds.contains(exam.getClassroom().getId()))
                    .filter(exam -> exam.getAcademicYear() != null && exam.getAcademicYear().getId().equals(currentYear.getId()))
                    .filter(exam -> resolveExamStatus(exam.getStartDate(), exam.getEndDate(), exam.getStatus()) == ExamStatus.ONGOING)
                    .limit(3)
                    .forEach(exam -> tasks.add(TeacherDashboardResponseDTO.PendingTaskDTO.builder()
                            .title("Enter marks for " + exam.getName())
                            .type("Ongoing Exam")
                            .actionUrl("/teacher/exams")
                            .build()));
        }

        return tasks.stream().limit(6).toList();
    }

    private TeacherDashboardResponseDTO.WeakStudentDTO toWeakStudentDTO(
            Enrollment enrollment,
            List<Attendance> attendanceRecords,
            List<StudentSubjectMarks> marks) {

        double attendancePercentage = calculateAttendancePercentage(attendanceRecords);
        double averagePercentage = calculateAveragePercentage(marks);
        String weakestSubject = findWeakestSubject(marks);
        long failedSubjects = marks.stream()
                .filter(mark -> toPercentage(mark) < 40.0)
                .count();
        long absences = attendanceRecords.stream()
                .filter(record -> record.getAttendanceStatus() == AttendanceStatus.ABSENT)
                .count();

        int riskScore = 0;
        List<String> reasons = new ArrayList<>();

        if (!attendanceRecords.isEmpty()) {
            if (attendancePercentage < 75) {
                riskScore += 40;
                reasons.add("critical attendance drop");
            } else if (attendancePercentage < 85) {
                riskScore += 20;
                reasons.add("attendance below target");
            }
        }

        if (!marks.isEmpty()) {
            if (averagePercentage < 40) {
                riskScore += 40;
                reasons.add("average below passing");
            } else if (averagePercentage < 55) {
                riskScore += 25;
                reasons.add("low exam average");
            }

            if (failedSubjects >= 2) {
                riskScore += 20;
                reasons.add("multiple weak subjects");
            } else if (failedSubjects == 1 && weakestSubject != null) {
                riskScore += 10;
                reasons.add("needs support in " + weakestSubject);
            }
        }

        if (absences >= 3) {
            riskScore += 10;
            reasons.add("frequent absence pattern");
        }

        if (riskScore < 25) {
            return null;
        }

        String className = formatClassName(
                enrollment.getClassroom().getGradeLevel().getDisplayName(),
                enrollment.getClassroom().getSection());

        return TeacherDashboardResponseDTO.WeakStudentDTO.builder()
                .studentId(enrollment.getStudent().getId())
                .classroomId(enrollment.getClassroom().getId())
                .studentName(enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName())
                .className(className)
                .riskLevel(resolveRiskLevel(riskScore))
                .riskScore(riskScore)
                .attendancePercentage(attendanceRecords.isEmpty() ? null : roundTwoDecimals(attendancePercentage))
                .averagePercentage(marks.isEmpty() ? null : roundTwoDecimals(averagePercentage))
                .weakestSubject(weakestSubject)
                .reason(String.join(", ", reasons))
                .recommendedAction(buildRecommendedAction(attendancePercentage, averagePercentage, weakestSubject))
                .build();
    }

    private double calculateAttendancePercentage(List<Attendance> records) {
        if (records.isEmpty()) {
            return 100.0;
        }

        long presentCount = records.stream()
                .filter(record -> record.getAttendanceStatus() == AttendanceStatus.PRESENT)
                .count();

        return (presentCount * 100.0) / records.size();
    }

    private double calculateAveragePercentage(List<StudentSubjectMarks> marks) {
        if (marks.isEmpty()) {
            return 100.0;
        }

        return marks.stream()
                .mapToDouble(this::toPercentage)
                .average()
                .orElse(100.0);
    }

    private double toPercentage(StudentSubjectMarks mark) {
        if (mark.getMarksObtained() == null || mark.getTotalMarks() == null || mark.getTotalMarks() == 0) {
            return 0.0;
        }
        return (mark.getMarksObtained() / mark.getTotalMarks()) * 100.0;
    }

    private String findWeakestSubject(List<StudentSubjectMarks> marks) {
        return marks.stream()
                .min(Comparator.comparingDouble(this::toPercentage))
                .map(mark -> mark.getSubject().getName())
                .orElse(null);
    }

    private String resolveRiskLevel(int riskScore) {
        if (riskScore >= 60) {
            return "High";
        }
        if (riskScore >= 35) {
            return "Medium";
        }
        return "Watch";
    }

    private String buildRecommendedAction(double attendancePercentage, double averagePercentage, String weakestSubject) {
        if (attendancePercentage < 75 && averagePercentage < 40) {
            return "Call guardian this week and start a remedial follow-up plan.";
        }
        if (attendancePercentage < 75) {
            return "Check attendance barriers and contact home before the pattern deepens.";
        }
        if (weakestSubject != null && averagePercentage < 55) {
            return "Plan a short remedial revision in " + weakestSubject + " and recheck next assessment.";
        }
        return "Keep this student on a watchlist and review progress in the next class test.";
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private ExamStatus resolveExamStatus(LocalDate startDate, LocalDate endDate, ExamStatus currentStatus) {
        if (currentStatus == ExamStatus.COMPLETED) {
            return ExamStatus.COMPLETED;
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) {
            return ExamStatus.UPCOMING;
        }
        if (today.isAfter(endDate)) {
            return ExamStatus.COMPLETED;
        }
        return ExamStatus.ONGOING;
    }

    private String formatClassName(String gradeLevel, String section) {
        return gradeLevel + " - " + section;
    }

    private String formatTime(LocalTime time) {
        if (time == null) {
            return "--:--";
        }
        int hour = time.getHour();
        int minute = time.getMinute();
        String amPm = hour >= 12 ? "PM" : "AM";
        int h12 = hour % 12;
        if (h12 == 0) {
            h12 = 12;
        }
        return String.format("%d:%02d %s", h12, minute, amPm);
    }
}
