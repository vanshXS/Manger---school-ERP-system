package com.vansh.manger.Manger.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final Cloudinary cloudinary;


    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static long MAX_SIZE = 2 * 1024 * 1024; //2MB

    /**
     * Core upload logic
     */
    private CloudinaryResponse uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if(!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Invalid file type.");
        }

        if(file.getSize() > MAX_SIZE) throw  new IllegalArgumentException("Invalid file size.");


        Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder
                )
        );

        String url = uploadResult.get("secure_url").toString();
        String publicId = uploadResult.get("public_id").toString();

        return new CloudinaryResponse(url, publicId);
    }

    public CloudinaryResponse uploadSchoolLogo(MultipartFile file, Long schoolId) throws IOException {
        return uploadFile(file, "schools/" + schoolId + "/logos");
    }

    public CloudinaryResponse uploadStudentProfile(MultipartFile file, String identifier) throws IOException {
        return uploadFile(file, "students/" + identifier);
    }

    public CloudinaryResponse uploadTeacherProfile(MultipartFile file, String identifier) throws IOException {
        return uploadFile(file, "teachers/" + identifier);
    }

    /**
     * Delete file from Cloudinary
     */
    @Async
    public void deleteFile(String publicId) {
        if (publicId == null || publicId.isEmpty()) return;

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
        }
    }
}