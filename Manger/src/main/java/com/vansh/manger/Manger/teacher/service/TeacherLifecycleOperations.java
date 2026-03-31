package com.vansh.manger.Manger.teacher.service;

/**
 * ISP: Operations for teacher lifecycle management (activation/deactivation/deletion).
 * Consumers that only need status changes depend on this interface.
 */
public interface TeacherLifecycleOperations {
    void toggleStatus(Long teacherId, boolean active);
    void delete(Long teacherId);
}
