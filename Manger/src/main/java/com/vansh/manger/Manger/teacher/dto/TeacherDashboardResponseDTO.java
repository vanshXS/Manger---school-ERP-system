package com.vansh.manger.Manger.teacher.dto;

import java.time.LocalTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.vansh.manger.Manger.common.dto.ActivityLogDTO;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDashboardResponseDTO {

    private QuickStats quickStats;

    private List<TodayClassDTO> todayClasses;
    private List<PendingTaskDTO> pendingTasks;
    private List<WeakStudentDTO> weakStudents;
    private List<ActivityLogDTO> recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickStats {
        private Integer totalStudentsTaught;
        private Integer weeklyClasses;
        private Integer classesAssigned;
        private Integer subjectsTaught;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TodayClassDTO {
        private Long id;
        private String subjectName;
        private String className;
        private String timeSlot;
        private LocalTime startTime;
        private LocalTime endTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingTaskDTO {
        private String title;
        private String type;
        private String actionUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeakStudentDTO {
        private Long studentId;
        private Long classroomId;
        private String studentName;
        private String className;
        private String riskLevel;
        private Integer riskScore;
        private Double attendancePercentage;
        private Double averagePercentage;
        private String weakestSubject;
        private String reason;
        private String recommendedAction;
    }
}
