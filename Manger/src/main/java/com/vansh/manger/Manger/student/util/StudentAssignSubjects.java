package com.vansh.manger.Manger.student.util;

import java.util.List;

import org.springframework.stereotype.Component;

import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StudentAssignSubjects {

    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;



     public void autoAssignMandatorySubjects(Student student, Classroom classroom) {

                List<TeacherAssignment> mandatoryAssignments = teacherAssignmentRepository
                                .findByClassroomAndMandatoryTrue(classroom);

                for (TeacherAssignment assignment : mandatoryAssignments) {

                        boolean exists = studentSubjectEnrollmentRepository
                                        .existsByStudentAndSubject(student, assignment.getSubject());

                        if (!exists) {
                                StudentSubjectEnrollment enrollment = StudentSubjectEnrollment.builder()
                                                .student(student)
                                                .subject(assignment.getSubject())
                                                .mandatory(true)
                                                .build();

                                studentSubjectEnrollmentRepository.save(enrollment);
                        }
                }
        }
}
