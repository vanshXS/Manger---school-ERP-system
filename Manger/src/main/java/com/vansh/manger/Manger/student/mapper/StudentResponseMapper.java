package com.vansh.manger.Manger.student.mapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.common.util.GradeCalculator;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Single source of truth for mapping Student entities → response DTOs.
 *
 * <p><b>SRP</b> — one responsibility: entity-to-DTO conversion.
 * <b>DRY</b> — replaces the identical ~70-line mapToStudentResponseDTO()
 * that was copy-pasted across AdminStudentService, AttendanceService,
 * and StudentPortalService.
 * <b>OCP</b> — any new student-view context (e.g. a parent portal) can
 * reuse this mapper without duplicating logic.</p>
 */
@Component
@RequiredArgsConstructor
public class StudentResponseMapper {

    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;
    private final EnrollmentRepository enrollmentRepository;

    // ──────────────────────────────────────────────────────────────
    //  Simple version — fetches subjects + counts internally
    //  Used when mapping a single student (getById, create, etc.)
    // ──────────────────────────────────────────────────────────────

    public StudentResponseDTO toDTO(Student student, Enrollment currentEnrollment, Long schoolId) {
        List<StudentSubjectEnrollment> subjectEnrollments = studentSubjectEnrollmentRepository
                .findByStudentId(student.getId());

        Map<Long, Long> currentStudentCounts = new HashMap<>();
        if (currentEnrollment != null) {
            currentStudentCounts.put(
                    currentEnrollment.getClassroom().getId(),
                    enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(
                            currentEnrollment.getClassroom(),
                            currentEnrollment.getAcademicYear(),
                            schoolId));
        }

        return toDTO(student, currentEnrollment, subjectEnrollments, currentStudentCounts);
    }

    // ──────────────────────────────────────────────────────────────
    //  Batch-optimized version — pre-fetched data passed in
    //  Used when mapping pages of students (getAllStudents)
    // ──────────────────────────────────────────────────────────────

    public StudentResponseDTO toDTO(
            Student student,
            Enrollment currentEnrollment,
            List<StudentSubjectEnrollment> subjectEnrollments,
            Map<Long, Long> currentStudentCounts) {

        StudentResponseDTO.StudentResponseDTOBuilder dtoBuilder = StudentResponseDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .email(student.getEmail())
                .phoneNumber(student.getPhoneNumber())
                .admissionNo(student.getAdmissionNo())
                .profilePictureUrl(student.getProfilePictureUrl())
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
                                    currentStudentCounts.getOrDefault(
                                            currentEnrollment.getClassroom().getId(),
                                            0L))
                            .build());
        } else {
            dtoBuilder.status(StudentStatus.INACTIVE);
        }

        List<SubjectResponseDTO> subjectsDTOs = subjectEnrollments.stream()
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

    // ──────────────────────────────────────────────────────────────
    //  Exam result mapping
    //  Moved from AdminStudentService.mapToStudentExamResult()
    // ──────────────────────────────────────────────────────────────

    public StudentExamResultDTO toExamResultDTO(Exam exam, List<StudentSubjectMarks> marks) {
        List<StudentExamResultDTO.SubjectMark> subjectMarks = marks.stream()
                .map(mark -> {
                    double maxMarks = mark.getTotalMarks() != null ? mark.getTotalMarks() : 100.0;
                    double percentage = maxMarks > 0
                            ? Math.round((mark.getMarksObtained() / maxMarks) * 10000.0) / 100.0
                            : 0.0;

                    return StudentExamResultDTO.SubjectMark.builder()
                            .subjectName(mark.getSubject().getName())
                            .marksObtained(mark.getMarksObtained())
                            .maxMarks(maxMarks)
                            .grade(mark.getGrade())
                            .percentage(percentage)
                            .build();
                })
                .toList();

        double totalObtained = subjectMarks.stream()
                .mapToDouble(mark -> mark.getMarksObtained() != null ? mark.getMarksObtained() : 0)
                .sum();
        double totalMax = subjectMarks.stream()
                .mapToDouble(mark -> mark.getMaxMarks() != null ? mark.getMaxMarks() : 100)
                .sum();
        double percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000.0) / 100.0 : 0.0;
        String overallGrade = GradeCalculator.computeGrade(percentage);

        return StudentExamResultDTO.builder()
                .examId(exam.getId())
                .examName(exam.getName())
                .examStatus(exam.getStatus() != null ? exam.getStatus().name() : "Completed")
                .academicYearName(exam.getAcademicYear() != null ? exam.getAcademicYear().getName() : null)
                .examType(exam.getExamType() != null ? exam.getExamType().name() : null)
                .classroomName(exam.getClassroom() != null
                        ? exam.getClassroom().getGradeLevel().getDisplayName() + " - "
                                + exam.getClassroom().getSection()
                        : null)
                .totalObtained(totalObtained)
                .totalMaxMarks(totalMax)
                .percentage(percentage)
                .overallGrade(overallGrade)
                .subjectMarks(subjectMarks)
                .build();
    }
}
