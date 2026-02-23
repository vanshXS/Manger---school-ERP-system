package com.vansh.manger.Manger.Specification;

import org.springframework.data.jpa.domain.Specification;

import com.vansh.manger.Manger.Entity.Classroom;
import com.vansh.manger.Manger.Entity.Enrollment;
import com.vansh.manger.Manger.Entity.Student;
import com.vansh.manger.Manger.Entity.Teacher;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

/**
 * A single file to hold all JPA Specifications for the global search feature.
 * This keeps related search logic consolidated and easy to manage.
 */

public class SearchSpecification {

        /**
         * Creates a Specification to search for Students by their full name.
         * 
         * @param query The search term.
         * @return A Specification for the Student entity.
         */

        public static Specification<Student> studentSearch(String query) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                return (root, criteriaQuery, criteriaBuilder) -> {
                        // Join with enrollment for rollNo
                        Join<Student, Enrollment> enrollmentJoin = root.join("enrollments", JoinType.LEFT);

                        // Using distinct because a student can have multiple enrollments
                        criteriaQuery.distinct(true);

                        return criteriaBuilder.or(
                                        criteriaBuilder.like(
                                                        criteriaBuilder.lower(criteriaBuilder.concat(
                                                                        root.get("firstName"),
                                                                        criteriaBuilder.concat(" ",
                                                                                        root.get("lastName")))),
                                                        searchPattern),
                                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern),
                                        criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")),
                                                        searchPattern),
                                        criteriaBuilder.like(criteriaBuilder.lower(enrollmentJoin.get("rollNo")),
                                                        searchPattern));
                };
        }

        /**
         * Creates a Specification to search for Teachers by their full name.
         * 
         * @param query The search term.
         * @return A Specification for the Teacher entity.
         */

        public static Specification<Teacher> teacherSearch(String query) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                return (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                                criteriaBuilder.like(
                                                criteriaBuilder.lower(criteriaBuilder.concat(root.get("firstName"),
                                                                criteriaBuilder.concat(" ", root.get("lastName")))),
                                                searchPattern),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), searchPattern));
        }

        /**
         * Creates a Specification to search for Classrooms by their section.
         * 
         * @param query The search term.
         * @return A Specification for the Classroom entity.
         */

        public static Specification<Classroom> classroomSectionLike(String query) {
                return (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("section")),
                                "%" + query.toLowerCase() + "%");
        }
}