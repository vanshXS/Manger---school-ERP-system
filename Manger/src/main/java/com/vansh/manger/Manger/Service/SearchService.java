package com.vansh.manger.Manger.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // --- NEW IMPORT ---

import com.vansh.manger.Manger.DTO.GlobalSearchResponseDTO;
import com.vansh.manger.Manger.DTO.SearchResultDTO;
import com.vansh.manger.Manger.Entity.AcademicYear; // --- NEW IMPORT ---
import com.vansh.manger.Manger.Entity.Classroom;
import com.vansh.manger.Manger.Entity.Student;
import com.vansh.manger.Manger.Entity.Teacher;
// --- IMPORT ALL ---
import com.vansh.manger.Manger.Repository.AcademicYearRepository;
import com.vansh.manger.Manger.Repository.ClassroomRespository;
import com.vansh.manger.Manger.Repository.EnrollmentRepository;
import com.vansh.manger.Manger.Repository.StudentRepository;
import com.vansh.manger.Manger.Repository.TeacherRespository;
import com.vansh.manger.Manger.Specification.SearchSpecification;
import com.vansh.manger.Manger.util.AdminSchoolConfig;

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