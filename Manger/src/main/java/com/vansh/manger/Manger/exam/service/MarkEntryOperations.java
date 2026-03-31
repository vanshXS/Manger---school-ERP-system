package com.vansh.manger.Manger.exam.service;

import com.vansh.manger.Manger.exam.dto.BulkMarksRequestDTO;

/**
 * ISP: Write operations for entering/updating student marks.
 */
public interface MarkEntryOperations {
    void saveBulkMarks(BulkMarksRequestDTO request);
}
