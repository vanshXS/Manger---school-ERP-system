package com.vansh.manger.Manger.student.service;

import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentEnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final AdminSchoolConfig adminSchoolConfig;
    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;


    public Enrollment createEnrollment(Student student, Classroom classroom,String rollNo, AcademicYear academicYear, StudentStatus status, School school) {



        Enrollment firstEnrollment = Enrollment.builder()
                .student(student)
                .classroom(classroom)
                .academicYear(academicYear)
                .status(status)
                .rollNo(rollNo)
                .school(school)
                .build();

       return  enrollmentRepository.save(firstEnrollment);

    }


    public String generateNextRollNoForClass(Classroom classroom, AcademicYear academicYear) {

        long count = enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(classroom, academicYear, adminSchoolConfig.requireCurrentSchoolId());

        String sequence = String.format("%03d", count + 1); // "001", "002", ...
        String gradeCode = classroom.getGradeLevel().getCode(); // "NUR", "LKG", "G10"
        String section = classroom.getSection().trim().toUpperCase(); // "A", "B"
        String yearStr = String.valueOf(academicYear.getStartDate().getYear()); // "2025"

        return gradeCode + "-" + section + "-" + yearStr + "-" + sequence;
    }
}
