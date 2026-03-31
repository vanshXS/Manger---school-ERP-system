package com.vansh.manger.Manger.student.service;

import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.repository.StudentRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StudentValidator {

    private final AdminSchoolConfig schoolConfig;
    private final StudentRepository studentRepository;
    private final ClassroomRespository classroomRespository;
    private final AcademicYearRepository academicYearRepository;

    public void validate(StudentRequestDTO dto) {

        if (studentRepository.existsByEmailAndSchool_Id(dto.getEmail().toLowerCase(), schoolConfig.requireCurrentSchoolId())) {
            throw new IllegalArgumentException("Student with email " + dto.getEmail() + " already exists in the school");
        }

        if (classroomRespository.findByIdAndSchool(dto.getClassroomId(), schoolConfig.requireCurrentSchool()).isEmpty()) {
            throw new EntityNotFoundException("Classroom not found in this school: " + schoolConfig.requireCurrentSchool().getName());
        }

        if (academicYearRepository.findByIsCurrentAndSchool_Id(true, schoolConfig.requireCurrentSchoolId()).isEmpty()) {
            throw new EntityNotFoundException("Academic year not found in this school: " + schoolConfig.requireCurrentSchool().getName());
        }

    }
}
