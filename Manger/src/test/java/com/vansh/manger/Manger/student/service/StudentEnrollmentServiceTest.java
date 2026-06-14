package com.vansh.manger.Manger.student.service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.entity.GradeLevel;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentEnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AdminSchoolConfig adminSchoolConfig;

    @Mock
    private StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;

    @InjectMocks
    private StudentEnrollmentService studentEnrollmentService;

    private Classroom classroom;
    private AcademicYear academicYear;

    @BeforeEach
    void setUp() {
        GradeLevel gradeLevel = GradeLevel.GRADE_10;

        classroom = new Classroom();
        classroom.setGradeLevel(gradeLevel);
        classroom.setSection("A");

        academicYear = new AcademicYear();
        academicYear.setStartDate(LocalDate.of(2025, 1, 1));
    }

    @Test
    void generateNextRollNoForClass_FirstStudent() {
        when(adminSchoolConfig.requireCurrentSchoolId()).thenReturn(1L);
        when(enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(any(), any(), any()))
                .thenReturn(0L);

        String rollNo = studentEnrollmentService.generateNextRollNoForClass(classroom, academicYear);

        assertEquals("G10-A-2025-001", rollNo);
    }

    @Test
    void generateNextRollNoForClass_FortySecondStudent() {
        when(adminSchoolConfig.requireCurrentSchoolId()).thenReturn(1L);
        when(enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(any(), any(), any()))
                .thenReturn(41L);

        String rollNo = studentEnrollmentService.generateNextRollNoForClass(classroom, academicYear);

        assertEquals("G10-A-2025-042", rollNo);
    }
}
