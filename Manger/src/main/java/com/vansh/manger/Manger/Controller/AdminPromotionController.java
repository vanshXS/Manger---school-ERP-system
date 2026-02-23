package com.vansh.manger.Manger.Controller;


import com.vansh.manger.Manger.DTO.SchoolPromotionResultDTO;
import com.vansh.manger.Manger.Service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
public class AdminPromotionController {

    private final EnrollmentService enrollmentService;

    @GetMapping("/preview")
    public ResponseEntity<SchoolPromotionResultDTO> preview() {
        return ResponseEntity.ok(enrollmentService.previewSchoolPromotion());
    }

    @PostMapping("/run")
    public ResponseEntity<SchoolPromotionResultDTO> run() {
        return ResponseEntity.ok(enrollmentService.runSchoolPromotion());
    }
}
