package com.vansh.manger.Manger.student.util;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.service.FileStorageService;
import com.vansh.manger.Manger.student.dto.StudentRequestDTO;
import com.vansh.manger.Manger.student.entity.Student;

import lombok.RequiredArgsConstructor;

@Component 
@RequiredArgsConstructor
public class StudentProfileUploader {


    private final FileStorageService fileStorageService;

    
    public CloudinaryResponse uploadStudentProfile(StudentRequestDTO dto, MultipartFile file) {

        CloudinaryResponse uploadedProfilePicture = null;

        if(dto.getProfilePicture() != null && !dto.getProfilePicture().isEmpty()) {

            try {
                 uploadedProfilePicture = fileStorageService.uploadStudentProfile(file, dto.getEmail().toLowerCase().split("@")[0]);
                 return uploadedProfilePicture;

            }catch(IOException e) {
                cleanupUploadedImage(uploadedProfilePicture);
                throw new RuntimeException("Failed to upload profile picture", e);
            }
           

        }
        return null;
    }

    
    

    private void cleanupUploadedImage(CloudinaryResponse uploadedImage) {
        if(uploadedImage == null) {
            return;
        }

        try {
            fileStorageService.deleteFile(uploadedImage.getPublicId());
        }catch(RuntimeException ignored) {

        }
    }
    
}
