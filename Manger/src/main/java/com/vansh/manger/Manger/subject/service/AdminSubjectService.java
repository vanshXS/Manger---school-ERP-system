package com.vansh.manger.Manger.subject.service;

import com.vansh.manger.Manger.subject.dto.SubjectAssignmentDetailDTO;
import com.vansh.manger.Manger.subject.dto.SubjectRequestDTO;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherRespository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSubjectService {

    private final SubjectRepository subjectRepository;
    private final ClassroomRespository classroomRespository;
    private final TeacherRespository teacherRespository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final ActivityLogService activityLogService;
    private final AdminSchoolConfig adminSchoolConfig;

    //helper method to map entity to dto
    public SubjectResponseDTO mapToResponse(Subject subject) {
        long count = teacherAssignmentRepository.countBySubject(subject);

        List<TeacherAssignment> assignments = teacherAssignmentRepository.findBySubject(subject);

        List<SubjectAssignmentDetailDTO> assignmentDetails = assignments.stream()
                .map(a -> {
                    String teacherName = (a.getTeacher() != null)
                            ? a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName()
                            : "Unassigned";
                    String classroomName = (a.getClassroom() != null)
                            ? a.getClassroom().getGradeLevel().getDisplayName() + " - "
                                    + a.getClassroom().getSection().toUpperCase()
                            : "N/A";
                    return new SubjectAssignmentDetailDTO(classroomName, teacherName);
                }).toList();

        return SubjectResponseDTO.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .assignmentCount(count)
                .subjectAssignmentDetailDTOS(assignmentDetails)
                .build();
    }

    @Transactional
      public SubjectResponseDTO createSubject(SubjectRequestDTO dto) {
        String normalizedName = normalizeSubjectName(dto.getName());
        String normalizedCode = normalizeSubjectCode(dto.getCode());
        
        if(subjectRepository.existsByCodeIgnoreCaseAndSchool_Id(normalizedCode, adminSchoolConfig.requireCurrentSchool().getId())) {
            throw new IllegalArgumentException("Subject code already exists: " + normalizedCode);
        }

        Subject subject = Subject.builder()
                .name(normalizedName)
                .code(normalizedCode)
                .school(adminSchoolConfig.requireCurrentSchool())
                .build();


        Subject savedSubject = subjectRepository.save(subject);
        activityLogService.logActivity("Created new subject: " + savedSubject.getName(), "Subject Management");
        //map to response dto
        return mapToResponse(savedSubject);
    }

      public List<SubjectResponseDTO> getAllSubjects() {
        return subjectRepository.findBySchool_Id(adminSchoolConfig.requireCurrentSchool().getId())
                .stream()
                .map(this :: mapToResponse)
                .collect(Collectors.toList());
      }


    @Transactional
    public void deleteSubject(Long subjectId) {

        Subject subject = subjectRepository.findByIdAndSchool_Id(subjectId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Subject not found with id in the school: " + subjectId));

        // --- BUSINESS LOGIC CHECK ---
        if (teacherAssignmentRepository.existsBySubject(subject)) {
            throw new IllegalStateException("Cannot delete subject: It is currently assigned to one or more classrooms/teachers. Please remove assignments first.");
        }

        subjectRepository.delete(subject);
        activityLogService.logActivity("Deleted subject: " + subject.getName(), "Subject Management");
    }


    @Transactional
    public SubjectResponseDTO updateSubject(Long subjectId, SubjectRequestDTO dto) {
        String normalizedName = normalizeSubjectName(dto.getName());
        String normalizedCode = normalizeSubjectCode(dto.getCode());


        Subject existingSubject = subjectRepository.findByIdAndSchool_Id(subjectId, adminSchoolConfig.requireCurrentSchool().getId())
                .orElseThrow(() -> new EntityNotFoundException("Subject not found with id: " + subjectId));

        if (!existingSubject.getCode().equalsIgnoreCase(normalizedCode) && subjectRepository.existsByCodeIgnoreCaseAndSchool_Id(normalizedCode, adminSchoolConfig.requireCurrentSchool().getId())) {
            throw new IllegalArgumentException("Another subject with this code already exists: " + normalizedCode);
        }

        // Update only the allowed fields
        existingSubject.setName(normalizedName);
        existingSubject.setCode(normalizedCode);


        Subject updatedSubject = subjectRepository.save(existingSubject);
        activityLogService.logActivity("Updated subject: " + updatedSubject.getName(), "Subject Management");
        return mapToResponse(updatedSubject); // Return DTO with updated count
    }

  @Transactional
    public List<SubjectResponseDTO> subjectsByClassroomId(Long classroomId) {
        classroomRespository.findByIdAndSchool(classroomId, adminSchoolConfig.requireCurrentSchool())
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

        return teacherAssignmentRepository.findByClassroomId(classroomId)
                .stream()
                .map(assignment -> {
                    Subject subject = assignment.getSubject();

                    return new SubjectResponseDTO(subject.getId(), subject.getName(), subject.getCode());
                }).toList();
  }

    private String normalizeSubjectName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Subject name is required.");
        }
        return name.trim();
    }

    private String normalizeSubjectCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Subject code is required.");
        }
        return code.trim().toUpperCase();
    }

}
