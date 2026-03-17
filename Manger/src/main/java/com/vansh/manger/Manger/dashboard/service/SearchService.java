package com.vansh.manger.Manger.dashboard.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // --- NEW IMPORT ---

import com.vansh.manger.Manger.dashboard.dto.GlobalSearchResponseDTO;
import com.vansh.manger.Manger.dashboard.dto.SearchResultDTO;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear; // --- NEW IMPORT ---
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.teacher.entity.Teacher;
// --- IMPORT ALL ---
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.dashboard.specification.SearchSpecification;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

        private final StudentRepository studentRepository;
        private final TeacherRespository teacherRespository;
        private final ClassroomRespository classroomRespository;
        private final AdminSchoolConfig getCurrentSchool;

        // --- NEWLY REQUIRED REPOSITORIES ---
        private final EnrollmentRepository enrollmentRepository;
        private final AcademicYearRepository academicYearRepository;

        @Transactional(readOnly = true) // Required for lazy-loading or new queries
        public GlobalSearchResponseDTO performGlobalSearch(String query) {
                if (query == null || query.trim().isEmpty()) {
                        return new GlobalSearchResponseDTO();
                }

                PageRequest pageRequest = PageRequest.of(0, 5); // Limit all searches to 5 results

                // Student search logic (enhanced)
                Specification<Student> studentSpec = SearchSpecification.studentSearch(query);
                List<SearchResultDTO> students = studentRepository.findAll(studentSpec, pageRequest).getContent()
                                .stream()
                                .map(s -> new SearchResultDTO(s.getId(), s.getFirstName() + " " + s.getLastName(),
                                                "Student", "student",
                                                "/admin/students/" + s.getId()))
                                .collect(Collectors.toList());

                // Teacher search logic (enhanced)
                Specification<Teacher> teacherSpec = SearchSpecification.teacherSearch(query);
                List<SearchResultDTO> teachers = teacherRespository.findAll(teacherSpec, pageRequest).getContent()
                                .stream()
                                .map(t -> new SearchResultDTO(t.getId(), t.getFirstName() + " " + t.getLastName(),
                                                "Teacher", "teacher",
                                                "/admin/teachers/" + t.getId()))
                                .collect(Collectors.toList());

                // --- REFACTORED CLASSROOM SEARCH ---
                AcademicYear currentYear = academicYearRepository
                                .findByIsCurrentAndSchool_Id(true, getCurrentSchool.requireCurrentSchool().getId())
                                .orElse(null);
                Specification<Classroom> classroomSpec = SearchSpecification.classroomSectionLike(query);
                List<SearchResultDTO> classrooms = classroomRespository.findAll(classroomSpec, pageRequest).getContent()
                                .stream()
                                .map(c -> {
                                        long studentCount = (currentYear != null)
                                                        ? enrollmentRepository
                                                                        .countByClassroomAndAcademicYearAndSchool_Id(c,
                                                                                        currentYear,
                                                                                        getCurrentSchool.requireCurrentSchool()
                                                                                                        .getId())
                                                        : 0;
                                        return new SearchResultDTO(c.getId(), c.getSection(),
                                                        studentCount + " Students Enrolled",
                                                        "classroom", "/admin/classrooms");
                                })
                                .collect(Collectors.toList());

                GlobalSearchResponseDTO response = new GlobalSearchResponseDTO();
                response.setStudents(students);
                response.setTeachers(teachers);
                response.setClassrooms(classrooms);

                return response;
        }
}