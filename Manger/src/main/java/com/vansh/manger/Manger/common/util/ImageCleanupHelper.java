package com.vansh.manger.Manger.common.util;



import com.vansh.manger.Manger.common.dto.CloudinaryResponse;
import com.vansh.manger.Manger.common.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Handles Cloudinary image lifecycle — cleanup on failure and
 * deletion of previous images after a successful replacement.
 *
 * <p><b>SRP</b> — single responsibility: image cleanup.
 * <b>DRY</b> — replaces identical deletePreviousImage / cleanupUploadedImage
 * methods duplicated in AdminStudentService, AdminTeacherService,
 * AdminSchoolService, and StudentProfileUploader.</p>
 */
@Component
@RequiredArgsConstructor
public class ImageCleanupHelper {

    private final FileStorageService fileStorageService;

    /**
     * Deletes the previous image from Cloudinary after a successful replacement.
     * No-op if there was no previous image or if the IDs match.
     */
    public void deleteOldImage(String previousPublicId, String newPublicId) {
        if (previousPublicId == null || previousPublicId.equals(newPublicId)) {
            return;
        }
        try {
            fileStorageService.deleteFile(previousPublicId);
        } catch (RuntimeException ignored) {
            // Best-effort deletion — don't fail the main operation
        }
    }

    /**
     * Rolls back a newly uploaded image if the transaction fails.
     * No-op if no image was uploaded.
     */
    public void cleanupOnFailure(CloudinaryResponse uploaded) {
        if (uploaded == null) {
            return;
        }
        try {
            fileStorageService.deleteFile(uploaded.getPublicId());
        } catch (RuntimeException ignored) {
            // Best-effort cleanup
        }
    }
}
