package com.vansh.manger.Manger.Entity;


import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ExamType {
    UNIT_TEST("Unit Test"),
    MID_TERM("Mid Term"),
    FINAL_TERM("Final Term"),
    PRACTICAL("Practical"),
    ASSIGNMENT("Assignment"),
    MOCK_TEST("Mock Test");

    private final String displayName;

    ExamType(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ExamType fromDisplayName(String value) {
        for (ExamType type : values()) {
            if (type.displayName.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown exam type: " + value);
    }
}
