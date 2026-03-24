package com.vansh.manger.Manger.exam.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.entity.GradeLevel;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailService;
import com.vansh.manger.Manger.common.service.PDFService;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.exam.dto.BulkMarksRequestDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamSubject;
import com.vansh.manger.Manger.exam.entity.ExamType;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;

@ExtendWith(MockitoExtension.class)
class TeacherMarkServiceTest {

    @Mock private TeacherRespository teacherRepository;
    @Mock private TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock private TeacherSchoolConfig schoolConfig;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private ExamRepository examRepository;
    @Mock private ExamSubjectRepository examSubjectRepository;
    @Mock private StudentSubjectMarksRepository marksRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private EmailService emailService;
    @Mock private PDFService pdfService;
    @Mock private ActivityLogService activityLogService;

    @InjectMocks private TeacherMarkService service;

    private School school;
    private Teacher teacher;
    private Classroom classroom;
    private Student student;
    private Enrollment enrollment;
    private Subject subject;
    private AcademicYear academicYear;

    @BeforeEach
    void setUp() {
        school = School.builder().id(1L).name("Alpha").address("City").build();
        teacher = Teacher.builder().id(2L).email("teacher@alpha.test").school(school).build();
        classroom = Classroom.builder().id(3L).gradeLevel(GradeLevel.GRADE_10).section("A").capacity(40).school(school).build();
        academicYear = AcademicYear.builder()
                .id(8L)
                .name("2025-26")
                .startDate(LocalDate.of(2025, 4, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .school(school)
                .build();
        student = Student.builder().id(4L).firstName("Rahul").lastName("Sharma").email("rahul@test.com").school(school).build();
        enrollment = Enrollment.builder()
                .id(5L)
                .rollNo("12")
                .student(student)
                .classroom(classroom)
                .academicYear(academicYear)
                .school(school)
                .status(StudentStatus.ACTIVE)
                .build();
        subject = Subject.builder().id(6L).name("Mathematics").code("MTH").school(school).build();

        lenient().when(schoolConfig.getTeacher()).thenReturn(teacher);
        lenient().when(schoolConfig.requireCurrentSchool()).thenReturn(school);
    }

    @Test
    void saveBulkMarks_rejectsWhenExamIsNotOngoing() {
        Exam exam = exam(ExamStatus.UPCOMING, LocalDate.now().plusDays(2), LocalDate.now().plusDays(4));
        when(examRepository.findByIdAndSchool_Id(10L, school.getId())).thenReturn(Optional.of(exam));
        when(teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)).thenReturn(true);

        BulkMarksRequestDTO request = BulkMarksRequestDTO.builder()
                .examId(10L)
                .subjectId(subject.getId())
                .marks(List.of(new BulkMarksRequestDTO.StudentMarkInput(enrollment.getId(), 35.0)))
                .build();

        assertThatThrownBy(() -> service.saveBulkMarks(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ongoing");
    }

    @Test
    void saveBulkMarks_usesExamSubjectMaxMarksAndStoresGrade() {
        Exam exam = exam(ExamStatus.ONGOING, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        when(examRepository.findByIdAndSchool_Id(10L, school.getId())).thenReturn(Optional.of(exam));
        when(teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)).thenReturn(true);
        when(subjectRepository.findById(subject.getId())).thenReturn(Optional.of(subject));
        when(examSubjectRepository.findByExam_IdAndSubject_Id(exam.getId(), subject.getId()))
                .thenReturn(Optional.of(ExamSubject.builder().id(21L).exam(exam).subject(subject).maxMarks(50.0).build()));
        when(enrollmentRepository.findById(enrollment.getId())).thenReturn(Optional.of(enrollment));
        when(marksRepository.findByEnrollment_StudentAndSubjectAndExam_Id(student, subject, exam.getId()))
                .thenReturn(Optional.empty());

        BulkMarksRequestDTO request = BulkMarksRequestDTO.builder()
                .examId(exam.getId())
                .subjectId(subject.getId())
                .marks(List.of(new BulkMarksRequestDTO.StudentMarkInput(enrollment.getId(), 45.0)))
                .build();

        service.saveBulkMarks(request);

        ArgumentCaptor<StudentSubjectMarks> captor = ArgumentCaptor.forClass(StudentSubjectMarks.class);
        verify(marksRepository).save(captor.capture());
        StudentSubjectMarks saved = captor.getValue();

        assertThat(saved.getTotalMarks()).isEqualTo(50.0);
        assertThat(saved.getGrade()).isEqualTo("A+");
        assertThat(saved.getMarksObtained()).isEqualTo(45.0);
    }

    @Test
    void sendMarksheet_rejectsBeforeExamCompletion() {
        Exam exam = exam(ExamStatus.ONGOING, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        when(examRepository.findByIdAndSchool_Id(exam.getId(), school.getId())).thenReturn(Optional.of(exam));
        when(enrollmentRepository.findById(enrollment.getId())).thenReturn(Optional.of(enrollment));
        when(teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)).thenReturn(true);

        assertThatThrownBy(() -> service.sendMarksheet(exam.getId(), enrollment.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("completed");
    }

    private Exam exam(ExamStatus status, LocalDate startDate, LocalDate endDate) {
        return Exam.builder()
                .id(10L)
                .name("Mid Term")
                .examType(ExamType.MID_TERM)
                .classroom(classroom)
                .academicYear(academicYear)
                .school(school)
                .status(status)
                .startDate(startDate)
                .endDate(endDate)
                .totalMarks(100.0)
                .build();
    }
}
