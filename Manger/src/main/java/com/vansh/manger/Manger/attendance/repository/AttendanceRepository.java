package com.vansh.manger.Manger.attendance.repository;

import com.vansh.manger.Manger.academicyear.entity.*;
import com.vansh.manger.Manger.attendance.entity.*;
import com.vansh.manger.Manger.auth.entity.*;
import com.vansh.manger.Manger.classroom.entity.*;
import com.vansh.manger.Manger.common.entity.*;
import com.vansh.manger.Manger.exam.entity.*;
import com.vansh.manger.Manger.student.entity.*;
import com.vansh.manger.Manger.subject.entity.*;
import com.vansh.manger.Manger.teacher.entity.*;
import com.vansh.manger.Manger.timetable.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByEnrollmentAndLocalDate(Enrollment enrollment, LocalDate date);
    Optional<Attendance> findByEnrollmentAndLocalDate(Enrollment enrollment, LocalDate date);
    Optional<Attendance>findByEnrollment(Enrollment enrollment);

    List<Attendance> findByEnrollment_ClassroomAndLocalDate(Classroom classroom, LocalDate date);
    List<Attendance> findByEnrollment_ClassroomAndAcademicYear(Classroom classroom, AcademicYear academicYear);
    List<Attendance> findByEnrollmentAndAcademicYear(Enrollment enrollment, AcademicYear academicYear);
    List<Attendance> findByEnrollmentInAndAcademicYear(List<Enrollment> enrollments, AcademicYear academicYear);


}
