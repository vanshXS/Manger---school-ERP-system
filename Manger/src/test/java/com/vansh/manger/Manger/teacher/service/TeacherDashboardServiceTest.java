package com.vansh.manger.Manger.teacher.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.attendance.service.AttendanceService;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.dto.ActivityLogDTO;
import com.vansh.manger.Manger.common.entity.GradeLevel;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamType;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.dto.TeacherDashboardResponseDTO;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.timetable.entity.TimeTable;
import com.vansh.manger.Manger.timetable.repository.TimeTableRepository;

@ExtendWith(MockitoExtension.class)
class TeacherDashboardServiceTest {

    @Mock private TeacherRespository teacherRepository;
    @Mock private TeacherSchoolConfig schoolConfig;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock private TimeTableRepository timeTableRepository;
    @Mock private AttendanceService attendanceService;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private ExamRepository examRepository;
    @Mock private StudentSubjectMarksRepository marksRepository;
    @Mock private ActivityLogService activityLogService;

    @InjectMocks private TeacherDashboardService service;

    private School school;
    private Teacher teacher;
    private AcademicYear currentYear;
    private Classroom classroom;
    private TeacherAssignment assignment;

    @BeforeEach
    void setUp() {
        school = School.builder().id(1L).name("Alpha School").address("City").build();
        teacher = Teacher.builder().id(11L).email("teacher@alpha.test").school(school).build();
        currentYear = AcademicYear.builder()
                .id(5L)
                .name("2026-27")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2027, 3, 31))
                .isCurrent(true)
                .school(school)
                .build();
        classroom = Classroom.builder()
                .id(21L)
                .gradeLevel(GradeLevel.GRADE_10)
                .section("A")
                .capacity(40)
                .school(school)
                .build();
        assignment = TeacherAssignment.builder()
                .id(31L)
                .teacher(teacher)
                .classroom(classroom)
                .subject(Subject.builder().id(41L).name("Mathematics").code("MATH").school(school).build())
                .mandatory(true)
                .build();

        lenient().when(schoolConfig.requireCurrentSchool()).thenReturn(school);
        lenient().when(schoolConfig.getTeacher()).thenReturn(teacher);
        lenient().when(teacherRepository.findByEmailAndSchool_Id(teacher.getEmail(), school.getId())).thenReturn(Optional.of(teacher));
        lenient().when(academicYearRepository.findByIsCurrentAndSchool_Id(true, school.getId())).thenReturn(Optional.of(currentYear));
        lenient().when(teacherAssignmentRepository.findByTeacher(teacher)).thenReturn(List.of(assignment));
        lenient().when(attendanceService.getAssignedClassrooms()).thenReturn(List.of(
                ClassroomAttendanceStatsDTO.builder().id(classroom.getId()).activeStudents(2).build()));
        lenient().when(activityLogService.getActivityLogsByRole(eq("TEACHER"), eq(school.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(
                        ActivityLogDTO.builder().description("Marked attendance").category("Attendance").build())));
    }

    @Test
    void getDashboardSummary_buildsPriorityInterventionQueueFromAttendanceAndMarks() {
        Enrollment weakEnrollment = buildEnrollment(101L, "Rahul", "Sharma", "12");
        Enrollment healthyEnrollment = buildEnrollment(102L, "Anaya", "Singh", "14");

        when(enrollmentRepository.findByClassroomInAndAcademicYear(List.of(classroom), currentYear))
                .thenReturn(List.of(weakEnrollment, healthyEnrollment));

        when(attendanceRepository.findByEnrollmentInAndAcademicYear(List.of(weakEnrollment, healthyEnrollment), currentYear))
                .thenReturn(List.of(
                        attendance(weakEnrollment, AttendanceStatus.ABSENT),
                        attendance(weakEnrollment, AttendanceStatus.ABSENT),
                        attendance(weakEnrollment, AttendanceStatus.PRESENT),
                        attendance(healthyEnrollment, AttendanceStatus.PRESENT),
                        attendance(healthyEnrollment, AttendanceStatus.PRESENT)));

        when(marksRepository.findByEnrollmentIn(List.of(weakEnrollment, healthyEnrollment)))
                .thenReturn(List.of(
                        mark(weakEnrollment, "Mathematics", 18, 100),
                        mark(weakEnrollment, "Science", 28, 100),
                        mark(healthyEnrollment, "Mathematics", 82, 100)));

        when(attendanceRepository.countByClassroomIdsAndLocalDate(List.of(classroom.getId()), LocalDate.now()))
                .thenReturn(List.of());
        when(examRepository.findBySchool_IdOrderByStartDateDesc(school.getId()))
                .thenReturn(List.of(ongoingExam()));
        when(timeTableRepository.findByTeacherAssignment_Teacher_Id(teacher.getId()))
                .thenReturn(List.of(todayTimeTable(LocalTime.of(9, 0), LocalTime.of(10, 0))));
        when(timeTableRepository.findByTeacherAssignment_Teacher_IdAndDay(teacher.getId(), DayOfWeek.from(LocalDate.now())))
                .thenReturn(List.of(todayTimeTable(LocalTime.of(9, 0), LocalTime.of(10, 0))));

        TeacherDashboardResponseDTO response = service.getDashboardSummary();

        assertThat(response.getWeakStudents()).hasSize(1);
        TeacherDashboardResponseDTO.WeakStudentDTO flagged = response.getWeakStudents().getFirst();
        assertThat(flagged.getStudentName()).isEqualTo("Rahul Sharma");
        assertThat(flagged.getRiskLevel()).isEqualTo("High");
        assertThat(flagged.getWeakestSubject()).isEqualTo("Mathematics");
        assertThat(flagged.getReason()).contains("critical attendance drop", "average below passing");
        assertThat(flagged.getRecommendedAction()).contains("Call guardian");

        assertThat(response.getPendingTasks()).extracting(TeacherDashboardResponseDTO.PendingTaskDTO::getType)
                .contains("Attendance", "Ongoing Exam");
        assertThat(response.getTodayClasses()).hasSize(1);
        assertThat(response.getTodayClasses().getFirst().getStartTime()).isEqualTo(LocalTime.of(9, 0));
    }

    @Test
    void getDashboardSummary_skipsHealthyStudentsFromInterventionQueue() {
        Enrollment healthyEnrollment = buildEnrollment(103L, "Isha", "Verma", "8");

        when(enrollmentRepository.findByClassroomInAndAcademicYear(List.of(classroom), currentYear))
                .thenReturn(List.of(healthyEnrollment));
        when(attendanceRepository.findByEnrollmentInAndAcademicYear(List.of(healthyEnrollment), currentYear))
                .thenReturn(List.of(
                        attendance(healthyEnrollment, AttendanceStatus.PRESENT),
                        attendance(healthyEnrollment, AttendanceStatus.PRESENT)));
        when(marksRepository.findByEnrollmentIn(List.of(healthyEnrollment)))
                .thenReturn(List.of(mark(healthyEnrollment, "Mathematics", 88, 100)));
        when(attendanceRepository.countByClassroomIdsAndLocalDate(List.of(classroom.getId()), LocalDate.now()))
                .thenReturn(List.<Object[]>of(new Object[] { classroom.getId(), 1L }));
        when(examRepository.findBySchool_IdOrderByStartDateDesc(school.getId())).thenReturn(List.of());
        when(timeTableRepository.findByTeacherAssignment_Teacher_Id(teacher.getId())).thenReturn(List.of());
        when(timeTableRepository.findByTeacherAssignment_Teacher_IdAndDay(teacher.getId(), DayOfWeek.from(LocalDate.now())))
                .thenReturn(List.of());

        TeacherDashboardResponseDTO response = service.getDashboardSummary();

        assertThat(response.getWeakStudents()).isEmpty();
    }

    private Enrollment buildEnrollment(Long id, String firstName, String lastName, String rollNo) {
        Student student = Student.builder()
                .id(id + 1000)
                .firstName(firstName)
                .lastName(lastName)
                .school(school)
                .build();

        return Enrollment.builder()
                .id(id)
                .rollNo(rollNo)
                .student(student)
                .classroom(classroom)
                .academicYear(currentYear)
                .school(school)
                .status(StudentStatus.ACTIVE)
                .build();
    }

    private Attendance attendance(Enrollment enrollment, AttendanceStatus status) {
        return Attendance.builder()
                .id((long) status.ordinal() + 1)
                .enrollment(enrollment)
                .academicYear(currentYear)
                .attendanceStatus(status)
                .localDate(LocalDate.now())
                .build();
    }

    private StudentSubjectMarks mark(Enrollment enrollment, String subjectName, double obtained, double total) {
        return StudentSubjectMarks.builder()
                .id((long) obtained)
                .enrollment(enrollment)
                .subject(Subject.builder().id((long) obtained).name(subjectName).code(subjectName.substring(0, 3)).school(school).build())
                .marksObtained(obtained)
                .totalMarks(total)
                .build();
    }

    private Exam ongoingExam() {
        return Exam.builder()
                .id(501L)
                .name("Mid Term")
                .examType(ExamType.MID_TERM)
                .classroom(classroom)
                .academicYear(currentYear)
                .school(school)
                .status(ExamStatus.ONGOING)
                .startDate(LocalDate.now().minusDays(1))
                .endDate(LocalDate.now().plusDays(1))
                .totalMarks(100.0)
                .build();
    }

    private TimeTable todayTimeTable(LocalTime start, LocalTime end) {
        return TimeTable.builder()
                .id(701L)
                .day(DayOfWeek.from(LocalDate.now()))
                .startTime(start)
                .endTime(end)
                .teacherAssignment(assignment)
                .school(school)
                .build();
    }
}
