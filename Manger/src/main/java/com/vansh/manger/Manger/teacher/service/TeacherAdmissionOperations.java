package com.vansh.manger.Manger.teacher.service;

import java.io.IOException;

import com.vansh.manger.Manger.teacher.dto.TeacherRequestDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;

/**
 * ISP: Operations for creating (admitting) a new teacher.
 * Consumers that only need teacher registration depend on this interface.
 */
public interface TeacherAdmissionOperations {
    TeacherResponseDTO createTeacher(TeacherRequestDTO dto) throws IOException;
}
