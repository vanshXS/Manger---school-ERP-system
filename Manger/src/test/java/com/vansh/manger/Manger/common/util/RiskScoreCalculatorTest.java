package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.subject.entity.Subject;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RiskScoreCalculatorTest {

    @Test
    void testComputeRisk_NoRisk_PerfectAttendanceAndMarks() {
        List<Attendance> attendance = List.of(
                createAttendance(AttendanceStatus.PRESENT),
                createAttendance(AttendanceStatus.PRESENT)
        );

        List<StudentSubjectMarks> marks = List.of(
                createMark("Math", 90.0, 100.0),
                createMark("Science", 85.0, 100.0)
        );

        RiskScoreCalculator.RiskResult result = RiskScoreCalculator.computeRisk(attendance, marks);

        assertEquals("No Risk", result.riskLevel());
        assertEquals(0, result.riskScore());
        assertEquals(100.0, result.attendancePercentage());
        assertEquals(87.5, result.averagePercentage());
        assertTrue(result.reasons().isEmpty());
    }

    @Test
    void testComputeRisk_HighRisk_LowAttendance() {
        List<Attendance> attendance = List.of(
                createAttendance(AttendanceStatus.PRESENT),
                createAttendance(AttendanceStatus.ABSENT),
                createAttendance(AttendanceStatus.ABSENT),
                createAttendance(AttendanceStatus.ABSENT)
        );

        List<StudentSubjectMarks> marks = List.of(
                createMark("Math", 80.0, 100.0)
        );

        RiskScoreCalculator.RiskResult result = RiskScoreCalculator.computeRisk(attendance, marks);

        assertEquals("High", result.riskLevel());
        assertTrue(result.riskScore() >= 40);
        assertEquals(25.0, result.attendancePercentage());
    }

    @Test
    void testComputeRisk_HighRisk_LowMarks() {
        List<Attendance> attendance = List.of(
                createAttendance(AttendanceStatus.PRESENT)
        );

        List<StudentSubjectMarks> marks = List.of(
                createMark("Math", 20.0, 100.0),
                createMark("Science", 30.0, 100.0)
        );

        RiskScoreCalculator.RiskResult result = RiskScoreCalculator.computeRisk(attendance, marks);

        assertEquals("High", result.riskLevel());
        assertTrue(result.riskScore() >= 40);
        assertEquals(25.0, result.averagePercentage());
    }

    @Test
    void testComputeRisk_EmptyRecords() {
        RiskScoreCalculator.RiskResult result = RiskScoreCalculator.computeRisk(new ArrayList<>(), new ArrayList<>());
        
        assertEquals("No Risk", result.riskLevel());
        assertEquals(0, result.riskScore());
        assertNull(result.attendancePercentage());
        assertNull(result.averagePercentage());
    }

    private Attendance createAttendance(AttendanceStatus status) {
        Attendance a = new Attendance();
        a.setAttendanceStatus(status);
        return a;
    }

    private StudentSubjectMarks createMark(String subjectName, Double obtained, Double total) {
        StudentSubjectMarks m = new StudentSubjectMarks();
        Subject s = new Subject();
        s.setName(subjectName);
        m.setSubject(s);
        m.setMarksObtained(obtained);
        m.setTotalMarks(total);
        return m;
    }
}
