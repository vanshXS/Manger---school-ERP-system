package com.vansh.manger.Manger.common.entity;

import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@FilterDef(
        name = "schoolFilter",
        parameters = @ParamDef(name = "schoolId", type = Long.class)
)
public abstract class BaseEntity {
}