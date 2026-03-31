package com.vansh.manger.Manger.teacher.service;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vansh.manger.Manger.teacher.dto.TeacherRequestDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;

/**
 * ISP: Operations for querying and updating existing teacher profiles.
 * Consumers that only need CRUD depend on this interface.
 */
public interface TeacherProfileOperations {
    TeacherResponseDTO updateTeacher(Long teacherId, TeacherRequestDTO dto) throws IOException;
    TeacherResponseDTO getTeacherById(Long teacherId);
    Page<TeacherResponseDTO> getTeacherPage(Boolean active, String search, Pageable pageable);
}
