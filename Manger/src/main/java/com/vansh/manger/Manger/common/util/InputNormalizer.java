package com.vansh.manger.Manger.common.util;

/**
 * Centralized input-normalization utilities.
 *
 * <p><b>SRP</b> — one place for all "clean the input" logic.
 * <b>DRY</b> — replaces identical normalizeRequiredEmail / normalizeOptional
 * methods that were duplicated across AdminStudentService,
 * AdminTeacherService, AdminClassroomService, and AdminSubjectService.</p>
 */
public final class InputNormalizer {

    private InputNormalizer() {
        // utility class — no instances
    }

    /**
     * Trims and lowercases an email, throwing if blank.
     * Replaces: AdminStudentService.normalizeRequiredEmail()
     *           AdminTeacherService.normalizeRequiredEmail()
     */
    public static String requireEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        return email.trim().toLowerCase();
    }

    /**
     * Trims an optional string; returns null if blank.
     * Replaces: AdminTeacherService.normalizeOptional()
     */
    public static String optional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Trims and uppercases a required string (e.g. classroom section, subject code).
     * Replaces: AdminClassroomService.normalizeSection()
     *           AdminSubjectService.normalizeSubjectCode()
     */
    public static String requireUpperCase(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value.trim().toUpperCase();
    }

    /**
     * Trims a required string without case change (e.g. subject name).
     * Replaces: AdminSubjectService.normalizeSubjectName()
     */
    public static String requireTrimmed(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value.trim();
    }
}
