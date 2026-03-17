package com.vansh.manger.Manger.student.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.vansh.manger.Manger.attendance.dto.AttendanceSummaryDTO;
import com.vansh.manger.Manger.attendance.entity.Attendance;
import com.vansh.manger.Manger.attendance.entity.AttendanceStatus;
import com.vansh.manger.Manger.attendance.repository.AttendanceRepository;
import com.vansh.manger.Manger.common.service.ActivityLogService;
import com.vansh.manger.Manger.common.service.EmailService;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.exam.dto.StudentExamResultDTO;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vansh.manger.Manger.common.config.RandomPasswordGenerator;
import com.vansh.manger.Manger.classroom.dto.ClassroomResponseDTO;
import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.subject.dto.SubjectResponseDTO;
import com.vansh.manger.Manger.academicyear.entity.AcademicYear;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.student.entity.Enrollment;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.student.entity.StudentStatus;
import com.vansh.manger.Manger.student.entity.StudentSubjectEnrollment;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.teacher.entity.TeacherAssignment;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.academicyear.repository.AcademicYearRepository;
import com.vansh.manger.Manger.classroom.repository.ClassroomRespository;
import com.vansh.manger.Manger.student.repository.EnrollmentRepository;
import com.vansh.manger.Manger.student.repository.StudentRepository;
import com.vansh.manger.Manger.student.repository.StudentSubjectEnrollmentRepository;
import com.vansh.manger.Manger.exam.repository.StudentSubjectMarksRepository;
import com.vansh.manger.Manger.subject.repository.SubjectRepository;
import com.vansh.manger.Manger.teacher.repository.TeacherAssignmentRepository;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.student.specification.StudentSpecification;
import com.vansh.manger.Manger.common.util.AdminSchoolConfig;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminStudentService {

        // --- All Repositories ---
        private final StudentRepository studentRepository;
        private final ClassroomRespository classroomRespository;
        private final SubjectRepository subjectRepository;
        private final StudentSubjectMarksRepository studentSubjectsRepository;
        private final AcademicYearRepository academicYearRepository;
        private final EnrollmentRepository enrollmentRepository;
        private final AttendanceRepository attendanceRepository;
        private final UserRepo userRepo;
        private final AdminSchoolConfig getCurrentSchool;
        private final StudentSubjectEnrollmentRepository studentSubjectEnrollmentRepository;

        // --- Other Services & Components ---
        private final PasswordEncoder passwordEncoder;
        private final ActivityLogService activityLogService;
        private final EmailService emailService;
        private final FileStorageService fileStorageService;

        private final RandomPasswordGenerator randomPasswordGenerator = new RandomPasswordGenerator();

        private static final String UPLOAD_DIR = System.getProperty("user.home") + "/manger/uploads/students/";
        private final TeacherAssignmentRepository teacherAssignmentRepository;

        /**
         * This is the "Admission" process.
         * It creates a Student, a User, and their first Enrollment record.
         */
        @Transactional
        public StudentResponseDTO createStudent(StudentRequestDTO studentRequestDTO) throws IOException {

                School school = getCurrentSchool.requireCurrentSchool();
                // 1. Validation
                if (studentRepository.existsByEmailAndSchool_Id(studentRequestDTO.getEmail(), school.getId())) {
                        throw new IllegalArgumentException("Student with this email already registered");
                }

                Classroom classroom = classroomRespository.findByIdAndSchool(studentRequestDTO.getClassroomId(), school)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Classroom not found in this school: " + school.getName()));

                AcademicYear currentYear = academicYearRepository
                                .findByIsCurrentAndSchool_Id(true, getCurrentSchool.requireCurrentSchool().getId())
                                .orElseThrow(() -> new IllegalStateException(
                                                "No active academic year is set! Cannot enroll student."));

                // 2. File Upload
                String pictureUrl = null;
                if (studentRequestDTO.getProfilePicture() != null && !studentRequestDTO.getProfilePicture().isEmpty()) {

                        // Use email prefix for a unique filename, as rollNo isn't generated yet
                        pictureUrl = fileStorageService.saveStudentProfile(
                                        studentRequestDTO.getProfilePicture(),
                                        studentRequestDTO.getEmail().split("@")[0]);

                }

                // 3. Password & User Creation
                String rawPassword = randomPasswordGenerator.generateRandomPassword();
                String encodedPassword = passwordEncoder.encode(rawPassword);

                User studentUser = User.builder()
                                .fullName(studentRequestDTO.getFirstName() + " " + studentRequestDTO.getLastName())
                                .email(studentRequestDTO.getEmail())
                                .password(encodedPassword)
                                .roles(Roles.STUDENT)
                                .school(school)
                                .build();

                // this fix the avatar not showing in frontend
                String imageUrl = pictureUrl;

                // 4. Student Entity Creation
                Student student = Student.builder()
                                .firstName(studentRequestDTO.getFirstName())
                                .lastName(studentRequestDTO.getLastName())
                                .user(studentUser)
                                .school(school)
                                .email(studentRequestDTO.getEmail())
                                .password(encodedPassword)
                                .phoneNumber(studentRequestDTO.getPhoneNumber())
                                .admissionNo(studentRequestDTO.getAdmissionNo())
                                .profilePictureUrl(imageUrl)
                                .fatherName(studentRequestDTO.getFatherName())
                                .motherName(studentRequestDTO.getMotherName())
                                .guardianName(studentRequestDTO.getGuardianName())
                                .parentPhonePrimary(studentRequestDTO.getParentPhonePrimary())
                                .parentPhoneSecondary(studentRequestDTO.getParentPhoneSecondary())
                                .parentEmail(studentRequestDTO.getParentEmail())
                                .parentOccupation(studentRequestDTO.getParentOccupation())
                                .annualIncome(studentRequestDTO.getAnnualIncome())
                                .fullAddress(studentRequestDTO.getFullAddress())
                                .city(studentRequestDTO.getCity())
                                .state(studentRequestDTO.getState())
                                .pincode(studentRequestDTO.getPincode())
                                .medicalConditions(studentRequestDTO.getMedicalConditions())
                                .allergies(studentRequestDTO.getAllergies())
                                .emergencyContactName(studentRequestDTO.getEmergencyContactName())
                                .emergencyContactNumber(studentRequestDTO.getEmergencyContactNumber())
                                .previousSchoolName(studentRequestDTO.getPreviousSchoolName())
                                .previousClass(studentRequestDTO.getPreviousClass())
                                .admissionDate(studentRequestDTO.getAdmissionDate())
                                .transportRequired(studentRequestDTO.getTransportRequired())
                                .hostelRequired(studentRequestDTO.getHostelRequired())
                                .feeCategory(studentRequestDTO.getFeeCategory())
                                .gender(studentRequestDTO.getGender())
                                .build();

                Student savedStudent = studentRepository.save(student);

                // 5. Auto-Generated Roll Number
                String newRollNo = generateNextRollNoForClass(classroom, currentYear);
                autoAssignMandatorySubjects(savedStudent, classroom);

                // 6. Create the Enrollment Record
                Enrollment firstEnrollment = Enrollment.builder()
                                .student(savedStudent)
                                .classroom(classroom)
                                .academicYear(currentYear)
                                .status(StudentStatus.ACTIVE)
                                .rollNo(newRollNo)
                                .school(school)
                                .build();

                enrollmentRepository.save(firstEnrollment);

                // 7. Send Welcome Email
                try {
                        emailService.sendNewUserWelcomeEmail(savedStudent.getEmail(), savedStudent.getFirstName(),
                                        rawPassword);
                        activityLogService.logActivity(
                                        "New student enrolled: " + savedStudent.getFirstName() + " (" + newRollNo
                                                        + "). Welcome email sent.",
                                        "Student Enrollment");
                } catch (Exception e) {
                        // Log the error but don't fail the transaction
                        System.err.println("CRITICAL: Failed to send welcome email for student " + savedStudent.getId()
                                        + ": " + e.getMessage());
                        activityLogService.logActivity(
                                        "New student enrolled: " + savedStudent.getFirstName()
                                                        + ". FAILED TO SEND EMAIL.",
                                        "Student Enrollment (Error)");
                }

                // 8. Map to Response DTO
                StudentResponseDTO responseDTO = mapToStudentResponseDTO(savedStudent, firstEnrollment);

                // --- SECURITY ---
                // Only set the raw password on this *one-time* response DTO for the admin
                responseDTO.setPassword(rawPassword);
                return responseDTO;
        }

        /**
         * Gets a paginated list of all students *and their current* enrollment details.
         */
        @Transactional
        public Page<StudentResponseDTO> getAllStudents(StudentStatus status, String search, Pageable pageable) {
                School school = getCurrentSchool.requireCurrentSchool();

                Specification<Student> spec = StudentSpecification.build(status, search, school.getId());

                Page<Student> page = studentRepository.findAll(spec, pageable);

                return page.map(student -> {
                        Enrollment currentEnrollment = enrollmentRepository
                                        .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                        getCurrentSchool.requireCurrentSchool().getId(), true)
                                        .orElse(null);
                        return mapToStudentResponseDTO(student, currentEnrollment);
                });
        }

        /**
         * Gets a single student by their permanent ID, including their current
         * enrollment.
         */
        @Transactional
        public StudentResponseDTO getStudentById(Long studentId) {

                School school = getCurrentSchool.requireCurrentSchool();

                Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                Enrollment currentEnrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                getCurrentSchool.requireCurrentSchool().getId(), true)
                                .orElse(null);

                return mapToStudentResponseDTO(student, currentEnrollment);
        }

        @Transactional
        public Page<StudentExamResultDTO> getStudentExamResults(Long studentId, Pageable pageable) {
                School school = getCurrentSchool.requireCurrentSchool();

                Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                List<StudentSubjectMarks> allMarks = studentSubjectsRepository.findByEnrollment_StudentId(student.getId());

                Map<Long, List<StudentSubjectMarks>> marksByExam = allMarks.stream()
                                .filter(mark -> mark.getExam() != null)
                                .collect(Collectors.groupingBy(mark -> mark.getExam().getId()));

                List<StudentExamResultDTO> allResults = marksByExam.values().stream()
                                .map(marks -> mapToStudentExamResult(marks.get(0).getExam(), marks))
                                .sorted((a, b) -> b.getExamId().compareTo(a.getExamId()))
                                .toList();

                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), allResults.size());
                List<StudentExamResultDTO> pagedList = start >= allResults.size()
                                ? new ArrayList<>()
                                : allResults.subList(start, end);

                return new PageImpl<>(pagedList, pageable, allResults.size());
        }

        @Transactional
        public AttendanceSummaryDTO getStudentAttendanceSummary(Long studentId) {
                School school = getCurrentSchool.requireCurrentSchool();

                Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                Enrollment currentEnrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student, school.getId(), true)
                                .orElseThrow(() -> new EntityNotFoundException("Student has no current enrollment"));

                AcademicYear currentYear = academicYearRepository.findByIsCurrentAndSchool_Id(true, school.getId())
                                .orElseThrow(() -> new IllegalStateException("No active academic year"));

                List<Attendance> attendances = attendanceRepository.findByEnrollmentAndAcademicYear(currentEnrollment,
                                currentYear);

                int totalWorkingDays = attendances.size();
                int daysPresent = (int) attendances.stream()
                                .filter(attendance -> attendance.getAttendanceStatus() == AttendanceStatus.PRESENT)
                                .count();
                int daysAbsent = totalWorkingDays - daysPresent;

                Double attendancePercentage = null;
                if (totalWorkingDays > 0) {
                        attendancePercentage = (double) daysPresent / totalWorkingDays * 100.0;
                        attendancePercentage = Math.round(attendancePercentage * 100.0) / 100.0;
                }

                return AttendanceSummaryDTO.builder()
                                .attendancePercentage(attendancePercentage)
                                .daysPresent(daysPresent)
                                .daysAbsent(daysAbsent)
                                .totalWorkingDays(totalWorkingDays)
                                .build();
        }

        /**
         * Updates a student's *profile information* only.
         * This method does NOT change their classroom enrollment.
         */
        @Transactional
        public StudentResponseDTO updateStudent(Long studentId, StudentRequestDTO studentRequestDTO)
                        throws IOException {
                School school = getCurrentSchool.requireCurrentSchool();

                Student existedStudent = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Student not present in the existed school."));

                String newPic = existedStudent.getProfilePictureUrl();
                if (studentRequestDTO.getProfilePicture() != null && !studentRequestDTO.getProfilePicture().isEmpty()) {
                        // Use a unique, stable identifier like email prefix or ID
                        newPic = fileStorageService.saveStudentProfile(
                                        studentRequestDTO.getProfilePicture(), existedStudent.getEmail().split("@")[0]);

                }

                // Check for email conflict
                studentRepository.findByEmailAndSchool_Id(studentRequestDTO.getEmail(), school.getId()).ifPresent(s -> {
                        if (!s.getId().equals(studentId))
                                throw new IllegalArgumentException("This email is already taken.");
                });

                // Note: We don't update rollNo or classroomId here, as that's an enrollment
                // change.

                existedStudent.setFirstName(studentRequestDTO.getFirstName());
                existedStudent.setLastName(studentRequestDTO.getLastName());
                existedStudent.setEmail(studentRequestDTO.getEmail());
                existedStudent.setPhoneNumber(studentRequestDTO.getPhoneNumber());
                existedStudent.setAdmissionNo(studentRequestDTO.getAdmissionNo());
                existedStudent.setProfilePictureUrl(newPic);

                existedStudent.setFatherName(studentRequestDTO.getFatherName());
                existedStudent.setMotherName(studentRequestDTO.getMotherName());
                existedStudent.setGuardianName(studentRequestDTO.getGuardianName());
                existedStudent.setParentPhonePrimary(studentRequestDTO.getParentPhonePrimary());
                existedStudent.setParentPhoneSecondary(studentRequestDTO.getParentPhoneSecondary());
                existedStudent.setParentEmail(studentRequestDTO.getParentEmail());
                existedStudent.setParentOccupation(studentRequestDTO.getParentOccupation());
                existedStudent.setAnnualIncome(studentRequestDTO.getAnnualIncome());
                existedStudent.setFullAddress(studentRequestDTO.getFullAddress());
                existedStudent.setCity(studentRequestDTO.getCity());
                existedStudent.setState(studentRequestDTO.getState());
                existedStudent.setPincode(studentRequestDTO.getPincode());
                existedStudent.setMedicalConditions(studentRequestDTO.getMedicalConditions());
                existedStudent.setAllergies(studentRequestDTO.getAllergies());
                existedStudent.setEmergencyContactName(studentRequestDTO.getEmergencyContactName());
                existedStudent.setEmergencyContactNumber(studentRequestDTO.getEmergencyContactNumber());
                existedStudent.setPreviousSchoolName(studentRequestDTO.getPreviousSchoolName());
                existedStudent.setPreviousClass(studentRequestDTO.getPreviousClass());
                existedStudent.setAdmissionDate(studentRequestDTO.getAdmissionDate());
                if (studentRequestDTO.getTransportRequired() != null)
                        existedStudent.setTransportRequired(studentRequestDTO.getTransportRequired());
                if (studentRequestDTO.getHostelRequired() != null)
                        existedStudent.setHostelRequired(studentRequestDTO.getHostelRequired());
                existedStudent.setFeeCategory(studentRequestDTO.getFeeCategory());
                existedStudent.setGender(studentRequestDTO.getGender());

                // keep associated User entity in sync
                existedStudent.getUser()
                                .setFullName(studentRequestDTO.getFirstName() + " " + existedStudent.getLastName());
                existedStudent.getUser().setEmail(studentRequestDTO.getEmail());

                Student updated = studentRepository.save(existedStudent);

                activityLogService.logActivity(
                                "Updated student profile: " + updated.getFirstName() + " " + updated.getLastName(),
                                "Student Update");

                // Find their current enrollment to send back the full DTO
                Enrollment currentEnrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(updated,
                                                getCurrentSchool.requireCurrentSchool().getId(), true)
                                .orElse(null);

                return mapToStudentResponseDTO(updated, currentEnrollment);
        }

        /**
         * --- RE-IMPLEMENTED AS A "TRANSFER" ---
         * Assigns (or transfers) a student to a different classroom *within the current
         * academic year*.
         */
        @Transactional
        public StudentResponseDTO assignStudentToClassroom(Long studentId, Long newClassroomId) {
                School adminSchool = getCurrentSchool.requireCurrentSchool();

                Student student = studentRepository.findByIdAndSchool_Id(studentId, adminSchool.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));
                Classroom newClassroom = classroomRespository.findByIdAndSchool(newClassroomId, adminSchool)
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));
                AcademicYear currentYear = academicYearRepository
                                .findByIsCurrentAndSchool_Id(true, getCurrentSchool.requireCurrentSchool().getId())
                                .orElseThrow(() -> new IllegalStateException("No active academic year is set!"));

                if (student.getUser().getSchool() == null || newClassroom.getSchool() == null) {
                        throw new IllegalStateException("School information is missing.");
                }
                if (!student.getUser().getSchool().getId().equals(newClassroom.getSchool().getId())) {
                        throw new IllegalArgumentException("Student and Classroom must be in the same school.");
                }

                // Find the student's *current* enrollment
                Optional<Enrollment> existingEnrollmentOpt = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                getCurrentSchool.requireCurrentSchool().getId(), true);

                Enrollment enrollmentToSave;
                if (existingEnrollmentOpt.isPresent()) {
                        // --- This is a TRANSFER ---
                        Enrollment existingEnrollment = existingEnrollmentOpt.get();
                        String oldClassroomName = existingEnrollment.getClassroom().getSection();

                        // new rollNO
                        String newRollNo = generateNextRollNoForClass(newClassroom, currentYear);
                        existingEnrollment.setClassroom(newClassroom);
                        existingEnrollment.setRollNo(newRollNo);
                        // Simply update the classroom
                        enrollmentToSave = enrollmentRepository.save(existingEnrollment);
                        autoAssignMandatorySubjects(student, newClassroom);
                        activityLogService.logActivity(
                                        "Student " + student.getFirstName() + " transferred from " + oldClassroomName
                                                        + " to " + newClassroom.getSection(),
                                        "Student Transfer");
                } else {
                        // --- This is a NEW ENROLLMENT (for an unassigned student) ---
                        String newRollNo = generateNextRollNoForClass(newClassroom, currentYear);
                        Enrollment newEnrollment = Enrollment.builder()
                                        .student(student)
                                        .classroom(newClassroom)
                                        .academicYear(currentYear)
                                        .rollNo(newRollNo)
                                        .build();
                        enrollmentToSave = enrollmentRepository.save(newEnrollment);
                        autoAssignMandatorySubjects(student, newClassroom);

                        activityLogService.logActivity(
                                        "Student " + student.getFirstName() + " enrolled in "
                                                        + newClassroom.getSection(),
                                        "Student Enrollment");
                }

                return mapToStudentResponseDTO(student, enrollmentToSave);
        }

        /**
         * --- NEW METHOD ---
         * Removes a student from their *current* classroom by deleting their
         * enrollment for the *active* academic year.
         */
        @Transactional
        public void removeStudentFromClassroom(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                Enrollment currentEnrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                getCurrentSchool.requireCurrentSchool().getId(), true)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Student is not currently enrolled in any class."));

                String classroomName = currentEnrollment.getClassroom().getSection();

                enrollmentRepository.delete(currentEnrollment);

                activityLogService.logActivity(
                                "Student " + student.getFirstName() + " was unenrolled from " + classroomName,
                                "Student Unenrollment");
        }

        /**
         * Deletes a student and ALL their associated data (User, Enrollments, Subject
         * links).
         * This is a permanent, destructive action.
         */
        @Transactional
        public void deleteById(Long studentId) {
                School school = getCurrentSchool.requireCurrentSchool();
                Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                Enrollment enrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                getCurrentSchool.requireCurrentSchool().getId(), true)
                                .orElseThrow(() -> new RuntimeException("Student has no active enrollment."));

                if (enrollment.getStatus() != StudentStatus.INACTIVE) {
                        throw new IllegalStateException("Student must be INACTIVE before permanent deletion");
                }

                // --- DATA INTEGRITY CASCADE ---
                // 1. Delete all subject assignments (electives)

                studentSubjectsRepository.deleteByEnrollment_StudentId(studentId);
                studentSubjectEnrollmentRepository.deleteByStudentId(studentId);

                // 2. Delete all enrollment history
                enrollmentRepository.deleteByStudentId(studentId);

                // 3. Delete the student
                studentRepository.delete(student);

                activityLogService.logActivity(
                                "Deleted student: " + student.getFirstName() + " " + student.getLastName(),
                                "Student Deletion");
        }

        /**
         * Gets all students *currently* enrolled in a specific classroom for the
         * *active* year.
         */
        @Transactional
        public List<StudentResponseDTO> getStudentsByClassroom(Long classroomId) {
                School school = getCurrentSchool.requireCurrentSchool();
                Classroom classroom = classroomRespository.findByIdAndSchool(classroomId, school)
                                .orElseThrow(() -> new EntityNotFoundException("Classroom not found"));

                AcademicYear currentYear = academicYearRepository
                                .findByIsCurrentAndSchool_Id(true, getCurrentSchool.requireCurrentSchool().getId())
                                .orElseThrow(() -> new IllegalStateException("No active academic year is set!"));

                List<Enrollment> enrollments = enrollmentRepository.findByClassroomAndSchool_IdAndAcademicYear(
                                classroom, getCurrentSchool.requireCurrentSchool().getId(), currentYear);

                return enrollments.stream()
                                .map(enrollment -> mapToStudentResponseDTO(enrollment.getStudent(), enrollment))
                                .toList();
        }

        /**
         * Update Enrollment Status
         */

        @Transactional
        public void updateStatus(Long studentId, StudentStatus status) {

                School school = getCurrentSchool.requireCurrentSchool();

                Student student = studentRepository.findByIdAndSchool_Id(studentId, school.getId())
                                .orElseThrow(() -> new EntityNotFoundException("Student not found."));

                Enrollment enrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                getCurrentSchool.requireCurrentSchool().getId(), true)
                                .orElseThrow(() -> new EntityNotFoundException("Student has no active enrollment"));

                if (enrollment.getStatus() == status)
                        return;

                enrollment.setStatus(status);
                enrollmentRepository.save(enrollment);

                activityLogService.logActivity(
                                "Student: " + student.getFirstName() + " status change to " + status,
                                "Student Status Update");

        }

        /**
         * Assigns an elective subject to a student.
         */
        @Transactional
        public StudentResponseDTO assignStudentToSubject(Long studentId, Long subjectId) {

                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                Subject subject = subjectRepository.findById(subjectId)
                                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));

                Enrollment enrollment = enrollmentRepository
                                .findByStudentAndSchool_IdAndAcademicYearIsCurrent(student,
                                                getCurrentSchool.requireCurrentSchool().getId(), true)
                                .orElseThrow(() -> new IllegalStateException("Student not enrolled in any classroom"));

                Classroom classroom = enrollment.getClassroom();

                TeacherAssignment assignment = teacherAssignmentRepository
                                .findByClassroomAndSubject(classroom, subject)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Subject not part of classroom curriculum"));

                if (assignment.isMandatory()) {
                        throw new IllegalStateException(
                                        "Mandatory subjects are auto-assigned and cannot be manually added");
                }

                boolean exists = studentSubjectEnrollmentRepository
                                .existsByStudentAndSubject(student, subject);

                if (exists) {
                        throw new IllegalStateException("Subject already assigned to student");
                }

                StudentSubjectEnrollment enrollmentEntry = StudentSubjectEnrollment.builder()
                                .student(student)
                                .subject(subject)
                                .mandatory(false)
                                .build();

                studentSubjectEnrollmentRepository.save(enrollmentEntry);

                activityLogService.logActivity(
                                "Optional subject " + subject.getName() +
                                                " assigned to student " + student.getFirstName(),
                                "Student Subject Assignment");

                Enrollment currentEnrollment = enrollmentRepository.findByStudentAndSchool_IdAndAcademicYearIsCurrent(
                                student, getCurrentSchool.requireCurrentSchool().getId(), true).orElse(null);

                return mapToStudentResponseDTO(student, currentEnrollment);
        }

        /**
         * Removes an elective subject from a student.
         */
        @Transactional
        public void removeSubjectFromStudent(Long studentId, Long subjectId) {

                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                Subject subject = subjectRepository.findById(subjectId)
                                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));

                // 1️⃣ Get student's active classroom via enrollment
                Enrollment enrollment = enrollmentRepository
                                .findActiveByStudent(student)
                                .orElseThrow(() -> new IllegalStateException("Student is not enrolled in any class"));

                Classroom classroom = enrollment.getClassroom();

                // 2️⃣ Check if subject is mandatory for this classroom
                boolean isMandatoryForClass = teacherAssignmentRepository
                                .existsByClassroomAndSubjectAndMandatoryTrue(
                                                classroom,
                                                subject);

                if (isMandatoryForClass) {
                        throw new IllegalStateException(
                                        "Mandatory subjects cannot be removed");
                }

                // 3️⃣ Find student-subject enrollment
                StudentSubjectEnrollment studentSubjectEnrollment = studentSubjectEnrollmentRepository
                                .findByStudentAndSubject(student, subject)
                                .orElseThrow(() -> new EntityNotFoundException("Subject not assigned to student"));

                // 4️⃣ Delete (only optional subjects reach here)
                studentSubjectEnrollmentRepository.delete(studentSubjectEnrollment);

                activityLogService.logActivity(
                                "Optional subject " + subject.getName() +
                                                " removed from student " + student.getFirstName(),
                                "Student Subject Update");
        }

        /**
         * Gets a list of elective subjects (as DTOs) for a specific student.
         */
        @Transactional
        public List<SubjectResponseDTO> getSubjectsOfStudent(Long studentId) {
                School school = getCurrentSchool.requireCurrentSchool();

                if (!studentRepository.existsById(studentId)) {
                        throw new EntityNotFoundException("Student not found");
                }

                List<StudentSubjectEnrollment> enrollments = studentSubjectEnrollmentRepository
                                .findByStudentId(studentId);

                List<SubjectResponseDTO> responseList = new java.util.ArrayList<>();

                for (StudentSubjectEnrollment enrollment : enrollments) {
                        Subject subject = enrollment.getSubject();

                        SubjectResponseDTO dto = SubjectResponseDTO.builder()
                                        .id(subject.getId())
                                        .name(subject.getName())
                                        .code(subject.getCode())
                                        .mandatory(enrollment.isMandatory())
                                        .build();

                        responseList.add(dto);
                }

                return responseList;
        }

        /**
         * This is the new, secure "Send Password Reset" function.
         * It generates a new password and emails it to the student.
         */
        @Transactional
        public void sendPasswordReset(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

                User user = student.getUser();
                if (user == null) {
                        throw new EntityNotFoundException("Associated user account not found for this student.");
                }

                String newRawPassword = randomPasswordGenerator.generateRandomPassword();
                String newEncodedPassword = passwordEncoder.encode(newRawPassword);

                // Update password on both User and Student entities
                user.setPassword(newEncodedPassword);
                student.setPassword(newEncodedPassword);

                // Save the updated entities
                userRepo.save(user);
                studentRepository.save(student);

                // Send the new password to the student's email
                try {
                        emailService.sendNewUserWelcomeEmail( // We can reuse the welcome email template
                                        student.getEmail(),
                                        student.getFirstName(),
                                        newRawPassword);
                        activityLogService.logActivity(
                                        "Admin triggered password reset for student: " + student.getFirstName() + " "
                                                        + student.getLastName(),
                                        "Security");
                } catch (Exception e) {
                        System.err.println("Failed to send password reset email for student " + student.getId() + ": "
                                        + e.getMessage());
                        // Even if email fails, the password *is* changed. We must not fail the
                        // transaction.
                        // But we should throw a different exception so the admin knows the email
                        // failed.
                        throw new RuntimeException(
                                        "Password was reset, but failed to send email. Please notify the student manually.");
                }
        }

        // =================================================================
        // --- HELPER METHODS ---
        // =================================================================

        /**
         * This is the new, standout feature for auto-generating roll numbers.
         * e.g., "G10A-2024-001"
         */
        public String generateNextRollNoForClass(Classroom classroom, AcademicYear year) {
                long count = enrollmentRepository.countByClassroomAndAcademicYearAndSchool_Id(
                                classroom, year, getCurrentSchool.requireCurrentSchool().getId());

                String sequence = String.format("%03d", count + 1); // "001", "002", ...
                String gradeCode = classroom.getGradeLevel().getCode(); // "NUR", "LKG", "G10"
                String section = classroom.getSection().trim().toUpperCase(); // "A", "B"
                String yearStr = String.valueOf(year.getStartDate().getYear()); // "2025"

                return gradeCode + "-" + section + "-" + yearStr + "-" + sequence;
        }

        private StudentResponseDTO mapToStudentResponseDTO(Student student, Enrollment currentEnrollment) {

                StudentResponseDTO.StudentResponseDTOBuilder dtoBuilder = StudentResponseDTO.builder()
                                .id(student.getId())
                                .firstName(student.getFirstName())
                                .lastName(student.getLastName())
                                .email(student.getEmail())
                                .phoneNumber(student.getPhoneNumber())
                                .admissionNo(student.getAdmissionNo())
                                .profilePictureUrl(student.getProfilePictureUrl())
                                .fatherName(student.getFatherName())
                                .motherName(student.getMotherName())
                                .guardianName(student.getGuardianName())
                                .parentPhonePrimary(student.getParentPhonePrimary())
                                .parentPhoneSecondary(student.getParentPhoneSecondary())
                                .parentEmail(student.getParentEmail())
                                .parentOccupation(student.getParentOccupation())
                                .annualIncome(student.getAnnualIncome())
                                .fullAddress(student.getFullAddress())
                                .city(student.getCity())
                                .state(student.getState())
                                .pincode(student.getPincode())
                                .medicalConditions(student.getMedicalConditions())
                                .allergies(student.getAllergies())
                                .emergencyContactName(student.getEmergencyContactName())
                                .emergencyContactNumber(student.getEmergencyContactNumber())
                                .previousSchoolName(student.getPreviousSchoolName())
                                .previousClass(student.getPreviousClass())
                                .admissionDate(student.getAdmissionDate())
                                .transportRequired(student.getTransportRequired())
                                .hostelRequired(student.getHostelRequired())
                                .feeCategory(student.getFeeCategory())
                                .gender(student.getGender());

                // ✅ ONLY access enrollment if it exists
                if (currentEnrollment != null) {
                        dtoBuilder.status(currentEnrollment.getStatus());
                        dtoBuilder.currentEnrollmentId(currentEnrollment.getId());
                        dtoBuilder.rollNo(currentEnrollment.getRollNo());
                        dtoBuilder.academicYearName(currentEnrollment.getAcademicYear().getName());

                        dtoBuilder.classroomResponseDTO(
                                        ClassroomResponseDTO.builder()
                                                        .id(currentEnrollment.getClassroom().getId())
                                                        .section(currentEnrollment.getClassroom().getSection())
                                                        .capacity(currentEnrollment.getClassroom().getCapacity())
                                                        .status(currentEnrollment.getClassroom().getStatus())
                                                        .gradeLevel(currentEnrollment.getClassroom().getGradeLevel())
                                                        .studentCount(
                                                                        enrollmentRepository
                                                                                        .countByClassroomAndAcademicYearAndSchool_Id(
                                                                                                        currentEnrollment
                                                                                                                        .getClassroom(),
                                                                                                        currentEnrollment
                                                                                                                        .getAcademicYear(),
                                                                                                        getCurrentSchool.requireCurrentSchool()
                                                                                                                        .getId()))
                                                        .build());
                } else {
                        // optional fallback
                        dtoBuilder.status(StudentStatus.INACTIVE); // or null if you prefer
                }

                // subjects (this part is fine)
                List<StudentSubjectEnrollment> enrollments = studentSubjectEnrollmentRepository
                                .findByStudentId(student.getId());

                List<SubjectResponseDTO> subjectsDTOs = enrollments.stream()
                                .map(ss -> SubjectResponseDTO.builder()
                                                .id(ss.getSubject().getId())
                                                .name(ss.getSubject().getName())
                                                .code(ss.getSubject().getCode())
                                                .mandatory(ss.isMandatory())
                                                .build())
                                .collect(Collectors.toList());

                dtoBuilder.subjectResponseDTOS(subjectsDTOs);

                return dtoBuilder.build();
        }

        private StudentExamResultDTO mapToStudentExamResult(Exam exam, List<StudentSubjectMarks> marks) {
                List<StudentExamResultDTO.SubjectMark> subjectMarks = marks.stream()
                                .map(mark -> {
                                        double maxMarks = mark.getTotalMarks() != null ? mark.getTotalMarks() : 100.0;
                                        double percentage = maxMarks > 0
                                                        ? Math.round((mark.getMarksObtained() / maxMarks) * 10000.0)
                                                                        / 100.0
                                                        : 0.0;

                                        return StudentExamResultDTO.SubjectMark.builder()
                                                        .subjectName(mark.getSubject().getName())
                                                        .marksObtained(mark.getMarksObtained())
                                                        .maxMarks(maxMarks)
                                                        .grade(mark.getGrade())
                                                        .percentage(percentage)
                                                        .build();
                                })
                                .toList();

                double totalObtained = subjectMarks.stream()
                                .mapToDouble(mark -> mark.getMarksObtained() != null ? mark.getMarksObtained() : 0)
                                .sum();
                double totalMax = subjectMarks.stream()
                                .mapToDouble(mark -> mark.getMaxMarks() != null ? mark.getMaxMarks() : 100)
                                .sum();
                double percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000.0) / 100.0 : 0.0;

                return StudentExamResultDTO.builder()
                                .examId(exam.getId())
                                .examName(exam.getName())
                                .examStatus(exam.getStatus() != null ? exam.getStatus().name() : "Completed")
                                .academicYearName(exam.getAcademicYear() != null ? exam.getAcademicYear().getName() : null)
                                .examType(exam.getExamType() != null ? exam.getExamType().name() : null)
                                .classroomName(exam.getClassroom() != null
                                                ? exam.getClassroom().getGradeLevel().getDisplayName() + " - "
                                                                + exam.getClassroom().getSection()
                                                : null)
                                .totalObtained(totalObtained)
                                .totalMaxMarks(totalMax)
                                .percentage(percentage)
                                .overallGrade(marks.get(0).getGrade())
                                .subjectMarks(subjectMarks)
                                .build();
        }

        // helper method
        public void autoAssignMandatorySubjects(Student student, Classroom classroom) {

                List<TeacherAssignment> mandatoryAssignments = teacherAssignmentRepository
                                .findByClassroomAndMandatoryTrue(classroom);

                for (TeacherAssignment assignment : mandatoryAssignments) {

                        boolean exists = studentSubjectEnrollmentRepository
                                        .existsByStudentAndSubject(student, assignment.getSubject());

                        if (!exists) {
                                StudentSubjectEnrollment enrollment = StudentSubjectEnrollment.builder()
                                                .student(student)
                                                .subject(assignment.getSubject())
                                                .mandatory(true)
                                                .build();

                                studentSubjectEnrollmentRepository.save(enrollment);
                        }
                }
        }

}
