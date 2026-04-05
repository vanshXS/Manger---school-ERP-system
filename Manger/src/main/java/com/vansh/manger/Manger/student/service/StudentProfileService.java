package com.vansh.manger.Manger.student.service;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.common.util.ImageCleanupHelper;
import com.vansh.manger.Manger.common.util.InputNormalizer;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.student.mapper.StudentResponseMapper;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import com.vansh.manger.Manger.student.specification.StudentSpecification;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Handles student profile CRUD and listings.
 *
 * <p><b>SRP</b> — one responsibility: student profile lifecycle (read, update, delete, list).
 * <b>LSP</b> — faithfully implements {@link StudentProfileOperations}.
 * <b>DIP</b> — depends on {@link StudentResponseMapper} (abstraction) for mapping,
 * {@link ImageCleanupHelper} for image lifecycle.</p>
 */
@Service
@RequiredArgsConstructor
public class StudentProfileService implements StudentProfileOperations {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassroomRespository classroomRespository;
    private final AcademicYearRepository academicYearRepository;
    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;
    private final StudentSubjectMarksRepository studentSubjectsRepository;
    private final AdminSchoolConfig getCurrentSchool;

    private final ActivityLogService activityLogService;
    private final FileStorageService fileStorageService;
    private final ImageCleanupHelper imageCleanupHelper;
    private final StudentResponseMapper studentResponseMapper;

    @Override
    @Transactional
    public StudentResponseDTO getStudentById(Long studentId) {
        School school = getCurrentSchool.requireCurrentSchool();

        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElse(null);

        return studentResponseMapper.toDTO(student, currentEnrollment, school.getId());
    }

    @Override
    @Transactional
    public Page<StudentResponseDTO> getAllStudents(StudentStatus status, String search, Pageable pageable) {
        School school = getCurrentSchool.requireCurrentSchool();

        Specification<Student> spec = StudentSpecification.build(status, search, school.getId());

        Page<Student> page = studentRepository.findAll(spec, pageable);
        List<Student> students = page.getContent();
        if (students.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, page.getTotalElements());
        }

        // Batch fetch enrollments
        List<Enrollment> currentEnrollments = enrollmentRepository
                .findByStudentInAndSchool_IdAndAcademicYearIsCurrent(students, school.getId(), true);
        Map<Long, Enrollment> enrollmentByStudentId = currentEnrollments.stream()
                .collect(Collectors.toMap(e -> e.getStudent().getId(), e -> e));

