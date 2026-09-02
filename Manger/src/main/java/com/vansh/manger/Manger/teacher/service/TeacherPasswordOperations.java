package com.vansh.manger.Manger.teacher.service;

/**
 * Defines the contract for teacher password operations.
 *
 * <p><b>ISP</b> — segregated interface: only password/security concerns.
 * <b>DIP</b> — consumers depend on this abstraction.</p>
 */
public interface TeacherPasswordOperations {

    /** Generates a new password, emails it to the teacher best-effort, and returns the raw password. */
    String sendPasswordReset(Long teacherId);
}
