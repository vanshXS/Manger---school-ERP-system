package com.vansh.manger.Manger.academicyear.service;

import com.vansh.manger.Manger.academicyear.dto.AcademicYearDTO;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import com.vansh.manger.Manger.common.service.ActivityLogService;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAcademicYearService {

    private final AcademicYearRepository academicYearRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ActivityLogService activityLogService;
    private final EntityManager entityManager;
    private final AdminSchoolConfig adminSchoolConfig;

    // =========================================================================
    // STATE MODEL (important — read this before changing anything):
    //
    //   ACTIVE    → isCurrent=true,  closed=false   Normal school year, records editable
    //   CLOSED    → isCurrent=true,  closed=true    Year locked; promotions can now run
    //   HISTORICAL→ isCurrent=false, closed=true    Past year; read-only
    //
    // WHY closeAcademicYear keeps isCurrent=true:
    //   promoteClass() and getPromotionPreview() must find the "source" year to
    //   know which enrollments to move. They use findByIsCurrentAndSchool_Id(true,…).
    //   If closeAcademicYear() sets isCurrent=false, those queries return nothing
    //   and promotion throws "No current academic year found" — which is the main bug.
    //
    // The year only becomes HISTORICAL (isCurrent=false) when a NEW year is
    // explicitly set as current via setCurrentAcademicYear().
    // =========================================================================

    public AcademicYearDTO mapToResponse(AcademicYear academicYear) {
        return AcademicYearDTO.builder()
                .id(academicYear.getId())
                .name(academicYear.getName())
                .startDate(academicYear.getStartDate())
                .endDate(academicYear.getEndDate())
                .isCurrent(Boolean.TRUE.equals(academicYear.getIsCurrent()))
                .closed(Boolean.TRUE.equals(academicYear.getClosed()))
                .build();
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────
    @Transactional
    public AcademicYearDTO createAcademicYear(AcademicYearDTO dto) {


        if (dto.getStartDate().isAfter(dto.getEndDate()) || dto.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date must be before end date and before the current Date.");
        }



        String name = dto.getName() != null ? dto.getName().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Year name is required.");
        }



        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        if (academicYearRepository.existsBySchool_IdAndName(schoolId, name)) {
            throw new IllegalArgumentException(
                    "An academic year named \"" + name + "\" already exists for this school.");
        }

        AcademicYear newYear = AcademicYear.builder()
                .name(name)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .isCurrent(false)
                .closed(false)
                .school(adminSchoolConfig.requireCurrentSchool())
                .build();

        AcademicYear saved = academicYearRepository.save(newYear);
        log.info("Created academic year: {} (ID: {})", saved.getName(), saved.getId());
        activityLogService.logActivity("Created academic year: " + saved.getName(), "Settings");
        return mapToResponse(saved);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────
    public List<AcademicYearDTO> getAllAcademicYears() {
        return academicYearRepository
                .findBySchool_IdOrderByStartDateDesc(adminSchoolConfig.requireCurrentSchool().getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AcademicYearDTO getCurrentAcademicYear() {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        AcademicYear year = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, schoolId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No current academic year set. Please configure one in settings."));
        return mapToResponse(year);
    }

    public AcademicYearDTO getAcademicYearById(Long yearId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        AcademicYear year = academicYearRepository
                .findByIdAndSchool_Id(yearId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found with ID: " + yearId));
        return mapToResponse(year);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────
    @Transactional
    public AcademicYearDTO updateAcademicYear(Long yearId, AcademicYearDTO dto) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();
        AcademicYear year = academicYearRepository
                .findByIdAndSchool_Id(yearId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found with ID: " + yearId));

        if (Boolean.TRUE.equals(year.getClosed())) {
            throw new IllegalStateException(
                    "Cannot update a closed academic year: " + year.getName());
        }
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before end date.");
        }

        String newName = dto.getName() != null ? dto.getName().trim() : "";
        if (newName.isEmpty()) {
            throw new IllegalArgumentException("Year name is required.");
        }
        if (!year.getName().equals(newName) &&
                academicYearRepository.existsBySchool_IdAndName(schoolId, newName)) {
            throw new IllegalArgumentException(
                    "An academic year named \"" + newName + "\" already exists.");
        }

        String oldName = year.getName();
        year.setName(newName);
        year.setStartDate(dto.getStartDate());
        year.setEndDate(dto.getEndDate());

        AcademicYear saved = academicYearRepository.save(year);
        log.info("Updated academic year: {} → {} (ID: {})", oldName, saved.getName(), saved.getId());
        activityLogService.logActivity("Updated academic year: " + oldName + " → " + saved.getName(), "Settings");
        return mapToResponse(saved);
    }

    // ─── SET CURRENT ─────────────────────────────────────────────────────────

    @Transactional
    public AcademicYearDTO setCurrentAcademicYear(Long yearId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        AcademicYear target = academicYearRepository
                .findByIdAndSchool_Id(yearId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found with ID: " + yearId));

        // Step 1: Bulk-unset isCurrent on every year for this school
        int unsetCount = academicYearRepository.unsetAllCurrentYearsBySchool(schoolId);
        log.debug("Unset isCurrent on {} year(s)", unsetCount);

        // Step 2: Mark ALL other years as closed=true (they become HISTORICAL)
        List<AcademicYear> otherYears = academicYearRepository
                .findBySchool_IdAndIdNot(schoolId, yearId);
        otherYears.forEach(y -> y.setClosed(true));
        if (!otherYears.isEmpty()) {
            academicYearRepository.saveAll(otherYears);
            log.info("Marked {} other year(s) as historical (closed)", otherYears.size());
        }

        // Flush + clear so the reload below sees the latest state
        entityManager.flush();
        entityManager.clear();

        // Step 3: Reload target and activate it
        target = academicYearRepository
                .findByIdAndSchool_Id(yearId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found with ID: " + yearId));

        target.setIsCurrent(true);
        target.setClosed(false); // Reopen if previously closed
        AcademicYear saved = academicYearRepository.saveAndFlush(target);

        // Step 4: Verify
        entityManager.clear();
        AcademicYear verified = academicYearRepository
                .findByIdAndSchool_Id(yearId, schoolId)
                .orElseThrow();

        if (!Boolean.TRUE.equals(verified.getIsCurrent())) {
            throw new RuntimeException("Failed to set academic year as current — please retry.");
        }

        log.info("Active academic year → {} (ID: {})", saved.getName(), saved.getId());
        activityLogService.logActivity("Set current academic year: " + saved.getName(), "Settings");
        return mapToResponse(verified);
    }


    @Transactional
    public void closeAcademicYear() {
        School school = adminSchoolConfig.requireCurrentSchool();

        AcademicYear currentYear = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, school.getId())
                .orElseThrow(() -> new RuntimeException(
                        "No active academic year found to close."));

        // FIX: Only set closed=true — do NOT touch isCurrent
        currentYear.setClosed(true);
        // currentYear.setIsCurrent(false);  ← REMOVED — this was breaking promotion

        academicYearRepository.save(currentYear);
        log.info("Closed academic year: {} (ID: {}) — isCurrent remains true for promotion",
                currentYear.getName(), currentYear.getId());
        activityLogService.logActivity("Closed academic year: " + currentYear.getName(), "Academic Year");
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    @Transactional
    public void deleteAcademicYear(Long yearId) {
        Long schoolId = adminSchoolConfig.requireCurrentSchool().getId();

        AcademicYear year = academicYearRepository
                .findByIdAndSchool_Id(yearId, schoolId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Academic year not found with ID: " + yearId));

        if (Boolean.TRUE.equals(year.getIsCurrent())) {
            throw new IllegalStateException(
                    "Cannot delete the current academic year. Set another year as current first.");
        }

        long enrollmentCount = enrollmentRepository.countByAcademicYear(year);
        if (enrollmentCount > 0) {
            throw new IllegalStateException(
                    "Cannot delete academic year with existing enrollments (" +
                            enrollmentCount + " found). Archive it instead.");
        }

        String yearName = year.getName();
        academicYearRepository.delete(year);
        log.info("Deleted academic year: {} (ID: {})", yearName, yearId);
        activityLogService.logActivity("Deleted academic year: " + yearName, "Settings");
    }
}