package com.vansh.manger.Manger.Controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.PostConstruct;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);
    private static final String BASE_DIR = System.getProperty("user.home") + "/manger/uploads/";

    @GetMapping("/students/{filename:.+}")
    public ResponseEntity<Resource> getStudentImage(@PathVariable String filename) {
        return serveFile("students", filename);
    }

    @GetMapping("/teachers/{filename:.+}")
    public ResponseEntity<Resource> getTeacherImage(@PathVariable String filename) {
        return serveFile("teachers", filename);
    }

    @GetMapping("/logos/{filename:.+}")
    public ResponseEntity<Resource> getSchoolLogo(@PathVariable String filename) {
        return serveFile("logos", filename);
    }

    /**
     * Generic file serving method
     */
    private ResponseEntity<Resource> serveFile(String directory, String filename) {
        try {
            log.debug("File request: directory={}, filename={}", directory, filename);
            Path filePath = Paths.get(BASE_DIR, directory, filename);

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("File not found or not readable: {}", filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving file: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String determineContentType(String filename) {
        String lowerFilename = filename.toLowerCase();

        if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerFilename.endsWith(".png")) {
            return "image/png";
        } else if (lowerFilename.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerFilename.endsWith(".webp")) {
            return "image/webp";
        } else if (lowerFilename.endsWith(".svg")) {
            return "image/svg+xml";
        }

        return "application/octet-stream";
    }

    @PostConstruct
    public void init() {
        try {
            Path studentsPath = Paths.get(BASE_DIR, "students");
            Path teachersPath = Paths.get(BASE_DIR, "teachers");
            Path logosPath = Paths.get(BASE_DIR, "logos");

            Files.createDirectories(studentsPath);
            Files.createDirectories(teachersPath);
            Files.createDirectories(logosPath);
            log.info("Upload directories verified: students={}, teachers={}, logos={}",
                    studentsPath.toAbsolutePath(), teachersPath.toAbsolutePath(), logosPath.toAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to create upload directories: {}", e.getMessage());
        }
    }

}
