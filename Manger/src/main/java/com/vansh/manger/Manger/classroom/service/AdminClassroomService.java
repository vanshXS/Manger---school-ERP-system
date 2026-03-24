package com.vansh.manger.Manger.classroom.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.classroom.dto.ClassroomRequestDTO;
import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.classroom.entity.ClassroomStatus;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import com.vansh.manger.Manger.common.entity.GradeLevel;

@Service
@RequiredArgsConstructor
public class AdminClassroomService {

        private final ClassroomRespository classroomRespository;
        private final TeacherAssignmentRepository teacherAssignmentRepository;
        private final AcademicYearRepository academicYearRepository;
        private final EnrollmentRepository enrollmentRepository;
        private final AdminSchoolConfig getCurrentSchool;

        public ClassroomResponseDTO mapToResponse(Classroom classroom) {
                AcademicYear currentYear = academicYearRepository
                                .findByIsCurrentAndSchool_Id(true, getCurrentSchool.requireCurrentSchool().getId())
                                .orElse(null);

                long studentCount = 0;
                if (currentYear != null) {
                        studentCount = enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(
                                        classroom, currentYear, getCurrentSchool.requireCurrentSchool().getId());
                }

                return ClassroomResponseDTO.builder()
                                .id(classroom.getId())
                                .section(classroom.getSection().toUpperCase())
                                .capacity(classroom.getCapacity())
                                .studentCount(studentCount)
                                .gradeLevel(classroom.getGradeLevel()) // GradeLevel enum — serializes as displayName
                                .status(classroom.getStatus())
                                .build();
        }

        @Transactional
        public ClassroomResponseDTO createClassroom(ClassroomRequestDTO dto) {
                School adminSchool = getCurrentSchool.requireCurrentSchool();
                String normalizedSection = normalizeSection(dto.getSection());
                validateCapacity(dto.getCapacity());

                if (classroomRespository.existsByGradeLevelAndSectionAndSchool(
                                dto.getGradeLevel(), normalizedSection, adminSchool)) {
                        throw new IllegalStateException(
                                        "Classroom already exists for " + dto.getGradeLevel().getDisplayName()
                                                        + " - " + normalizedSection);
                }

                Classroom classroom = Classroom.builder()
                                .section(normalizedSection)
                                .status(ClassroomStatus.ACTIVE)
                                .gradeLevel(dto.getGradeLevel())
                                .capacity(dto.getCapacity())
                                .school(adminSchool)
                                .build();

                return mapToResponse(classroomRespository.save(classroom));
        }

        @Transactional
        public ClassroomResponseDTO updateClassroom(Long id, ClassroomRequestDTO dto) {
                School adminSchool = getCurrentSchool.requireCurrentSchool();
                String normalizedSection = normalizeSection(dto.getSection());
                validateCapacity(dto.getCapacity());

                Classroom classroom = classroomRespository.findByIdAndSchool(id, adminSchool)
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

                // Only check duplicate if section is actually changing
                boolean sectionChanged = !classroom.getSection().equalsIgnoreCase(normalizedSection);
                boolean gradeChanged = classroom.getGradeLevel() != dto.getGradeLevel();

                if ((sectionChanged || gradeChanged) &&
                                classroomRespository.existsByGradeLevelAndSectionAndSchool(
                                                dto.getGradeLevel(), normalizedSection, adminSchool)) {
                        throw new IllegalStateException(
                                        "A classroom already exists for " + dto.getGradeLevel().getDisplayName()
                                                        + " - " + normalizedSection);
                }

                classroom.setGradeLevel(dto.getGradeLevel());
                classroom.setSection(normalizedSection);
                classroom.setCapacity(dto.getCapacity());

                return mapToResponse(classroomRespository.save(classroom));
        }

        @Transactional
        public void deleteClassroom(Long id) {
                Classroom classroom = classroomRespository.findByIdAndSchool(id, getCurrentSchool.requireCurrentSchool())
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

                if (enrollmentRepository.existsByClassroom(classroom)) {
                        throw new IllegalStateException(
                                        "Cannot delete classroom with enrollment history. Please archive it instead.");
                }
                if (teacherAssignmentRepository.existsByClassroom(classroom)) {
                        throw new IllegalStateException(
                                        "Cannot delete classroom with assigned teachers/subjects. Please archive it instead.");
                }

                classroomRespository.delete(classroom);
        }

        public List<ClassroomResponseDTO> getAllActiveClassrooms() {
                return classroomRespository
                                .findBySchoolAndStatus(getCurrentSchool.requireCurrentSchool(), ClassroomStatus.ACTIVE)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public List<ClassroomResponseDTO> getClassroomsByStatus(ClassroomStatus status) {
                return classroomRespository
                                .findBySchoolAndStatus(getCurrentSchool.requireCurrentSchool(), status)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Transactional
        public ClassroomResponseDTO updateClassroomStatus(Long id, ClassroomStatus newStatus) {
                School adminSchool = getCurrentSchool.requireCurrentSchool();
                if (newStatus == null) {
                        throw new IllegalArgumentException("Classroom status is required.");
                }

                Classroom classroom = classroomRespository.findByIdAndSchool(id, adminSchool)
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + id));

                if (newStatus == ClassroomStatus.ARCHIVED) {
                        AcademicYear currentYear = academicYearRepository
                                        .findByIsCurrentAndSchool_Id(true, adminSchool.getId())
                                        .orElse(null);

                        if (currentYear != null &&
                                        enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(
                                                        classroom, currentYear, adminSchool.getId()) > 0) {
                                throw new IllegalStateException(
                                                "Cannot archive a classroom with students currently enrolled. Please transfer students first.");
                        }
                }

                classroom.setStatus(newStatus);
                return mapToResponse(classroomRespository.save(classroom));
        }

        public ClassroomResponseDTO getClassroomById(Long id, Long schoolId) {
                Classroom classroom = classroomRespository
                                .findByIdAndSchool(id, getCurrentSchool.requireCurrentSchool())
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

                return mapToResponse(classroom);
        }

        public List<java.util.Map<String, Object>> getSubjectsByClassroom(Long classroomId) {
                classroomRespository.findByIdAndSchool(classroomId, getCurrentSchool.requireCurrentSchool())
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Classroom not found with id: " + classroomId));

                return teacherAssignmentRepository.findByClassroomId(classroomId)
                                .stream()
                                .map(ta -> {
                                        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                                        map.put("id", ta.getSubject().getId());
                                        map.put("name", ta.getSubject().getName());
                                        map.put("code", ta.getSubject().getCode());
                                        return map;
                                })
                                .toList();
        }

        private String normalizeSection(String section) {
                if (section == null || section.trim().isEmpty()) {
                        throw new IllegalArgumentException("Classroom section is required.");
                }
                return section.trim().toUpperCase();
        }

        private void validateCapacity(Integer capacity) {
                if (capacity == null || capacity <= 0) {
                        throw new IllegalArgumentException("Classroom capacity must be greater than zero.");
                }
        }
}
