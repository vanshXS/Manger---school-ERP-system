package com.vansh.manger.Manger.student.service;


import com.vansh.manger.Manger.student.dto.ClassroomPromotionResultDTO;
import com.vansh.manger.Manger.student.dto.SchoolPromotionResultDTO;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.common.entity.GradeLevel;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;
import com.vansh.manger.Manger.student.service.AdminStudentService;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.student.util.StudentAssignSubjects;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Builder
@Slf4j
public class EnrollmentService{

    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final ClassroomRespository classroomRespository;
    private final AdminSchoolConfig schoolConfig;
    private final StudentAssignSubjects studentAssignSubjects;
    private final AdminStudentService adminStudentService;
    private final ActivityLogService activityLogService;
    private final StudentEnrollmentService studentEnrollmentService;

    public SchoolPromotionResultDTO previewSchoolPromotion() {
        School       school      = schoolConfig.requireCurrentSchool();
        AcademicYear currentYear = requireClosedCurrentYear(school);
        AcademicYear nextYear    = requireNextYear(currentYear, school);

        List<Classroom> classrooms = classroomRespository
                .findBySchoolOrderByGradeLevelAsc(school);

        List<ClassroomPromotionResultDTO> previews = classrooms.stream()
                .map(c -> buildPreview(c, currentYear, nextYear, school))
                .collect(Collectors.toList());

        return buildSummary(previews, currentYear, nextYear, false);
    }

    @Transactional
    public SchoolPromotionResultDTO runSchoolPromotion() {

        School school = schoolConfig.requireCurrentSchool();
        AcademicYear currentYear = requireClosedCurrentYear(school);
        AcademicYear nextYear = requireNextYear(currentYear, school);

        List<Classroom> classrooms = classroomRespository
                .findBySchoolOrderByGradeLevelAsc(school);

        if(classrooms.isEmpty()) {
            throw new RuntimeException("No classroom found. Create classrooms first.");
        }

        List<ClassroomPromotionResultDTO> results = classrooms.stream()
                .map(c -> promoteClassroom(c, currentYear, nextYear, school))
                .toList();

        SchoolPromotionResultDTO summary = buildSummary(results, currentYear, nextYear, true);

        activityLogService.logActivity(String.format(
                "Year-end promotion complete: %d promoted, %d graduated, %d detained, %d skipped. (%s → %s)",
                summary.getTotalPromoted(), summary.getTotalGraduated(),
                summary.getTotalDetained(), summary.getTotalSkipped(),
                currentYear.getName(), nextYear.getName()), "Year-End Promotion");

        log.info("[Promotion] ══ DONE promoted={} graduated={} detained={} skipped={} ══",
                summary.getTotalPromoted(), summary.getTotalGraduated(),
                summary.getTotalDetained(), summary.getTotalSkipped());

        return summary;


    }


    //Core: process a single classroom
    private ClassroomPromotionResultDTO promoteClassroom(
            Classroom classroom, AcademicYear currentYear,
            AcademicYear nextYear, School school
    ){

        String fromLabel = label(classroom);
        boolean isTerminal = isTerminal(classroom);

        List<Enrollment> enrollments = enrollmentRepository
                .findByClassroomAndAcademicYear(classroom, currentYear);

        if(enrollments.isEmpty()) {
            log.info("[Promotion] {} -empty", fromLabel);
            return emptyResult(fromLabel);
        }

        if(isTerminal) {
             return graduateClassroom(classroom,enrollments, currentYear, school, fromLabel);
        }

        Classroom targetClassroom = resolveTarget(classroom, school);
        if(targetClassroom == null) {
            return noTargetResult(fromLabel, enrollments.size());
        }

        String toLabel = label(targetClassroom);
        int promoted = 0, detained = 0, skipped = 0, alreadyDone = 0;

        for(Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();

            if(enrollmentRepository.existsByAcademicYearAndStudent(nextYear, student)){
                alreadyDone++;
                continue;
            }

            StudentStatus status = enrollment.getStatus();

            if(status == StudentStatus.DROPPED_OUT || status == StudentStatus.SUSPENDED){
                detained++;
                continue;
            }

            if(status == StudentStatus.ACTIVE || status == StudentStatus.INACTIVE) {
                enrollment.setStatus(StudentStatus.PROMOTED);
                enrollmentRepository.save(enrollment);

                Enrollment newEnrollment = Enrollment.builder()
                        .student(student)
                        .classroom(targetClassroom)
                        .academicYear(nextYear)
                        .rollNo(studentEnrollmentService.generateNextRollNoForClass(targetClassroom, nextYear))
                        .school(school)
                        .build();
                enrollmentRepository.save(newEnrollment);

                studentAssignSubjects.autoAssignMandatorySubjects(student, targetClassroom);
                promoted++;

                continue;
            }

            skipped++;
        }
        log.info("[Promotion] {} → {} promoted={} detained={} skipped={} alreadyDone={}",
                fromLabel, toLabel, promoted, detained, skipped, alreadyDone);

        return ClassroomPromotionResultDTO.builder()
                .fromClassroom(fromLabel).toClassroom(toLabel)
                .promoted(promoted).graduated(0).detained(detained)
                .skipped(skipped).alreadyDone(alreadyDone)
                .status(ClassroomPromotionResultDTO.Status.SUCCESS)
                .note(promoted + " promoted, " + detained + " detained, " + skipped + " skipped")
                .build();


    }

