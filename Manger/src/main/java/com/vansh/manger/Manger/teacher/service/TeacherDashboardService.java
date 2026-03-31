package com.vansh.manger.Manger.teacher.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
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
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.common.util.RiskScoreCalculator;
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
import com.vansh.manger.Manger.common.util.ClassroomDisplayHelper;
import com.vansh.manger.Manger.exam.util.ExamStatusResolver;

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
    private final ExamStatusResolver examStatusResolver;


    @Transactional(readOnly = true)
    public TeacherDashboardResponseDTO getDashboardSummary() {
        School currentSchool = schoolConfig.requireCurrentSchool();
        Teacher teacher = schoolConfig.getTeacher();

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByTeacher(teacher);

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
                    String className = ClassroomDisplayHelper.formatName(
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

        List<ActivityLogDTO> recentActivities = new ArrayList<>(
                activityLogService.getRecentTeacherActivity(currentSchool.getId(), teacher.getId()));

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
        Teacher teacher = schoolConfig.getTeacher();
        return activityLogService.getTeacherActivityLogs(currentSchool.getId(), teacher.getId(), pageable);
    }

    private List<TeacherDashboardResponseDTO.WeakStudentDTO> buildWeakStudentQueue(
            List<TeacherAssignment> assignments,
            AcademicYear currentYear) {

        List<Classroom> classrooms = assignments.stream()
                .map(TeacherAssignment::getClassroom)
                .distinct()
                .toList();

        List<Enrollment> enrollments = enrollmentRepository.findByClassroomInAndAcademicYear(classrooms, currentYear).stream()
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
        List<Classroom> classrooms = assignments.stream()
                .map(TeacherAssignment::getClassroom)
                .distinct()
                .toList();

        Map<Long, List<Enrollment>> enrollmentsByClassroomId = enrollmentRepository
                .findByClassroomInAndAcademicYear(classrooms, currentYear)
                .stream()
                .filter(enrollment -> enrollment.getStatus() == StudentStatus.ACTIVE)
                .collect(Collectors.groupingBy(enrollment -> enrollment.getClassroom().getId()));

        Map<Long, Long> attendanceCountByClassroomId = classrooms.isEmpty()
                ? Map.of()
                : attendanceRepository.countByClassroomIdsAndLocalDate(
                                classrooms.stream().map(Classroom::getId).toList(),
                                today)
                        .stream()
                        .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        classrooms.forEach(classroom -> {
                    List<Enrollment> classroomEnrollments = enrollmentsByClassroomId
                            .getOrDefault(classroom.getId(), List.of());

                    boolean attendanceMarked = !classroomEnrollments.isEmpty()
                            && attendanceCountByClassroomId.getOrDefault(classroom.getId(), 0L) >= classroomEnrollments.size();

                    if (!attendanceMarked && !today.getDayOfWeek().equals(DayOfWeek.SUNDAY)) {
                        tasks.add(TeacherDashboardResponseDTO.PendingTaskDTO.builder()
                                .title("Mark attendance for " + ClassroomDisplayHelper.formatName(
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
                    .filter(exam -> examStatusResolver.resolve(exam.getStartDate(), exam.getEndDate(), exam.getStatus()) == ExamStatus.ONGOING)
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

        // delegate to shared utility (SRP — risk algorithm lives in one place)
        RiskScoreCalculator.RiskResult result = RiskScoreCalculator.computeRisk(attendanceRecords, marks);

        if (result.riskScore() < 25) {
            return null;
        }

        String className = ClassroomDisplayHelper.formatName(
                enrollment.getClassroom().getGradeLevel().getDisplayName(),
                enrollment.getClassroom().getSection());

        return TeacherDashboardResponseDTO.WeakStudentDTO.builder()
                .studentId(enrollment.getStudent().getId())
                .classroomId(enrollment.getClassroom().getId())
                .studentName(enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName())
                .className(className)
                .riskLevel(result.riskLevel())
                .riskScore(result.riskScore())
                .attendancePercentage(result.attendancePercentage())
                .averagePercentage(result.averagePercentage())
                .weakestSubject(result.weakestSubject())
                .reason(String.join(", ", result.reasons()))
                .recommendedAction(result.recommendedAction())
                .build();
    }

    // DRY: Removed resolveExamStatus — now uses ExamStatusResolver component
    // DRY: Removed formatClassName — now uses ClassroomDisplayHelper.formatName

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
