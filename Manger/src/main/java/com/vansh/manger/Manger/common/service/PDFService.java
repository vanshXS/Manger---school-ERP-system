package com.vansh.manger.Manger.common.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.vansh.manger.Manger.student.dto.StudentResponseDTO;
import com.vansh.manger.Manger.teacher.dto.TeacherResponseDTO;
import com.vansh.manger.Manger.student.entity.Enrollment; // --- NEW IMPORT ---
import com.vansh.manger.Manger.student.entity.Student;
import com.vansh.manger.Manger.exam.entity.StudentSubjectMarks;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.util.Date;
import java.util.List;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.classroom.entity.Classroom;
import com.vansh.manger.Manger.teacher.entity.Teacher;
import com.vansh.manger.Manger.subject.entity.Subject;
import com.vansh.manger.Manger.exam.entity.Exam;
import com.vansh.manger.Manger.exam.entity.Grade;

@Service
@RequiredArgsConstructor
public class PDFService {

    /**
     * Generates an information slip for a student.
     * This version is SECURE and does NOT include the student's password.
     */
    public byte[] generateStudentSlip(StudentResponseDTO student) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("=== Student Information Slip ===", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18));
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n")); // Add spacing

            // Add student details
            document.add(new Paragraph("Student ID: " + student.getId()));
            document.add(new Paragraph("Name: " + student.getFirstName() + " " + student.getLastName()));
            document.add(new Paragraph("Email: " + student.getEmail()));

            // --- USES DTO, WHICH IS ALREADY CORRECT ---
            document.add(new Paragraph("Roll No: " + (student.getRollNo() != null ? student.getRollNo() : "N/A")));
            document.add(new Paragraph("Classroom: " + (student.getClassroomResponseDTO() != null ? student.getClassroomResponseDTO().getSection() : "N/A")));
            document.add(new Paragraph("Phone Number: " + (student.getPhoneNumber() != null ? student.getPhoneNumber() : "N/A")));

            // --- SECURITY FIX: PASSWORD REMOVED ---
            document.add(new Paragraph("\nNote: The student's password was sent to their registered email."));
            document.add(new Paragraph("If a reset is needed, the student can use the 'Forgot Password' feature on the login page."));


            document.add(new Paragraph("\nGenerated At: " + new Date()));
            document.close();

            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating student PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Generates an information slip for a teacher.
     * This version is professionally styled with a header, table, and footer.
     */
    public byte[] generateTeacherSlip(TeacherResponseDTO teacher) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            // ---------- Header ----------
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(33, 97, 140));
            Paragraph title = new Paragraph("MANGER | Teacher Information Slip", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            // ---------- Teacher Details Table ----------
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);
            table.setWidths(new float[]{1, 2});

            addTablePair(table, "Teacher ID", String.valueOf(teacher.getId()));
            addTablePair(table, "Employee ID", teacher.getEmployeeId() != null ? teacher.getEmployeeId() : "N/A");
            addTablePair(table, "Full Name", teacher.getFirstName() + " " + teacher.getLastName());
            addTablePair(table, "Email", teacher.getEmail());
            addTablePair(table, "Phone Number", teacher.getPhoneNumber() != null ? teacher.getPhoneNumber() : "N/A");
            addTablePair(table, "Gender", teacher.getGender() != null ? teacher.getGender().name() : "N/A");
            addTablePair(table, "Join Date", teacher.getJoinDate() != null ? teacher.getJoinDate() : "N/A");
            addTablePair(table, "Employment Type", teacher.getEmploymentType() != null ? teacher.getEmploymentType().name() : "N/A");
            addTablePair(table, "Qualification", teacher.getQualification() != null ? teacher.getQualification() : "N/A");
            addTablePair(table, "Specialization", teacher.getSpecialization() != null ? teacher.getSpecialization() : "N/A");
            addTablePair(table, "Experience", teacher.getYearsOfExperience() != null ? teacher.getYearsOfExperience() + " Years" : "N/A");

            if (teacher.getAssignedClassrooms() != null && !teacher.getAssignedClassrooms().isEmpty()) {
                java.util.StringJoiner joiner = new java.util.StringJoiner(", ");
                teacher.getAssignedClassrooms().forEach(c -> {
                    String display = c.getClassName();
                    if (c.getSubjectName() != null) {
                        display += " (" + c.getSubjectName() + ")";
                    }
                    joiner.add(display);
                });
                addTablePair(table, "Assigned Sections", joiner.toString());
            } else {
                addTablePair(table, "Assigned Sections", "Not assigned");
            }

            document.add(table);

            // ---------- Security Note ----------
            Font noteFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 11, Color.DARK_GRAY);
            Paragraph note = new Paragraph("\nNote: Your temporary password has been sent to your registered email address. " +
                    "Please log in and change it immediately for security purposes.", noteFont);
            note.setAlignment(Element.ALIGN_CENTER);
            document.add(note);

            // ---------- Footer ----------
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY);
            String generatedDate = java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
            Paragraph footer = new Paragraph(
                    "\n\n\nGenerated On: " + generatedDate + "\nMANGER: Virtual School Management System",
                    footerFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating teacher PDF: " + e.getMessage(), e);
        }
    }

    private void addTablePair(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(50, 50, 50));
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);

        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBackgroundColor(new Color(245, 245, 245));
        labelCell.setPadding(8f);
        labelCell.setBorderColor(Color.LIGHT_GRAY);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setPadding(8f);
        valueCell.setBorderColor(Color.LIGHT_GRAY);
        table.addCell(valueCell);
    }

    /**
     * Generates a marks sheet for a student.
     * --- THIS METHOD IS NOW FIXED ---
     * It now accepts an Enrollment object, which contains all the correct context.
     */
    public byte[] generateMarksSheet(Enrollment enrollment, List<StudentSubjectMarks> subjectRecords, String examName) {
        try {
            Student student = enrollment.getStudent(); // Get the student from the enrollment

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // ---------- Header ----------
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(33, 97, 140));
            Paragraph title = new Paragraph("MANGER | Student Marksheet", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            // ---------- Student Details (NOW USES ENROLLMENT) ----------
            Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);
            document.add(new Paragraph("Student ID: " + student.getId(), infoFont));
            document.add(new Paragraph("Name: " + student.getFirstName() + " " + student.getLastName(), infoFont));
            document.add(new Paragraph("Email: " + student.getEmail(), infoFont));

            // --- FIXED: Get Roll No and Classroom from Enrollment ---
            document.add(new Paragraph("Roll No: " + enrollment.getRollNo(), infoFont));
            document.add(new Paragraph("Classroom: " + enrollment.getClassroom().getSection(), infoFont));
            document.add(new Paragraph("Academic Year: " + enrollment.getAcademicYear().getName(), infoFont));

            document.add(new Paragraph("Exam Name: " + examName, infoFont));
            document.add(new Paragraph("\n"));

            // ---------- Marks Table ----------
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3, 3, 3, 3, 3});

            addTableHeader(table, "Subject");
            addTableHeader(table, "Marks Obtained");
            addTableHeader(table, "Total Marks");
            addTableHeader(table, "Grade");
            addTableHeader(table, "Percentage");

            double totalObtained = 0;
            double totalPossible = 0;

            for (StudentSubjectMarks ss : subjectRecords) {
                if (ss.getSubject() != null) {
                    addTableCell(table, ss.getSubject().getName());
                } else {
                    addTableCell(table, "N/A");
                }

                addTableCell(table, String.valueOf(ss.getMarksObtained()));
                addTableCell(table, String.valueOf(ss.getTotalMarks()));
                addTableCell(table, ss.getGrade() != null ? ss.getGrade() : "N/A");

                double percentage = (ss.getTotalMarks() > 0) ? (ss.getMarksObtained() / ss.getTotalMarks()) * 100 : 0.0;
                addTableCell(table, String.format("%.2f%%", percentage));

                totalObtained += ss.getMarksObtained();
                totalPossible += ss.getTotalMarks();
            }

            document.add(table);
            document.add(new Paragraph("\n"));

            // ---------- Overall Summary ----------
            double overallPercentage = (totalPossible > 0) ? (totalObtained / totalPossible) * 100 : 0.0;
            String overallGrade = getOverallGrade(overallPercentage);

            Font summaryFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(44, 62, 80));
            document.add(new Paragraph("Total Marks Obtained: " + totalObtained + " / " + totalPossible, summaryFont));
            document.add(new Paragraph("Overall Percentage: " + String.format("%.2f%%", overallPercentage), summaryFont));
            document.add(new Paragraph("Final Grade: " + overallGrade, summaryFont));
            document.add(new Paragraph("\n"));

            // ---------- Remarks ----------
            Font remarkFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, Color.DARK_GRAY);
            Paragraph remark;

            if (!overallGrade.equalsIgnoreCase("F")) {
                remark = new Paragraph("Congratulations! You have successfully passed the exam!", remarkFont);
            } else {
                remark = new Paragraph("You need improvement. Please focus on weak areas.", remarkFont);
            }

            remark.setAlignment(Element.ALIGN_CENTER);
            document.add(remark);
            document.add(new Paragraph("\n\n"));

            // ---------- Footer ----------
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY);
            String generatedDate = java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
            Paragraph footer = new Paragraph(
                    "Generated On: " + generatedDate + "\nMANGER: Virtual Manager of School",
                    footerFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage());
        }
    }



    // DRY: Delegates to shared GradeCalculator (unified grade boundaries across entire app)
    private String getOverallGrade(double percentage) {
        return com.vansh.manger.Manger.common.util.GradeCalculator.computeGrade(percentage);
    }



    //helper methods
    private static void addTableHeader(PdfPTable table, String text) {
        PdfPCell header = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLDOBLIQUE, 12)));
        header.setBackgroundColor(new Color(230, 230, 230));
        header.setHorizontalAlignment(Element.ALIGN_CENTER);
        header.setPadding(8f);
        table.addCell(header);
    }

    private static void addTableCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 12)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(8f);
        table.addCell(cell);
    }
}