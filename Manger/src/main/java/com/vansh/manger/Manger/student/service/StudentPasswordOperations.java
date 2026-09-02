package com.vansh.manger.Manger.student.service;

/**
 * Defines the contract for student password operations.
 *
 * <p><b>ISP</b> — segregated interface: only password/security concerns.
 * <b>DIP</b> — consumers depend on this abstraction.</p>
 */
public interface StudentPasswordOperations {

    /** Generates a new password, emails it to the student best-effort, and returns the raw password. */
    String sendPasswordReset(Long studentId);
}
