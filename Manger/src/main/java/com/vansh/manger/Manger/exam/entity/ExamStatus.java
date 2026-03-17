package com.vansh.manger.Manger.exam.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ExamStatus {
    UPCOMING("Upcoming"),
    ONGOING("Ongoing"),
    COMPLETED("Completed");

    private final String displayName;

    ExamStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }
}
