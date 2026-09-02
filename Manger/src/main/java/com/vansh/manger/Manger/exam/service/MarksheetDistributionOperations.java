package com.vansh.manger.Manger.exam.service;

/**
 * ISP: Operations for sending marksheet PDFs via email.
 */
public interface MarksheetDistributionOperations {
    void sendMarksheet(Long examId, Long enrollmentId);
    void sendAllMarksheets(Long examId);
    byte[] generateMarksheetPdf(Long examId, Long enrollmentId);
}
