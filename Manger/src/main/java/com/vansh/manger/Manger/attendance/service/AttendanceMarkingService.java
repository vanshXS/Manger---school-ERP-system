package com.vansh.manger.Manger.attendance.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.dto.AttendanceResponseDTO;
import com.vansh.manger.Manger.attendance.dto.BulkAttendanceRequestDTO;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.student.dto.StudentAttendanceRecord;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * SRP: Handles attendance marking (write operations) only.
 * Validates date/student/enrollment, creates or updates attendance records.
 */
@Service
@RequiredArgsConstructor
public class AttendanceMarkingService implements AttendanceMarkingOperations {

    private final AttendanceRepository attendanceRepository;
    private final TeacherSchoolConfig schoolConfig;
    private final ClassroomRespository classroomRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public List<AttendanceResponseDTO> markAttendance(BulkAttendanceRequestDTO requestDTO) {
        Teacher teacher = schoolConfig.getTeacher();

        if (requestDTO.getRecords() == null || requestDTO.getRecords().isEmpty()) {
            throw new IllegalArgumentException("At least one attendance record is required.");
        }

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        Classroom classroom = classroomRespository
                .findByIdAndSchool(requestDTO.getClassroomId(), teacher.getSchool())
                .orElseThrow(() -> new RuntimeException("Classroom not found with this id"));

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)) {
            throw new IllegalStateException("Teacher is not assigned to the classroom");
        }

        if (requestDTO.getDate() == null) {
            requestDTO.setDate(LocalDate.now());
        }

        if (requestDTO.getDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException("You cannot mark the future date attendance.");
        }
        DayOfWeek day = requestDTO.getDate().getDayOfWeek();
        if (day == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("Cannot mark attendance on Sunday.");
        }

        Set<Long> processedStudentIds = new HashSet<>();
        List<AttendanceResponseDTO> result = new ArrayList<>();

        for (StudentAttendanceRecord records : requestDTO.getRecords()) {
            if (records.getStudentId() == null) {
                throw new IllegalArgumentException("Student id is required for each attendance record.");
            }
            if (records.getStatus() == null) {
                throw new IllegalArgumentException("Attendance status is required for each student.");
            }
            if (!processedStudentIds.add(records.getStudentId())) {
                throw new IllegalArgumentException(
                        "Duplicate attendance record found for student id: " + records.getStudentId());
            }

            Student student = studentRepository
                    .findByIdAndSchool_Id(records.getStudentId(), teacher.getSchool().getId())
                    .orElseThrow(() -> new RuntimeException("Student not found with this id"));

            Enrollment currentEnrollment = enrollmentRepository
                    .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, teacher.getSchool().getId(), true)
                    .orElseThrow(() -> new RuntimeException("Enrollment not found with this id"));

            if (!enrollmentRepository.existsByStudentAndClassroomAndAcademicYear(student, classroom, currentYear)) {
                throw new IllegalStateException("Student not enrolled in specific classroom.");
            }

            Attendance existedAttendance = attendanceRepository
                    .findByEnrollmentAndLocalDate(currentEnrollment, requestDTO.getDate())
                    .orElse(null);

            if (existedAttendance != null) {
                existedAttendance.setAttendanceStatus(records.getStatus());
                attendanceRepository.save(existedAttendance);
                result.add(mapToResponse(existedAttendance));
            } else {
                Attendance savedAttendance = Attendance.builder()
                        .markedBy(teacher)
                        .academicYear(currentYear)
                        .enrollment(currentEnrollment)
                        .attendanceStatus(records.getStatus())
                        .localDate(requestDTO.getDate())
                        .build();
                attendanceRepository.save(savedAttendance);
                result.add(mapToResponse(savedAttendance));
            }
        }

        activityLogService.logTeacherActivity(
                teacher.getSchool(),
                "Marked attendance for " + result.size() + " student(s) in "
                        + classroom.getGradeLevel().getDisplayName() + " - " + classroom.getSection(),
                "Attendance");
        return result;
    }

    private AttendanceResponseDTO mapToResponse(Attendance attendance) {
        String studentName = attendance.getEnrollment().getStudent().getFirstName() + " "
                + attendance.getEnrollment().getStudent().getLastName();
        String classroomName = attendance.getEnrollment().getClassroom().getGradeLevel().getDisplayName() + " - "
                + attendance.getEnrollment().getClassroom().getSection();
        String teacherName = attendance.getMarkedBy() != null
                ? attendance.getMarkedBy().getFirstName() + " " + attendance.getMarkedBy().getLastName()
                : "Unknown";

        return AttendanceResponseDTO.builder()
                .id(attendance.getId())
                .studentName(studentName)
                .classroomName(classroomName)
                .teacherName(teacherName)
                .status(attendance.getAttendanceStatus())
                .build();
    }
}
