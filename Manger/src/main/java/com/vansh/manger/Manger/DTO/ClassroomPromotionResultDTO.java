package com.vansh.manger.Manger.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomPromotionResultDTO {

    private String fromClassroom;
    private String toClassroom;

    private int promoted;
    private int graduated;
    private int detained;
    private int skipped;
    private int alreadyDone;

    private Status status;
    private String note;

    public enum Status {
        SUCCESS,
        GRADUATED,
        EMPTY,
        NO_TARGET
    }

    public int getTotal() {
        return promoted + graduated + detained + skipped + alreadyDone;
    }
}