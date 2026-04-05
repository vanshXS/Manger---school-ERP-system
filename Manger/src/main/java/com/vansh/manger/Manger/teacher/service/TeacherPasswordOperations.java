package com.vansh.manger.Manger.teacher.service;

/**
 * Defines the contract for teacher password operations.
 *
 * <p><b>ISP</b> — segregated interface: only password/security concerns.
 * <b>DIP</b> — consumers depend on this abstraction.</p>
 */
public interface TeacherPasswordOperations {

    /** Generates a new password and emails it to the teacher. */
    void sendPasswordReset(Long teacherId);
}
