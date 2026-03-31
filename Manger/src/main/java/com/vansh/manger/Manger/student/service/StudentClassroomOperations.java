package com.vansh.manger.Manger.student.service;

import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.StudentStatus;

/**
 * Defines the contract for classroom enrollment operations.
 *
 * <p><b>ISP</b> — segregated interface: only classroom assignment concerns.
 * <b>DIP</b> — consumers depend on this abstraction.</p>
 */
public interface StudentClassroomOperations {

    /** Assigns/transfers a student to a classroom in the current academic year. */
    StudentResponseDTO assignStudentToClassroom(Long studentId, Long newClassroomId);

    /** Removes a student from their current classroom enrollment. */
    void removeStudentFromClassroom(Long studentId);

    /** Updates a student's enrollment status (ACTIVE, INACTIVE, etc.). */
    void updateStatus(Long studentId, StudentStatus status);
}
