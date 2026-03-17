package com.vansh.manger.Manger.exam.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.entity.GradeLevel;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.exam.dto.ExamResponseDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.ExamStatus;
import com.vansh.manger.Manger.exam.entity.ExamType;
import com.vansh.manger.Manger.exam.repository.ExamRepository;
import com.vansh.manger.Manger.exam.repository.ExamSubjectRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

@ExtendWith(MockitoExtension.class)
class AdminExamServiceTest {

    @Mock private ExamRepository examRepository;
    @Mock private ExamSubjectRepository examSubjectRepository;
    @Mock private ClassroomRespository classroomRespository;
    @Mock private TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private StudentSubjectMarksRepository marksRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private AdminSchoolConfig adminSchoolConfig;
    @Mock private ActivityLogService activityLogService;

    @InjectMocks private AdminExamService service;

    private School school;
    private Classroom classroom;

    @BeforeEach
    void setUp() {
        school = School.builder().id(1L).name("Alpha").address("City").build();
        classroom = Classroom.builder().id(2L).gradeLevel(GradeLevel.GRADE_10).section("A").capacity(40).school(school).build();
        when(adminSchoolConfig.requireCurrentSchool()).thenReturn(school);
        when(examSubjectRepository.countByExam_Id(99L)).thenReturn(0L);
    }

    @Test
    void updateExamStatus_rejectsManualNonCompletedTransitions() {
        Exam exam = exam(ExamStatus.ONGOING, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        when(examRepository.findByIdAndSchool_Id(exam.getId(), school.getId())).thenReturn(Optional.of(exam));

        assertThatThrownBy(() -> service.updateExamStatus(exam.getId(), ExamStatus.ONGOING))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only manual completion is allowed");
    }

    @Test
    void updateExamStatus_completesOngoingExam() {
        Exam exam = exam(ExamStatus.ONGOING, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        when(examRepository.findByIdAndSchool_Id(exam.getId(), school.getId())).thenReturn(Optional.of(exam));
        when(examRepository.save(exam)).thenReturn(exam);

        ExamResponseDTO response = service.updateExamStatus(exam.getId(), ExamStatus.COMPLETED);

        assertThat(response.getStatus().getDisplayName()).isEqualTo("Completed");
        assertThat(exam.getStatus()).isEqualTo(ExamStatus.COMPLETED);
    }

    private Exam exam(ExamStatus status, LocalDate startDate, LocalDate endDate) {
        return Exam.builder()
                .id(99L)
                .name("Mid Term")
                .examType(ExamType.MID_TERM)
                .classroom(classroom)
                .school(school)
                .status(status)
                .startDate(startDate)
                .endDate(endDate)
                .totalMarks(100.0)
                .build();
    }
}