    private ClassroomPromotionResultDTO graduateClassroom(Classroom classroom, List<Enrollment> enrollments, AcademicYear currentYear, School school, String fromLabel) {
        int graduated = 0, skipped = 0, alreadyDone = 0;

        for(Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();

            if(student.getGraduationYear() != null) {
                alreadyDone++;
                continue;
            }
            StudentStatus status = enrollment.getStatus();

             if(status == StudentStatus.DROPPED_OUT || status == StudentStatus.SUSPENDED) {
                 skipped++;
                 continue;
             }

             if(status == StudentStatus.ACTIVE || status == StudentStatus.INACTIVE) {
                 enrollment.setStatus(StudentStatus.GRADUATED);
                 enrollmentRepository.save(enrollment);
                 student.setGraduationYear(currentYear.getEndDate().getYear());

                 graduated++;
                 log.info("[Promotion] GRADUATED student={} year={}",
                         student.getId(), currentYear.getEndDate().getYear());
                 continue;
             }
             skipped++;

        }
        log.info("[Promotion] {} GRADUATION graduated={} skipped={} alreadyDone={}",
                fromLabel, graduated, skipped, alreadyDone);

        return ClassroomPromotionResultDTO.builder()
                .fromClassroom(fromLabel).toClassroom("Graduated — Left School")
                .promoted(0).graduated(graduated).detained(0)
                .skipped(skipped).alreadyDone(alreadyDone)
                .status(ClassroomPromotionResultDTO.Status.GRADUATED)
                .note(graduated + " students graduated")
                .build();
    }

    private ClassroomPromotionResultDTO buildPreview(
            Classroom classroom, AcademicYear currentYear,
            AcademicYear nextYear, School  school
    ) {

        String fromLabel = label(classroom);
        boolean isTerminal = isTerminal(classroom);

        List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndAcademicYear(classroom, currentYear);

        //if student at the end of the classroom
        if(isTerminal) {
            long willGraduate = enrollments.stream()
                    .filter(e -> e.getStudent().getGraduationYear() == null)
                    .filter(e -> e.getStatus() == StudentStatus.ACTIVE || e.getStatus() == StudentStatus.INACTIVE)
                    .count();

            return ClassroomPromotionResultDTO.builder()
                    .fromClassroom(fromLabel).toClassroom("Graduated")
                    .promoted(0).graduated((int) willGraduate).alreadyDone(0)
                    .status(ClassroomPromotionResultDTO.Status.GRADUATED)
                    .note(willGraduate + " will graduated").build();

        }
        Classroom targetClassroom = resolveTarget(classroom, school);

        if(targetClassroom == null) {
            return ClassroomPromotionResultDTO.builder()
                    .fromClassroom(fromLabel).toClassroom("NOT FOUND")
                    .promoted(0).graduated(0).detained(0).skipped(enrollments.size()).alreadyDone(0)
                    .status(ClassroomPromotionResultDTO.Status.NO_TARGET)
                    .note("Target classroom not found. Creaet it and re-run.").build();
        }
        int willPromote = 0, willSkip = 0, alreadyDone = 0, willDetained = 0;


        for(Enrollment enrollment : enrollments) {
            if(enrollmentRepository.existsByAcademicYearAndStudent(nextYear, enrollment.getStudent())) {
                alreadyDone++;
                continue;
            }

            StudentStatus status = enrollment.getStatus();
            if(status == StudentStatus.ACTIVE || status == StudentStatus.INACTIVE) {willPromote++; continue;}
            if(status == StudentStatus.SUSPENDED || status == StudentStatus.DROPPED_OUT) {willDetained++; continue;}
            if(status == StudentStatus.GRADUATED) alreadyDone++; continue;


        }

        return ClassroomPromotionResultDTO.builder()
                .fromClassroom(fromLabel).toClassroom(label(targetClassroom))
                .promoted(willPromote).graduated(0)
                .skipped(willSkip).alreadyDone(alreadyDone).detained(willDetained)
                .status(ClassroomPromotionResultDTO.Status.SUCCESS)
                .note(willPromote + " will be promoted, " + willDetained + " detained")
                .build();



    }


