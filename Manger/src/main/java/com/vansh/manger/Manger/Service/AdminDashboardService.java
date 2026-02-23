package com.vansh.manger.Manger.Service;

import com.vansh.manger.Manger.DTO.*;
import com.vansh.manger.Manger.Entity.*;
import com.vansh.manger.Manger.Repository.*;
import com.vansh.manger.Manger.util.AdminSchoolConfig;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final StudentRepository studentRepository;
    private final TeacherRespository teacherRespository;
    private final ClassroomRespository classroomRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AdminSchoolConfig getCurrentSchool;

    /* ──────────────────────────────────────────────────────────────────────
       KPIs — all counts scoped to the admin's school
    ────────────────────────────────────────────────────────────────────── */
    @Transactional
    public DashboardKpiDTO getKpis() {

        long schoolId = getCurrentSchool.requireCurrentSchool().getId();

        // School-scoped counts (not global .count())
        long totalStudents      = studentRepository.countBySchool_Id(schoolId);
        long activeTeachers     = teacherRespository.countBySchool_IdAndActiveTrue(schoolId);
        long unassignedTeachers = teacherRespository
                .findUnassignedTeachersBySchool_Id(schoolId).size();

        // Utilization = enrolled / total capacity
        List<Classroom> classrooms = classroomRespository
                .findBySchoolAndStatus(getCurrentSchool.requireCurrentSchool(), ClassroomStatus.ACTIVE);
        int totalCapacity = classrooms.stream().mapToInt(Classroom::getCapacity).sum();

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, schoolId)
                .orElseThrow(() -> new IllegalStateException("No active academic year found!"));

        long totalEnrolledStudents = enrollmentRepository.countByAcademicYear(currentYear);

        int utilization = totalCapacity > 0
                ? (int) (((double) totalEnrolledStudents / totalCapacity) * 100)
                : 0;

        return DashboardKpiDTO.builder()
                .totalStudents(totalStudents)
                .activeTeachers(activeTeachers)
                .classroomUtilization(utilization)
                .unassignedTeachers(unassignedTeachers)
                .build();
    }

    /* ──────────────────────────────────────────────────────────────────────
       Enrollment overview — one row per classroom with enrolled vs capacity
       Returns ClassroomEnrollmentDTO: { classroomName, capacity, enrolled }
    ────────────────────────────────────────────────────────────────────── */
    public List<ClassroomEnrollmentDTO> getEnrollmentOverview() {

        long schoolId = getCurrentSchool.requireCurrentSchool().getId();

        Optional<AcademicYear> optionalYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, schoolId);

        if (optionalYear.isEmpty()) {
            return Collections.emptyList();
        }

        AcademicYear currentYear = optionalYear.get();

        return classroomRespository.findBySchool_Id(schoolId).stream()
                .map(classroom -> {
                    long enrolled = enrollmentRepository
                            .countByClassroomAndAcademicYearAndSchool_Id(
                                    classroom, currentYear, schoolId);

                    // getDisplayName() returns e.g. "Grade 10 - A" or "Nursery - B"
                    String classroomName = classroom.getGradeLevel().getDisplayName()
                            + " - " + classroom.getSection().toUpperCase();

                    return new ClassroomEnrollmentDTO(
                            classroomName,           // "Grade 10 - A"
                            classroom.getCapacity(), // 40
                            (int) enrolled           // 32
                    );
                })
                .collect(Collectors.toList());
    }

    /* ──────────────────────────────────────────────────────────────────────
       Teacher workload — assignments count per teacher
       Returns TeacherWorkloadDTO: { name, assignedClassesCount }
    ────────────────────────────────────────────────────────────────────── */
    public List<TeacherWorkloadDTO> getTeacherWorkload() {
        return teacherRespository
                .findBySchool_Id(getCurrentSchool.requireCurrentSchool().getId())
                .stream()
                .map(teacher -> new TeacherWorkloadDTO(
                        teacher.getFirstName() + " " + teacher.getLastName(),
                        teacherAssignmentRepository.countByTeacher(teacher)
                ))
                .collect(Collectors.toList());
    }

    /* ──────────────────────────────────────────────────────────────────────
       Recent activity — last 10 logs for this school
       Returns ActivityLogDTO: { description, category, date }
    ────────────────────────────────────────────────────────────────────── */
    public List<ActivityLogDTO> getRecentActivity() {
        return activityLogRepository
                .findTop10BySchool_IdOrderByCreatedAtDesc(
                        getCurrentSchool.requireCurrentSchool().getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Page<ActivityLogDTO> getAllActivityLogs(Pageable pageable) {
        return activityLogRepository
                .findBySchool_IdOrderByCreatedAtDesc(
                        getCurrentSchool.requireCurrentSchool().getId(), pageable)
                .map(this::mapToDTO);
    }

    /* ────────────────── helper ────────────────── */
    private ActivityLogDTO mapToDTO(ActivityLog log) {
        return ActivityLogDTO.builder()
                .description(log.getDescription())
                .category(log.getCategory())
                .date(log.getCreatedAt())
                .build();
    }
}