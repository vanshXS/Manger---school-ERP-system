package com.vansh.manger.Manger.attendance.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.vansh.manger.Manger.attendance.dto.BulkAttendanceRequestDTO;
import com.vansh.manger.Manger.attendance.dto.AttendanceResponseDTO;
import com.vansh.manger.Manger.attendance.dto.RosterStudentDTO;
import com.vansh.manger.Manger.student.dto.StudentAttendanceRecord;
import com.vansh.manger.Manger.classroom.dto.ClassroomAttendanceStatsDTO;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.common.util.TeacherSchoolConfig;
import com.vansh.manger.Manger.common.service.ActivityLogService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;


@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final TeacherSchoolConfig schoolConfig;
    private final ClassroomRespository classroomRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final ActivityLogService activityLogService;
    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;

    @Transactional
    public List<AttendanceResponseDTO> markAttendance(BulkAttendanceRequestDTO requestDTO) {

        Teacher teacher = schoolConfig.getTeacher();

        if (requestDTO.getRecords() == null || requestDTO.getRecords().isEmpty()) {
            throw new IllegalArgumentException("At least one attendance record is required.");
        }

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        Classroom classroom = classroomRespository.findByIdAndSchool(requestDTO.getClassroomId(), teacher.getSchool())
                .orElseThrow(() -> new RuntimeException("Classroom not found with this id"));

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)) {
            throw new IllegalStateException("Teacher is not assigned to the classroom");
        }

        if(requestDTO.getDate() == null) {
            requestDTO.setDate(LocalDate.now());
        }

        //edge cases with date
        if(requestDTO.getDate().isAfter(LocalDate.now())) {
            throw  new IllegalStateException("You cannot mark the future date attendance.");
        }
        DayOfWeek day = requestDTO.getDate().getDayOfWeek();
        if(day == DayOfWeek.SUNDAY) {
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
                throw new IllegalArgumentException("Duplicate attendance record found for student id: " + records.getStudentId());
            }

            Student student = studentRepository.findByIdAndSchool_Id(records.getStudentId(), teacher.getSchool().getId())
                    .orElseThrow(() -> new RuntimeException("Student not found with this id"));

            Enrollment currentEnrollment = enrollmentRepository.findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, teacher.getSchool().getId(), true)
                    .orElseThrow(() -> new RuntimeException("Enrollment not found with this id"));

            if (!enrollmentRepository.existsByStudentAndClassroomAndAcademicYear(student, classroom, currentYear)) {
                throw new IllegalStateException("Student not enrolled in specific classroom.");
            }

            Attendance existedAttendance = attendanceRepository.findByEnrollmentAndLocalDate(currentEnrollment, requestDTO.getDate())
                    .orElse(null);

            if(existedAttendance != null) {
                existedAttendance.setAttendanceStatus(records.getStatus());
                attendanceRepository.save(existedAttendance);
                result.add(mapToResponse(existedAttendance));

            }else {

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
                "Marked attendance for " + result.size() + " student(s) in " +
                        classroom.getGradeLevel().getDisplayName() + " - " + classroom.getSection(),
                "Attendance");
        return result;

    }

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

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("There is no academicYear set to true"));

        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndAcademicYear(classroom, currentYear);

        List<Attendance> existingAttendance = attendanceRepository.findByEnrollment_ClassroomAndLocalDate(classroom, date);

        Map<Long, Attendance> attendance = existingAttendance.stream()
                .collect(Collectors.toMap(m -> m.getEnrollment().getId(), m -> m));

        List<RosterStudentDTO> result = new ArrayList<>();
        for(Enrollment enrollment : enrollments) {

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



    public AttendanceResponseDTO mapToResponse(Attendance attendance) {

        String studentName = attendance.getEnrollment().getStudent().getFirstName() + " " + attendance.getEnrollment().getStudent().getLastName();
        String classroomName = attendance.getEnrollment().getClassroom().getGradeLevel().getDisplayName() + " - "
                + attendance.getEnrollment().getClassroom().getSection();
        String teacherName = attendance.getMarkedBy() != null ?
                attendance.getMarkedBy().getFirstName() + " " + attendance.getMarkedBy().getLastName() : "Unknown";

        return AttendanceResponseDTO.builder()
                .id(attendance.getId())
                .studentName(studentName)
                .classroomName(classroomName)
                .teacherName(teacherName)
                .status(attendance.getAttendanceStatus())
                .build();

    }

    @Transactional
    public List<ClassroomAttendanceStatsDTO> getAssignedClassrooms() {
        Teacher teacher = schoolConfig.getTeacher();

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
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
                .map(classroom -> {
                    return ClassroomAttendanceStatsDTO.builder()
                            .id(classroom.getId())
                            .gradeLevel(classroom.getGradeLevel().getDisplayName())
                            .section(classroom.getSection())
                            .activeStudents(activeStudentCounts.getOrDefault(classroom.getId(), 0))
                            .attendancePercentage(null)
                            .build();
                })
                .toList();
    }

    @Transactional
    public ClassroomAttendanceStatsDTO getClassroomStats(Long classroomId) {
        Teacher teacher = schoolConfig.getTeacher();

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active Year found"));

        Classroom classroom = classroomRespository.findByIdAndSchool(classroomId, teacher.getSchool())
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        if (!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)) {
            throw new RuntimeException("Teacher is not assigned to this classroom");
        }

        int activeStudents = enrollmentRepository.countByClassroomAndAcademicYearAndStatus(classroom, currentYear,
                StudentStatus.ACTIVE);

        // O(n) optimized logic using single database query
        List<Attendance> allAttendance = attendanceRepository.findByEnrollment_ClassroomAndAcademicYear(classroom, currentYear);

        long totalRecords = allAttendance.size();
        long presentRecords = allAttendance.stream().filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT).count();

        Double attendancePercentage = null;
        if (totalRecords > 0) {
            attendancePercentage = (double) presentRecords / totalRecords * 100.0;
            // Round to 2 decimal places
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

    @Transactional
    public StudentResponseDTO getStudentById(Long studentId) {
        Teacher teacher = schoolConfig.getTeacher();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, teacher.getSchool().getId(), true)
                .orElse(null);

        // Check if teacher is assigned to the student's classroom
        if (currentEnrollment != null) {
            boolean isAssigned = teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, currentEnrollment.getClassroom());
            if (!isAssigned) {
                throw new RuntimeException("Teacher is not assigned to this student's classroom");
            }
        }

        return mapToStudentResponseDTO(student, currentEnrollment);
    }

    @Transactional
    public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
        Teacher teacher = schoolConfig.getTeacher();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, teacher.getSchool().getId(), true)
                .orElseThrow(() -> new RuntimeException("Student has no current enrollment"));

        // Check if teacher is assigned to the student's classroom
        boolean isAssigned = teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, currentEnrollment.getClassroom());
        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to this student's classroom");
        }

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, teacher.getSchool().getId())
                .orElseThrow(() -> new RuntimeException("No active academic year"));

        List<Attendance> attendances = attendanceRepository.findByEnrollmentAndAcademicYear(currentEnrollment, currentYear);

        int totalWorkingDays = attendances.size();
        int daysPresent = (int) attendances.stream().filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT).count();
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

    private StudentResponseDTO mapToStudentResponseDTO(Student student, Enrollment currentEnrollment) {
        StudentResponseDTO.StudentResponseDTOBuilder dtoBuilder = StudentResponseDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .email(student.getEmail())
                .phoneNumber(student.getPhoneNumber())
                .profilePictureUrl(student.getProfilePictureUrl())
                .admissionNo(student.getAdmissionNo())
                .fatherName(student.getFatherName())
                .motherName(student.getMotherName())
                .guardianName(student.getGuardianName())
                .parentPhonePrimary(student.getParentPhonePrimary())
                .parentPhoneSecondary(student.getParentPhoneSecondary())
                .parentEmail(student.getParentEmail())
                .parentOccupation(student.getParentOccupation())
                .annualIncome(student.getAnnualIncome())
                .fullAddress(student.getFullAddress())
                .city(student.getCity())
                .state(student.getState())
                .pincode(student.getPincode())
                .medicalConditions(student.getMedicalConditions())
                .allergies(student.getAllergies())
                .emergencyContactName(student.getEmergencyContactName())
                .emergencyContactNumber(student.getEmergencyContactNumber())
                .previousSchoolName(student.getPreviousSchoolName())
                .previousClass(student.getPreviousClass())
                .admissionDate(student.getAdmissionDate())
                .transportRequired(student.getTransportRequired())
                .hostelRequired(student.getHostelRequired())
                .feeCategory(student.getFeeCategory())
                .gender(student.getGender());

        if (currentEnrollment != null) {
            dtoBuilder.status(currentEnrollment.getStatus());
            dtoBuilder.currentEnrollmentId(currentEnrollment.getId());
            dtoBuilder.rollNo(currentEnrollment.getRollNo());
            dtoBuilder.academicYearName(currentEnrollment.getAcademicYear().getName());

            dtoBuilder.classroomResponseDTO(
                    ClassroomResponseDTO.builder()
                            .id(currentEnrollment.getClassroom().getId())
                            .section(currentEnrollment.getClassroom().getSection())
                            .capacity(currentEnrollment.getClassroom().getCapacity())
                            .status(currentEnrollment.getClassroom().getStatus())
                            .gradeLevel(currentEnrollment.getClassroom().getGradeLevel())
                            .studentCount(
                                    enrollmentRepository
                                            .countByClassroomAndAcademicYearAndSchool_Id(
                                                    currentEnrollment.getClassroom(),
                                                    currentEnrollment.getAcademicYear(),
                                                    schoolConfig.getTeacher().getSchool().getId()))
                            .build());
        } else {
            dtoBuilder.status(StudentStatus.INACTIVE);
        }

        List<StudentSubjectEnrollment> enrollments = studentSubjectEnrollmentRepository
                .findByStudentId(student.getId());

        List<SubjectResponseDTO> subjectsDTOs = enrollments.stream()
                .map(ss -> SubjectResponseDTO.builder()
                        .id(ss.getSubject().getId())
                        .name(ss.getSubject().getName())
                        .code(ss.getSubject().getCode())
                        .mandatory(ss.isMandatory())
                        .build())
                .collect(Collectors.toList());

        dtoBuilder.subjectResponseDTOS(subjectsDTOs);

        return dtoBuilder.build();
    }
}