    private String label(Classroom c) {
        return c.getGradeLevel().getDisplayName() + "-" + c.getSection();
    }

    private boolean isTerminal(Classroom c) {
        return c.getGradeLevel().next() == null && c.getPromotesToClassroom() == null;
    }
    private Classroom resolveTarget(Classroom from, School school) {
       if(from.getPromotesToClassroom() != null) return from.getPromotesToClassroom();

       GradeLevel next = from.getGradeLevel().next();

       if(next == null) return null;

       return classroomRespository.findByGradeLevelAndSectionAndSchool(next, from.getSection(), school)
               .orElse(null);
    }
    private ClassroomPromotionResultDTO noTargetResult(String fromLabel, int studentCount) {
        return ClassroomPromotionResultDTO.builder()
                .fromClassroom(fromLabel).toClassroom("NOT FOUND")
                .promoted(0).graduated(0).detained(0).skipped(studentCount).alreadyDone(0)
                .status(ClassroomPromotionResultDTO.Status.NO_TARGET)
                .note("Target classroom not found. Create it and re-run.").build();
    }
    private ClassroomPromotionResultDTO emptyResult(String fromLabel) {
        return ClassroomPromotionResultDTO.builder()
                .fromClassroom(fromLabel).toClassroom("—")
                .promoted(0).graduated(0).detained(0).skipped(0).alreadyDone(0)
                .status(ClassroomPromotionResultDTO.Status.EMPTY)
                .note("No students enrolled").build();
    }

    private AcademicYear requireClosedCurrentYear(School school) {
        AcademicYear year = academicYearRepository
                .findByIsCurrentAndSchool_Id(true, school.getId())
                .orElseThrow(() -> new RuntimeException(
                        "No current academic year set. Go to Academic Years and set one as current."));
        if (!Boolean.TRUE.equals(year.getClosed())) {
            throw new RuntimeException(
                    "'" + year.getName() + "' must be CLOSED before running promotion. " +
                            "Go to Academic Years → Close This Year first.");
        }
        return year;
    }

    private SchoolPromotionResultDTO buildSummary(
            List<ClassroomPromotionResultDTO> results,
            AcademicYear currentYear, AcademicYear nextYear, boolean executed) {

        return SchoolPromotionResultDTO.builder()
                .currentYear(currentYear.getName())
                .nextYear(nextYear.getName())
                .executed(executed)
                .totalClassrooms(results.size())
                .classroomResults(results)
                .totalPromoted(results.stream().mapToInt(ClassroomPromotionResultDTO::getPromoted).sum())
                .totalGraduated(results.stream().mapToInt(ClassroomPromotionResultDTO::getGraduated).sum())
                .totalDetained(results.stream().mapToInt(ClassroomPromotionResultDTO::getDetained).sum())
                .totalSkipped(results.stream().mapToInt(ClassroomPromotionResultDTO::getSkipped).sum())
                .totalAlreadyDone(results.stream().mapToInt(ClassroomPromotionResultDTO::getAlreadyDone).sum())
                .failedClassrooms((int) results.stream()
                        .filter(r -> r.getStatus() == ClassroomPromotionResultDTO.Status.NO_TARGET)
                        .count())
                .readyToPromote(results.stream()
                        .noneMatch(r -> r.getStatus() == ClassroomPromotionResultDTO.Status.NO_TARGET))
                .build();
    }

    private AcademicYear requireNextYear(AcademicYear current, School school) {
        return academicYearRepository
                .findNextAcademicYear(current.getEndDate(), school.getId())
                .orElseThrow(() -> new RuntimeException(
                        "Next academic year not found. Create the next year in Academic Years first."));
    }

}