        // Batch fetch subject enrollments
        Map<Long, List<StudentSubjectEnrollment>> subjectEnrollmentsByStudentId =
                studentSubjectEnrollmentRepository
                        .findByStudentIdIn(students.stream().map(Student::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(e -> e.getStudent().getId()));

        // Batch fetch classroom student counts
        List<Long> classroomIds = currentEnrollments.stream()
                .map(e -> e.getClassroom().getId())
                .distinct()
                .toList();
        Map<Long, Long> currentStudentCounts = classroomIds.isEmpty()
                ? Collections.emptyMap()
                : enrollmentRepository
                        .countCurrentEnrollmentsByClassroomIds(school.getId(), classroomIds)
                        .stream()
                        .collect(Collectors.toMap(
                                row -> (Long) row[0],
                                row -> (Long) row[1]));

        List<StudentResponseDTO> content = students.stream()
                .map(student -> studentResponseMapper.toDTO(
                        student,
                        enrollmentByStudentId.get(student.getId()),
                        subjectEnrollmentsByStudentId.getOrDefault(student.getId(), List.of()),
                        currentStudentCounts))
                .toList();

        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional
    public StudentResponseDTO updateStudent(Long studentId, StudentRequestDTO studentRequestDTO)
            throws IOException {
        School school = getCurrentSchool.requireCurrentSchool();

        Student existedStudent = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not present in the existed school."));
        String normalizedEmail = InputNormalizer.requireEmail(studentRequestDTO.getEmail());

        // Check for email conflict
        studentRepository.findByEmailAndSchool_Id(normalizedEmail, school.getId()).ifPresent(s -> {
            if (!s.getId().equals(studentId))
                throw new IllegalArgumentException("This email is already taken.");
        });

        CloudinaryResponse uploadedProfilePicture = fileStorageService
                .uploadStudentProfile(studentRequestDTO.getProfilePicture(), normalizedEmail);
        String previousPublicId = existedStudent.getProfilePicturePublicId();

        existedStudent.setFirstName(studentRequestDTO.getFirstName());
        existedStudent.setLastName(studentRequestDTO.getLastName());
        existedStudent.setEmail(normalizedEmail);
        existedStudent.setPhoneNumber(studentRequestDTO.getPhoneNumber());
        existedStudent.setAdmissionNo(studentRequestDTO.getAdmissionNo());

        if (Boolean.TRUE.equals(studentRequestDTO.getRemoveProfilePicture())) {
            existedStudent.setProfilePictureUrl(null);
            existedStudent.setProfilePicturePublicId(null);
        } else if (uploadedProfilePicture != null) {
            existedStudent.setProfilePictureUrl(uploadedProfilePicture.getUrl());
            existedStudent.setProfilePicturePublicId(uploadedProfilePicture.getPublicId());
        }

        existedStudent.setFatherName(studentRequestDTO.getFatherName());
        existedStudent.setMotherName(studentRequestDTO.getMotherName());
        existedStudent.setGuardianName(studentRequestDTO.getGuardianName());
        existedStudent.setParentPhonePrimary(studentRequestDTO.getParentPhonePrimary());
        existedStudent.setParentPhoneSecondary(studentRequestDTO.getParentPhoneSecondary());
        existedStudent.setParentEmail(studentRequestDTO.getParentEmail());
        existedStudent.setParentOccupation(studentRequestDTO.getParentOccupation());
        existedStudent.setAnnualIncome(studentRequestDTO.getAnnualIncome());
        existedStudent.setFullAddress(studentRequestDTO.getFullAddress());
        existedStudent.setCity(studentRequestDTO.getCity());
        existedStudent.setState(studentRequestDTO.getState());
        existedStudent.setPincode(studentRequestDTO.getPincode());
        existedStudent.setMedicalConditions(studentRequestDTO.getMedicalConditions());
        existedStudent.setAllergies(studentRequestDTO.getAllergies());
        existedStudent.setEmergencyContactName(studentRequestDTO.getEmergencyContactName());
        existedStudent.setEmergencyContactNumber(studentRequestDTO.getEmergencyContactNumber());
        existedStudent.setPreviousSchoolName(studentRequestDTO.getPreviousSchoolName());
        existedStudent.setPreviousClass(studentRequestDTO.getPreviousClass());
        existedStudent.setAdmissionDate(studentRequestDTO.getAdmissionDate());
        if (studentRequestDTO.getTransportRequired() != null)
            existedStudent.setTransportRequired(studentRequestDTO.getTransportRequired());
        if (studentRequestDTO.getHostelRequired() != null)
            existedStudent.setHostelRequired(studentRequestDTO.getHostelRequired());
        existedStudent.setFeeCategory(studentRequestDTO.getFeeCategory());
        existedStudent.setGender(studentRequestDTO.getGender());

        // Keep User entity in sync
        existedStudent.getUser()
                .setFullName(studentRequestDTO.getFirstName() + " " + existedStudent.getLastName());
        existedStudent.getUser().setEmail(normalizedEmail);

        Student updated = studentRepository.save(existedStudent);
        imageCleanupHelper.deleteOldImage(previousPublicId,
                uploadedProfilePicture != null ? uploadedProfilePicture.getPublicId() : null);

        activityLogService.logActivity(
                "Updated student profile: " + updated.getFirstName() + " " + updated.getLastName(),
                "Student Update");

        Enrollment currentEnrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(updated, school.getId(), true)
                .orElse(null);

        return studentResponseMapper.toDTO(updated, currentEnrollment, school.getId());
    }

    @Override
    @Transactional
    public void deleteById(Long studentId) {
        School school = getCurrentSchool.requireCurrentSchool();
        Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        Enrollment enrollment = enrollmentRepository
                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                .orElseThrow(() -> new RuntimeException("Student has no active enrollment."));

        if (enrollment.getStatus() != StudentStatus.INACTIVE) {
            throw new IllegalStateException("Student must be INACTIVE before permanent deletion");
        }

        // Data integrity cascade
        studentSubjectsRepository.deleteByEnrollment_StudentId(studentId);
        studentSubjectEnrollmentRepository.deleteByStudentId(studentId);
        enrollmentRepository.deleteByStudentId(studentId);

        String profilePicturePublicId = student.getProfilePicturePublicId();
        studentRepository.delete(student);

        imageCleanupHelper.deleteOldImage(profilePicturePublicId, null);

        activityLogService.logActivity(
                "Deleted student: " + student.getFirstName() + " " + student.getLastName(),
                "Student Deletion");
    }

    @Override
    @Transactional
    public List<StudentResponseDTO> getStudentsByClassroom(Long classroomId) {
        School school = getCurrentSchool.requireCurrentSchool();
        Classroom classroom = classroomRespository.findByIdAndSchool(classroomId, school)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, school.getId())
                .orElseThrow(() -> new IllegalStateException("No active academic year is set!"));

        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndSchool_IdAndAcademicYear(
                classroom, school.getId(), currentYear);

        return enrollments.stream()
                .map(enrollment -> studentResponseMapper.toDTO(
                        enrollment.getStudent(), enrollment, school.getId()))
                .toList();
    }
}
