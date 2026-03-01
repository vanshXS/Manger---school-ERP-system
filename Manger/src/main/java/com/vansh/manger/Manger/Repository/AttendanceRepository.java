package com.vansh.manger.Manger.Repository;

import com.vansh.manger.Manger.Entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByStudentAndClassroomAndLocalDate(Student student, Classroom classroom, LocalDate date);

    List<Attendance> findByClassroomAndLocalDate(Classroom classroom, LocalDate date);

    long countByStudentAndClassroomAndAcademicYearAndPresent(Student student, Classroom classroom, AcademicYear academicYear, boolean present);

    long countByClassroomAndAcademicYear(Classroom classroom, AcademicYear academicYear);
}
