package com.vansh.manger.Manger.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.vansh.manger.Manger.exam.entity.Grade;

public enum GradeLevel {

    NURSERY (0,  "Nursery",  "NUR"),
    LKG     (1,  "LKG",      "LKG"),
    UKG     (2,  "UKG",      "UKG"),
    GRADE_1 (3,  "Grade 1",  "G01"),
    GRADE_2 (4,  "Grade 2",  "G02"),
    GRADE_3 (5,  "Grade 3",  "G03"),
    GRADE_4 (6,  "Grade 4",  "G04"),
    GRADE_5 (7,  "Grade 5",  "G05"),
    GRADE_6 (8,  "Grade 6",  "G06"),
    GRADE_7 (9,  "Grade 7",  "G07"),
    GRADE_8 (10, "Grade 8",  "G08"),
    GRADE_9 (11, "Grade 9",  "G09"),
    GRADE_10(12, "Grade 10", "G10"),
    GRADE_11(13, "Grade 11", "G11"),
    GRADE_12(14, "Grade 12", "G12");

    private final int order;
    private final String displayName;
    private final String code;

    GradeLevel(int order, String displayName, String code) {
        this.order = order;
        this.displayName = displayName;
        this.code = code;
    }

    public int getOrder() {
        return order;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    /** Short code used for roll number generation: "NUR", "LKG", "UKG", "G01" … "G12" */
    public String getCode() {
        return code;
    }

    /**
     * Returns the next GradeLevel in sequence, or null if this is the last grade.
     * Used by promotion logic instead of gradeLevel + 1.
     */
    public GradeLevel next() {
        GradeLevel[] values = GradeLevel.values();
        int nextOrdinal = this.ordinal() + 1;
        return nextOrdinal < values.length ? values[nextOrdinal] : null;
    }

    /**
     * Allows deserialization from displayName string (e.g. "Grade 10" → GRADE_10)
     */
    @JsonCreator
    public static GradeLevel fromDisplayName(String displayName) {
        for (GradeLevel gl : values()) {
            if (gl.displayName.equalsIgnoreCase(displayName)) {
                return gl;
            }
        }
        // Fallback: try by enum name (e.g. "GRADE_10")
        try {
            return GradeLevel.valueOf(displayName.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown grade level: " + displayName);
        }
    }
}