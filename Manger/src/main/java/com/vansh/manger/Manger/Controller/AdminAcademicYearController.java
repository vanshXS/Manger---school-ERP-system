package com.vansh.manger.Manger.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vansh.manger.Manger.DTO.AcademicYearDTO;
import com.vansh.manger.Manger.Service.AdminAcademicYearService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST Controller for Academic Year Management
 * Handles CRUD operations and academic year lifecycle management
 */
@RestController
@RequestMapping("/api/admin/academic-years")
@RequiredArgsConstructor
public class AdminAcademicYearController {

    private final AdminAcademicYearService academicYearService;

    /**
     * Creates a new Academic Year (e.g., "2024-2025")
     *
     * @param dto AcademicYearDTO containing name, startDate, and endDate
     * @return Created academic year
     */
    @PostMapping
    public ResponseEntity<AcademicYearDTO> createAcademicYear(@Valid @RequestBody AcademicYearDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicYearService.createAcademicYear(dto));
    }

    /**
     * Gets a list of all academic years for the current school
     * Ordered by start date (most recent first)
     *
     * @return List of all academic years
     */
    @GetMapping
    public ResponseEntity<List<AcademicYearDTO>> getAllAcademicYears() {
        return ResponseEntity.ok(academicYearService.getAllAcademicYears());
    }

    /**
     * Gets the current active academic year
     *
     * @return Current academic year
     */
    @GetMapping("/current")
    public ResponseEntity<AcademicYearDTO> getCurrentAcademicYear() {
        return ResponseEntity.ok(academicYearService.getCurrentAcademicYear());
    }

    /**
     * Gets a specific academic year by ID
     *
     * @param yearId Academic year ID
     * @return Academic year details
     */
    @GetMapping("/{yearId:\\d+}")
    public ResponseEntity<AcademicYearDTO> getAcademicYearById(@PathVariable Long yearId) {
        return ResponseEntity.ok(academicYearService.getAcademicYearById(yearId));
    }

    /**
     * Updates an existing academic year
     * Cannot update a closed academic year
     *
     * @param yearId Academic year ID to update
     * @param dto    Updated academic year data
     * @return Updated academic year
     */
    @PutMapping("/{yearId:\\d+}")
    public ResponseEntity<AcademicYearDTO> updateAcademicYear(
            @PathVariable Long yearId,
            @Valid @RequestBody AcademicYearDTO dto) {
        return ResponseEntity.ok(academicYearService.updateAcademicYear(yearId, dto));
    }

    /**
     * Sets a specific academic year as the "current" one
     * Automatically unsets any previously current year
     *
     * @param yearId Academic year ID to set as current
     * @return Updated academic year
     */
    @PutMapping("/{yearId:\\d+}/set-current")
    public ResponseEntity<AcademicYearDTO> setCurrentAcademicYear(@PathVariable Long yearId) {
        return ResponseEntity.ok(academicYearService.setCurrentAcademicYear(yearId));
    }

    /**
     * Closes the current academic year (sets closed=true, isCurrent=false)
     * Required before promoting students from that year to the next
     *
     * @return Success response
     */
    @PostMapping("/close-current")
    public ResponseEntity<Void> closeCurrentAcademicYear() {
        academicYearService.closeAcademicYear();
        return ResponseEntity.ok().build();
    }

    /**
     * Deletes an academic year
     * Cannot delete current year or year with existing enrollments
     *
     * @param yearId Academic year ID to delete
     * @return Success response
     */
    @DeleteMapping("/{yearId:\\d+}")
    public ResponseEntity<Void> deleteAcademicYear(@PathVariable Long yearId) {
        academicYearService.deleteAcademicYear(yearId);
        return ResponseEntity.noContent().build();
    }

}