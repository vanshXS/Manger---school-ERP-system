package com.vansh.manger.Manger.student.service;

import java.io.IOException;

import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;

/**
 * Defines the contract for student admission operations.
 *
 * <p><b>ISP</b> — segregated interface: only the admission concern.
 * <b>DIP</b> — consumers (facade / controller) depend on this
 * abstraction, not the concrete implementation.
 * <b>OCP</b> — open for extending admission logic (e.g. batch import)
 * without modifying existing consumers.</p>
 */
public interface StudentAdmissionOperations {

    /**
     * Creates a new student: User account, Student entity, first Enrollment,
     * mandatory subject assignment, and welcome email.
     */
    StudentResponseDTO createStudent(StudentRequestDTO studentRequestDTO) throws IOException;
}
