package com.vansh.manger.Manger.student.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
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

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.entity.Gender;
import com.vansh.manger.Manger.common.entity.GradeLevel;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.StudentSchoolConfig;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamType;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.dto.StudentAttendanceMonthDTO;
import com.vansh.manger.Manger.student.dto.StudentAttendanceSummaryDTO;
import com.vansh.manger.Manger.student.dto.StudentExamDTO;
import com.vansh.manger.Manger.student.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.dto.StudentRiskAnalysisDTO;
import com.vansh.manger.Manger.student.dto.StudentTimetableDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.timetable.entity.TimeTable;
import com.vansh.manger.Manger.timetable.repository.TimeTableRepository;

@ExtendWith(MockitoExtension.class)
class StudentPortalServiceTest {

    @Mock private StudentSchoolConfig studentSchoolConfig;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private StudentSubjectMarksRepository marksRepository;
    @Mock private ExamRepository examRepository;
    @Mock private TimeTableRepository timeTableRepository;
    @Mock private AcademicYearRepository academicYearRepository;

    @InjectMocks private StudentPortalService service;

    private School school;
    private Student student;
    private AcademicYear currentYear;
    private Classroom classroom;
    private Enrollment currentEnrollment;

    @BeforeEach
    void setUp() {
        school = School.builder()
                .id(1L)
                .name("Alpha School")
                .address("City")
                .build();

        student = Student.builder()
                .id(10L)
                .firstName("Rahul")
                .lastName("Sharma")
                .email("rahul@alpha.test")
                .phoneNumber("9999999999")
                .admissionNo("ADM-101")
                .profilePictureUrl("https://cdn.test/rahul.png")
                .gender(Gender.MALE)
                .school(school)
                .build();

        currentYear = AcademicYear.builder()
                .id(77L)
                .name("2025-26")
                .startDate(LocalDate.of(2025, 4, 1))
                .endDate(LocalDate.of(2026, 3, 31))
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

        currentEnrollment = Enrollment.builder()
                .id(31L)
                .rollNo("15")
                .student(student)
                .classroom(classroom)
                .academicYear(currentYear)
                .status(StudentStatus.ACTIVE)
                .school(school)
                .build();

        lenient().when(studentSchoolConfig.currentStudent()).thenReturn(student);
        lenient().when(studentSchoolConfig.requireCurrentSchool()).thenReturn(school);
        lenient().when(studentSchoolConfig.getCurrentEnrollment()).thenReturn(currentEnrollment);
    }

    @Test
    void getMyProfile_mapsStudentAndEnrollmentFields() {
        StudentResponseDTO response = service.getMyProfile();

        assertThat(response.getId()).isEqualTo(student.getId());
        assertThat(response.getFirstName()).isEqualTo("Rahul");
        assertThat(response.getLastName()).isEqualTo("Sharma");
        assertThat(response.getEmail()).isEqualTo("rahul@alpha.test");
        assertThat(response.getRollNo()).isEqualTo("15");
        assertThat(response.getStatus()).isEqualTo(StudentStatus.ACTIVE);
        assertThat(response.getAcademicYearName()).isEqualTo("2025-26");
        assertThat(response.getClassroomResponseDTO().getId()).isEqualTo(classroom.getId());
        assertThat(response.getClassroomResponseDTO().getGradeLevel()).isEqualTo(GradeLevel.GRADE_10);
        assertThat(response.getClassroomResponseDTO().getSection()).isEqualTo("A");
    }

