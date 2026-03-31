package com.vansh.manger.Manger.attendance.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.attendance.dto.RosterStudentDTO;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles read-only attendance queries and statistics.
 * Roster retrieval, classroom stats, student attendance summaries.
 */
@Service
@RequiredArgsConstructor
public class AttendanceQueryService implements AttendanceQueryOperations {

    private final AttendanceRepository attendanceRepository;
    private final TeacherSchoolConfig schoolConfig;
    private final ClassroomRespository classroomRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;

    @Override
    public List<RosterStudentDTO> getRoster(Long classroomId, LocalDate date) {
        Teacher teacher = schoolConfig.getTeacher();

        if (date == null) {
            date = LocalDate.now();
        }

        Classroom classroom = classroomRespository.findByIdAndSchool(classroomId, teacher.getSchool())
                .orElseThrow(() -> new RuntimeException("Classroom not found with this id."));

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)) {
            throw new IllegalStateException("Teacher is not assigned to the classroom");
        }

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("There is no academicYear set to true"));

        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndAcademicYear(classroom, currentYear);
        List<Attendance> existingAttendance = attendanceRepository
                .findByEnrollment_ClassroomAndLocalDate(classroom, date);

        Map<Long, Attendance> attendance = existingAttendance.stream()
                .collect(Collectors.toMap(m -> m.getEnrollment().getId(), m -> m));

        List<RosterStudentDTO> result = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            Attendance existing = attendance.get(enrollment.getId());
            result.add(RosterStudentDTO.builder()
                    .studentId(student.getId())
                    .studentName(student.getFirstName() + " " + student.getLastName())
                    .rollNo(enrollment.getRollNo())
                    .status(existing != null ? existing.getAttendanceStatus() : null)
                    .build());
        }
        return result;
    }

    @Override
    @Transactional
    public List<ClassroomAttendanceStatsDTO> getAssignedClassrooms() {
        Teacher teacher = schoolConfig.getTeacher();

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByTeacher(teacher);
        List<Classroom> classrooms = assignments.stream()
                .map(TeacherAssignment::getClassroom)
                .distinct()
                .toList();

        Map<Long, Integer> activeStudentCounts = classrooms.isEmpty()
                ? Map.of()
                : enrollmentRepository.countByClassroomIdsAndAcademicYearAndStatus(
                                classrooms.stream().map(Classroom::getId).toList(),
                                currentYear,
                                StudentStatus.ACTIVE)
                        .stream()
                        .collect(Collectors.toMap(
                                row -> (Long) row[0],
                                row -> ((Long) row[1]).intValue()));

        return classrooms.stream()
                .map(classroom -> ClassroomAttendanceStatsDTO.builder()
                        .id(classroom.getId())
                        .gradeLevel(classroom.getGradeLevel().getDisplayName())
                        .section(classroom.getSection())
                        .activeStudents(activeStudentCounts.getOrDefault(classroom.getId(), 0))
                        .attendancePercentage(null)
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public ClassroomAttendanceStatsDTO getClassroomStats(Long classroomId) {
        Teacher teacher = schoolConfig.getTeacher();

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        Classroom classroom = classroomRespository.findByIdAndSchool(classroomId, teacher.getSchool())
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        int activeStudents = enrollmentRepository.countByClassroomAndAcademicYearAndStatus(
                classroom, currentYear, StudentStatus.ACTIVE);

        List<Attendance> allAttendance = attendanceRepository
                .findByEnrollment_ClassroomAndAcademicYear(classroom, currentYear);

        long totalRecords = allAttendance.size();
        long presentRecords = allAttendance.stream()
                .filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT).count();

        Double attendancePercentage = null;
        if (totalRecords > 0) {
            attendancePercentage = (double) presentRecords / totalRecords * 100.0;
            attendancePercentage = Math.round(attendancePercentage * 100.0) / 100.0;
        }

        return ClassroomAttendanceStatsDTO.builder()
                .id(classroom.getId())
                .gradeLevel(classroom.getGradeLevel().getDisplayName())
                .section(classroom.getSection())
                .activeStudents(activeStudents)
                .attendancePercentage(attendancePercentage)
                .build();
    }

    @Override
    @Transactional
    public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
        Teacher teacher = schoolConfig.getTeacher();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, teacher.getSchool().getId(), true)
                .orElseThrow(() -> new RuntimeException("Student has no current enrollment"));

        boolean isAssigned = teacherAssignmentRepository
                .existsByTeacherAndClassroom(teacher, currentEnrollment.getClassroom());
        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to this student's classroom");
        }

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active academic year"));

        List<Attendance> attendances = attendanceRepository
                .findByEnrollmentAndAcademicYear(currentEnrollment, currentYear);

        int totalWorkingDays = attendances.size();
        int daysPresent = (int) attendances.stream()
                .filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT).count();
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
