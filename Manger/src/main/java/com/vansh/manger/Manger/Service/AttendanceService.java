package com.vansh.manger.Manger.Service;


import com.vansh.manger.Manger.DTO.AttendanceResponseDTO;
import com.vansh.manger.Manger.DTO.BulkAttendanceRequestDTO;
import com.vansh.manger.Manger.DTO.StudentAttendanceRecord;
import com.vansh.manger.Manger.Entity.*;
import com.vansh.manger.Manger.Repository.*;
import com.vansh.manger.Manger.util.TeacherSchoolConfig;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService{

    private final AttendanceRepository attendanceRepository;
    private final TeacherRespository teacherRespository;
    private final TeacherSchoolConfig schoolConfig;
    private final ClassroomRespository classroomRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final ActivityLogService activityLogService;



    @Transactional
    public List<AttendanceResponseDTO> markAttendance(BulkAttendanceRequestDTO requestDTO) {

        School currentSchool = schoolConfig.requireCurrentSchool();

        String userEmail = schoolConfig.getTeacher().getEmail();

        Teacher teacher = teacherRespository.findByEmailAndSchool_Id(userEmail, currentSchool.getId())
                .orElseThrow(() -> new RuntimeException("Teacher not found with this id"));

        AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, currentSchool.getId())
                .orElseThrow(() -> new  RuntimeException("No active Year found"));

        Classroom classroom = classroomRespository.findByIdAndSchool(requestDTO.getClassroomId(), currentSchool)
                .orElseThrow(() -> new RuntimeException("Classroom not found with this id"));

        if(!teacherAssignmentRepository.existsByTeacherAndClassroom(teacher, classroom)) {
            throw new IllegalStateException("Teacher is not assigned to the classroom");
        }

        List<AttendanceResponseDTO> result = new ArrayList<>();
        for(StudentAttendanceRecord records : requestDTO.getRecords()) {

            Student student = studentRepository.findByIdAndSchool_Id(records.getStudentId(), currentSchool.getId())
                    .orElseThrow(() -> new RuntimeException("Student not found with this id."));
            if(!enrollmentRepository.existsByStudentAndClassroomAndAcademicYear(student, classroom, currentYear)) {
                throw new IllegalStateException("Student not enrolled in specific classroom.");
            }

            if(attendanceRepository.existsByStudentAndClassroomAndLocalDate(student, classroom, requestDTO.getDate())) {
                throw new RuntimeException("Attendance already Marked");
            }

            Attendance savedAttendance = Attendance.builder()
                    .markedBy(teacher)
                    .academicYear(currentYear)
                    .student(student)
                    .classroom(classroom)
                    .present(records.isPresent())
                    .localDate(requestDTO.getDate())
                    .build();

            attendanceRepository.save(savedAttendance);



            result.add(mapToResponse(savedAttendance));

        }
        return result;

    }

    public AttendanceResponseDTO mapToResponse(Attendance attendance) {

        String studentName = attendance.getStudent().getFirstName() + " " + attendance.getStudent().getLastName();
        String classroomName = attendance.getClassroom().getGradeLevel().getDisplayName() + " - " + attendance.getClassroom().getSection();
        String teacherName = schoolConfig.getTeacher().getFirstName() + " " + schoolConfig.getTeacher().getLastName();

        return AttendanceResponseDTO.builder()
                .id(attendance.getId())
                .studentName(studentName)
                .classroomName(classroomName)
                .teacherName(teacherName)
                .present(attendance.isPresent())
                .build();

    }

}