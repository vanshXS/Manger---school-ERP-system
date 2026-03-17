package com.vansh.manger.Manger.teacher.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vansh.manger.Manger.teacher.dto.TeacherRequestDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.teacher.service.AdminTeacherService;
import com.vansh.manger.Manger.common.service.PDFService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/teachers")
@RequiredArgsConstructor
public class AdminTeacherController {

        private final AdminTeacherService adminTeacherService;
        private final PDFService pdfService;

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<TeacherResponseDTO> createTeacher(
                        @Valid @ModelAttribute TeacherRequestDTO teacherRequestDTO,
                        @RequestParam(value = "profilePicture", required = false) MultipartFile profilePic) {

                teacherRequestDTO.setProfilePicture(profilePic);
                TeacherResponseDTO teacher = adminTeacherService.createTeacher(teacherRequestDTO);

                return new ResponseEntity<>(teacher, HttpStatus.CREATED);
        }

        @GetMapping
        public ResponseEntity<Page<TeacherResponseDTO>> getTeachers(
                        @RequestParam(required = false) Boolean active,
                        @RequestParam(required = false) String search,
                        @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

                return ResponseEntity.ok(
                                adminTeacherService.getTeacherPage(active, search, pageable));
        }

        @GetMapping("/{teacherId:\\d+}")
        public ResponseEntity<?> getTeacherById(@PathVariable Long teacherId) {

                return ResponseEntity.ok(adminTeacherService.getTeacherById(teacherId));
        }

        @PatchMapping("/{teacherId}/status")
        public ResponseEntity<Void> toggleActiveState(
                        @PathVariable Long teacherId,
                        @RequestParam boolean active) {

                adminTeacherService.toggleStatus(teacherId, active);
                return ResponseEntity.ok().build();
        }

        @PutMapping(value = "/{teacherId:\\d+}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<TeacherResponseDTO> updateTeacher(@PathVariable Long teacherId,
                        @Valid @ModelAttribute TeacherRequestDTO teacherRequestDTO) {

                return new ResponseEntity<>(adminTeacherService.updateTeacher(teacherId, teacherRequestDTO),
                                HttpStatus.OK);
        }

        @DeleteMapping("/{teacherId:\\d+}")
        public ResponseEntity<?> deleteTeacher(@PathVariable Long teacherId) {
                adminTeacherService.delete(teacherId);

                return ResponseEntity.ok("Deleted");
        }

        @GetMapping("/{teacherId:\\d+}/slip")
        public ResponseEntity<byte[]> generateTeacherSlip(@PathVariable Long teacherId) {
                TeacherResponseDTO teacher = adminTeacherService.getTeacherById(teacherId);
                byte[] pdfBytes = pdfService.generateTeacherSlip(teacher);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" +
                                                teacher.getFirstName() + "_" + teacher.getLastName() + "_slip.pdf")
                                .contentType(MediaType.APPLICATION_PDF)
                                .body(pdfBytes);
        }

}
