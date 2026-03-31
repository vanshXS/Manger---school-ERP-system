package com.vansh.manger.Manger.student.service;

import java.util.List;

import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;

/**
 * Defines the contract for student subject operations.
 *
 * <p><b>ISP</b> — segregated interface: only elective-subject concerns.
 * <b>DIP</b> — consumers depend on this abstraction.</p>
 */
public interface StudentSubjectOperations {

    /** Assigns an elective subject to a student. */
    StudentResponseDTO assignStudentToSubject(Long studentId, Long subjectId);

    /** Removes an elective subject from a student. */
    void removeSubjectFromStudent(Long studentId, Long subjectId);

    /** Lists all subjects (mandatory + elective) for a student. */
    List<SubjectResponseDTO> getSubjectsOfStudent(Long studentId);
}