    @Test
    void getAttendanceSummary_calculatesTotalsAndRoundedPercentage() {
        when(academicYearRepository.findByIdAndSchool_Id(currentYear.getId(), school.getId()))
                .thenReturn(Optional.of(currentYear));
        when(enrollmentRepository.findByStudentAndAcademicYear(student, currentYear))
                .thenReturn(Optional.of(currentEnrollment));
        when(attendanceRepository.findByEnrollmentAndAcademicYear(currentEnrollment, currentYear))
                .thenReturn(List.of(
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 6, 10), AttendanceStatus.PRESENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 6, 11), AttendanceStatus.ABSENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 6, 12), AttendanceStatus.PRESENT)));

        StudentAttendanceSummaryDTO response = service.getAttendanceSummary(currentYear.getId());

        assertThat(response.getTotalDays()).isEqualTo(3);
        assertThat(response.getPresentDays()).isEqualTo(2);
        assertThat(response.getAbsentDays()).isEqualTo(1);
        assertThat(response.getPercentage()).isEqualTo(66.67);
    }

    @Test
    void getMonthlyAttendance_handlesJanuaryComparisonWithPreviousYear() {
        when(attendanceRepository.findByEnrollmentAndAcademicYear(currentEnrollment, currentYear))
                .thenReturn(List.of(
                        attendance(currentEnrollment, currentYear, LocalDate.of(2026, 1, 10), AttendanceStatus.PRESENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2026, 1, 11), AttendanceStatus.PRESENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 12, 10), AttendanceStatus.PRESENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 12, 11), AttendanceStatus.ABSENT)));

        StudentAttendanceMonthDTO response = service.getMonthlyAttendance(2026, 1);

        assertThat(response.getCurrentMonth()).isEqualTo(1);
        assertThat(response.getCurrentYear()).isEqualTo(2026);
        assertThat(response.getCurrentPercentage()).isEqualTo(100.0);
        assertThat(response.getPreviousMonth()).isEqualTo(12);
        assertThat(response.getPreviousYear()).isEqualTo(2025);
        assertThat(response.getPreviousPercentage()).isEqualTo(50.0);
        assertThat(response.getDelta()).isEqualTo(50.0);
    }

    @Test
    void getExams_scopesLookupByCurrentSchoolAndMapsResponse() {
        AcademicYear requestedYear = AcademicYear.builder()
                .id(88L)
                .name("2024-25")
                .startDate(LocalDate.of(2024, 4, 1))
                .endDate(LocalDate.of(2025, 3, 31))
                .isCurrent(false)
                .school(school)
                .build();

        Enrollment enrollmentForYear = Enrollment.builder()
                .id(32L)
                .rollNo("18")
                .student(student)
                .classroom(classroom)
                .academicYear(requestedYear)
                .status(StudentStatus.ACTIVE)
                .school(school)
                .build();

        Exam exam = exam(501L, "Mid Term", requestedYear);

        when(academicYearRepository.findByIdAndSchool_Id(requestedYear.getId(), school.getId()))
                .thenReturn(Optional.of(requestedYear));
        when(enrollmentRepository.findByStudentAndAcademicYear(student, requestedYear))
                .thenReturn(Optional.of(enrollmentForYear));
        when(examRepository.findFiltered(school.getId(), requestedYear.getId(), classroom.getId(), null))
                .thenReturn(List.of(exam));

        List<StudentExamDTO> response = service.getExams(requestedYear.getId());

        verify(examRepository).findFiltered(school.getId(), requestedYear.getId(), classroom.getId(), null);
        assertThat(response).hasSize(1);
        assertThat(response.getFirst().getId()).isEqualTo(501L);
        assertThat(response.getFirst().getName()).isEqualTo("Mid Term");
        assertThat(response.getFirst().getStatus()).isEqualTo(ExamStatus.ONGOING);
    }

    @Test
    void getExamResults_sortsSubjectsAndComputesPercentages() {
        Exam exam = exam(701L, "Final Term", currentYear);

        when(examRepository.findByIdAndSchool_Id(exam.getId(), school.getId()))
                .thenReturn(Optional.of(exam));
        when(marksRepository.findByEnrollment_StudentAndExam_Id(student, exam.getId()))
                .thenReturn(List.of(
                        mark(currentEnrollment, exam, "Science", "SCI", 90.0, 100.0, "A1"),
                        mark(currentEnrollment, exam, "English", "ENG", 40.0, 50.0, "B1")));

        StudentExamResultDTO response = service.getExamResults(exam.getId());

        assertThat(response.getExamName()).isEqualTo("Final Term");
        assertThat(response.getSubjects()).extracting(StudentExamResultDTO.SubjectMarkDTO::getSubjectName)
                .containsExactly("English", "Science");
        assertThat(response.getSubjects()).extracting(StudentExamResultDTO.SubjectMarkDTO::getPercentage)
                .containsExactly(80.0, 90.0);
    }

    @Test
    void getTimetable_sortsByDayThenStartTimeAndFormatsTeacherName() {
        Teacher teacher = Teacher.builder()
                .id(91L)
                .firstName("Asha")
                .lastName("Khan")
                .email("asha@alpha.test")
                .school(school)
                .build();

        TeacherAssignment mathAssignment = TeacherAssignment.builder()
                .id(401L)
                .classroom(classroom)
                .subject(Subject.builder().id(501L).name("Mathematics").code("MTH").school(school).build())
                .teacher(teacher)
                .mandatory(true)
                .build();

        TeacherAssignment scienceAssignment = TeacherAssignment.builder()
                .id(402L)
                .classroom(classroom)
                .subject(Subject.builder().id(502L).name("Science").code("SCI").school(school).build())
                .teacher(teacher)
                .mandatory(true)
                .build();

        when(timeTableRepository.findByTeacherAssignment_Classroom_Id(classroom.getId()))
                .thenReturn(List.of(
                        timetable(DayOfWeek.TUESDAY, LocalTime.of(9, 0), LocalTime.of(10, 0), scienceAssignment),
                        timetable(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(11, 0), scienceAssignment),
                        timetable(DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(9, 0), mathAssignment)));

        List<StudentTimetableDTO> response = service.getTimetable();

        assertThat(response).extracting(StudentTimetableDTO::getDay, StudentTimetableDTO::getStartTime)
                .containsExactly(
                        tuple(DayOfWeek.MONDAY, LocalTime.of(8, 0)),
                        tuple(DayOfWeek.MONDAY, LocalTime.of(10, 0)),
                        tuple(DayOfWeek.TUESDAY, LocalTime.of(9, 0)));
        assertThat(response.getFirst().getSubjectName()).isEqualTo("Mathematics");
        assertThat(response.getFirst().getTeacherName()).isEqualTo("Asha Khan");
    }

    @Test
    void getRiskAnalysis_buildsHighRiskResultFromWeakAttendanceAndMarks() {
        Exam exam = exam(801L, "Unit Test", currentYear);

        when(attendanceRepository.findByEnrollmentAndAcademicYear(currentEnrollment, currentYear))
                .thenReturn(List.of(
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 7, 1), AttendanceStatus.ABSENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 7, 2), AttendanceStatus.ABSENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 7, 3), AttendanceStatus.ABSENT),
                        attendance(currentEnrollment, currentYear, LocalDate.of(2025, 7, 4), AttendanceStatus.PRESENT)));
        when(marksRepository.findByEnrollmentIn(List.of(currentEnrollment)))
                .thenReturn(List.of(
                        mark(currentEnrollment, exam, "Mathematics", "MTH", 20.0, 100.0, "D"),
                        mark(currentEnrollment, exam, "Science", "SCI", 30.0, 100.0, "D")));

        StudentRiskAnalysisDTO response = service.getRiskAnalysis();

        assertThat(response.getRiskLevel()).isEqualTo("High");
        assertThat(response.getRiskScore()).isEqualTo(110);
        assertThat(response.getAttendancePercentage()).isEqualTo(25.0);
        assertThat(response.getAveragePercentage()).isEqualTo(25.0);
        assertThat(response.getWeakestSubject()).isEqualTo("Mathematics");
        assertThat(response.getReasons()).contains(
                "critical attendance drop",
                "average below passing",
                "multiple weak subjects",
                "frequent absence pattern");
        assertThat(response.getRecommendedAction()).contains("Call guardian");
    }

    private Attendance attendance(Enrollment enrollment, AcademicYear year, LocalDate date, AttendanceStatus status) {
        return Attendance.builder()
                .id((long) (date.getDayOfMonth() + status.ordinal()))
                .enrollment(enrollment)
                .academicYear(year)
                .attendanceStatus(status)
                .localDate(date)
                .build();
    }

    private Exam exam(Long id, String name, AcademicYear year) {
        return Exam.builder()
                .id(id)
                .name(name)
                .examType(ExamType.MID_TERM)
                .status(ExamStatus.ONGOING)
                .startDate(LocalDate.of(2025, 9, 1))
                .endDate(LocalDate.of(2025, 9, 10))
                .totalMarks(100.0)
                .classroom(classroom)
                .academicYear(year)
                .school(school)
                .build();
    }

    private StudentSubjectMarks mark(
            Enrollment enrollment,
            Exam exam,
            String subjectName,
            String code,
            double obtained,
            double total,
            String grade) {
        return StudentSubjectMarks.builder()
                .id((long) obtained)
                .enrollment(enrollment)
                .exam(exam)
                .subject(Subject.builder().id((long) obtained).name(subjectName).code(code).school(school).build())
                .marksObtained(obtained)
                .totalMarks(total)
                .grade(grade)
                .build();
    }

    private TimeTable timetable(DayOfWeek day, LocalTime start, LocalTime end, TeacherAssignment assignment) {
        return TimeTable.builder()
                .id((long) (start.getHour() + day.ordinal()))
                .day(day)
                .startTime(start)
                .endTime(end)
                .teacherAssignment(assignment)
                .school(school)
                .build();
    }
}
