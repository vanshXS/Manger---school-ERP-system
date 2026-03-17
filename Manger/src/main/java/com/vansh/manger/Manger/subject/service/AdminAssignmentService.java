package com.vansh.manger.Manger.subject.service;

import com.vansh.manger.Manger.subject.dto.AssignmentRequestDTO;
import com.vansh.manger.Manger.subject.dto.AssignmentResponseDTO;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAssignmentService {

    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final TeacherRespository teacherRespository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRespository classroomRespository;
    private final ActivityLogService activityLogService;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;

    //Fetch all assignments for a specific class
       @Transactional
    public List<AssignmentResponseDTO> getAssignmentsByClassroom(Long classroomId) {
            if(!classroomRespository.existsById(classroomId)) {
                throw new IllegalStateException("Classroom not found with this id: " + classroomId);
            }
            return teacherAssignmentRepository.findByClassroomId(classroomId)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentResponseDTO createAssignment(AssignmentRequestDTO requestDTO) {

        Classroom classroom = classroomRespository.findById(requestDTO.getClassroomId())
                .orElseThrow(() -> new RuntimeException("Classroom not found with this ID: " + requestDTO.getClassroomId()));

        Subject subject = subjectRepository.findById(requestDTO.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found with this ID: " + requestDTO.getSubjectId()));

           if(teacherAssignmentRepository.existsByClassroomAndSubject(classroom, subject)) {
               throw new IllegalStateException("This subject is already assigned to this classroom");
           }
           TeacherAssignment assignment = TeacherAssignment.builder()
                   .subject(subject)
                   .classroom(classroom)
                   .mandatory(requestDTO.isMandatory())
                   .teacher(null)
                   .build();

         TeacherAssignment savedAssignment = teacherAssignmentRepository.save(assignment);

         if(savedAssignment.isMandatory()) {

             List<Enrollment> enrollments = enrollmentRepository.findByClassroomId(classroom.getId());

             for(Enrollment e : enrollments) {
                 Student student = e.getStudent();

                 if(!studentSubjectEnrollmentRepository.existsByStudentAndSubject(student, subject)) {
                     StudentSubjectEnrollment studentSubjectEnrollment = StudentSubjectEnrollment.builder()
                                     .student(student)
                                             .subject(subject)
                                                     .build();
                     studentSubjectEnrollmentRepository.save(studentSubjectEnrollment);
                 }
             }
         }
        activityLogService.logActivity(
                subject.getName() +
                        " assigned to " + classroom.getSection() +
                        (savedAssignment.isMandatory() ? " as MANDATORY" : " as OPTIONAL"),
                "Assignment Management"
        );

           return mapToResponse(savedAssignment);
    }

    @Transactional
    public AssignmentResponseDTO updateAssignmentTeacher(Long assignmentId, Long teacherId) {

           TeacherAssignment assignment = teacherAssignmentRepository.findById(assignmentId)
                   .orElseThrow(() -> new EntityNotFoundException("Assignment not found with this ID: " + assignmentId));

           Teacher teacher = teacherRespository.findById(teacherId)
                   .orElseThrow(() -> new EntityNotFoundException("Teacher not found with this ID: " + teacherId));

           if(!teacher.isActive()) {
               throw new IllegalStateException("Teacher with inactive status cannot assigned.");
           }
           assignment.setTeacher(teacher);

           TeacherAssignment savedAssignment = teacherAssignmentRepository.save(assignment);
           activityLogService.logActivity("Teacher: " + teacher.getFirstName() + " " + teacher.getLastName() + " assigned to the Subject: " + savedAssignment.getSubject().getName() + " in Classroom: " + savedAssignment.getClassroom().getSection(), "Assignment Management");
           return mapToResponse(savedAssignment);
    }

    @Transactional
    public AssignmentResponseDTO unassignedTeacher(Long assignmentId) {

           TeacherAssignment existedAssignment = teacherAssignmentRepository.findById(assignmentId).orElseThrow(() -> new EntityNotFoundException("assingment not found with this id."));

           existedAssignment.setTeacher(null);
           return mapToResponse(existedAssignment);
    }

    @Transactional
    public void deleteAssignment(Long assignmentId) {

        TeacherAssignment teacherAssignment = teacherAssignmentRepository.findById(assignmentId)
                        .orElseThrow(() -> new IllegalStateException("Assignment not found with this ID: " + assignmentId));
        teacherAssignmentRepository.deleteById(assignmentId);
        activityLogService.logActivity("Delete the assignment with this ID: " + assignmentId, "Assignment Management");
    }


    private AssignmentResponseDTO mapToResponse(TeacherAssignment assignment) {

        String teacherName = "Unassigned";
        Long teacherId = null;

        if (assignment.getTeacher() != null) {
            teacherName = assignment.getTeacher().getFirstName() + " " +
                    assignment.getTeacher().getLastName();
            teacherId = assignment.getTeacher().getId();
        }

        return AssignmentResponseDTO.builder()
                .assignmentId(assignment.getId())
                .classroomId(assignment.getClassroom().getId())
                .classroomName(assignment.getClassroom().getSection())
                .subjectId(assignment.getSubject().getId())
                .subjectName(assignment.getSubject().getName())
                .teacherId(teacherId)
                .teacherName(teacherName)
                .mandatory(assignment.isMandatory()) // ✅ IMPORTANT
                .build();
    }

    //toggle the mandatory subject
    public AssignmentResponseDTO updateMandatorySubject(Long assignmentId, boolean mandatory) {
               TeacherAssignment assignment = teacherAssignmentRepository.findById(assignmentId)
                       .orElseThrow(() -> new EntityNotFoundException("Assignment not found with this id"));

               assignment.setMandatory(mandatory);
               teacherAssignmentRepository.save(assignment);

               if(mandatory) {
                   List<Enrollment> enrollments = enrollmentRepository.findByClassroomId(assignment.getClassroom().getId());

                   for(Enrollment e : enrollments) {
                       if(!studentSubjectEnrollmentRepository.existsByStudentAndSubject(
                               e.getStudent(), assignment.getSubject()
                       )) {

                           StudentSubjectEnrollment savedEnrollment = StudentSubjectEnrollment.builder()
                                           .student(e.getStudent())
                                                   .subject(assignment.getSubject())
                                                           .build();
                           studentSubjectEnrollmentRepository.save(
                                   savedEnrollment
                           );
                       }
                   }
               }
        activityLogService.logActivity(
                "Subject " + assignment.getSubject().getName() +
                        " marked as " + (mandatory ? "MANDATORY" : "OPTIONAL"),
                "Assignment Management"
        );
               return mapToResponse(assignment);
    }


    @Transactional
    public List<AssignmentResponseDTO> getAllAssignments() {
           return teacherAssignmentRepository.findAll()
                   .stream()
                   .map(this :: mapToResponse)
                   .toList();
    }
}