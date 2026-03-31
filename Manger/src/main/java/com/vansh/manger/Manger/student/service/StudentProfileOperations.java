package com.vansh.manger.Manger.student.service;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.student.entity.StudentStatus;

/**
 * Defines the contract for student profile CRUD operations.
 *
 * <p><b>ISP</b> — segregated interface: only profile read/write concerns.
 * <b>DIP</b> — consumers depend on this abstraction.</p>
 */
public interface StudentProfileOperations {

    StudentResponseDTO getStudentById(Long studentId);

    Page<StudentResponseDTO> getAllStudents(StudentStatus status, String search, Pageable pageable);

    StudentResponseDTO updateStudent(Long studentId, StudentRequestDTO studentRequestDTO) throws IOException;

    void deleteById(Long studentId);

    List<StudentResponseDTO> getStudentsByClassroom(Long classroomId);
}
