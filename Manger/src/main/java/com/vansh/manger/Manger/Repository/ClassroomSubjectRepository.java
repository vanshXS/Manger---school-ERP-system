package com.vansh.manger.Manger.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vansh.manger.Manger.Entity.Classroom;
import com.vansh.manger.Manger.Entity.ClassroomSubject;
import com.vansh.manger.Manger.Entity.Subject;
import com.vansh.manger.Manger.Entity.SubjectType;

public interface ClassroomSubjectRepository
                extends JpaRepository<ClassroomSubject, Long> {

        List<ClassroomSubject> findByClassroom(Classroom classroom);

        List<ClassroomSubject> findByClassroom_Id(Long classroomId);

        List<ClassroomSubject> findByClassroomAndSubjectType(
                        Classroom classroom,
                        SubjectType subjectType);

        Optional<ClassroomSubject> findByClassroomAndSubject(
                        Classroom classroom,
                        Subject subject);
}
