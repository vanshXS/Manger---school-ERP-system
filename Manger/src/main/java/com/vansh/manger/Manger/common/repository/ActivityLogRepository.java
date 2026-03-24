package com.vansh.manger.Manger.common.repository;

import com.vansh.manger.Manger.common.entity.ActivityLog;
import com.vansh.manger.Manger.common.entity.Roles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {


    List<ActivityLog> findTop10BySchool_IdOrderByCreatedAtDesc(Long schoolId);

    Page<ActivityLog> findBySchool_IdOrderByCreatedAtDesc(Long schoolId, Pageable pageable);
    
    List<ActivityLog> findTop10BySchool_IdAndRoleOrderByCreatedAtDesc(Long schoolId, Roles role);

    Page<ActivityLog> findBySchool_IdAndRoleOrderByCreatedAtDesc(Long schoolId, Roles role, Pageable pageable);

    List<ActivityLog> findTop10BySchool_IdAndRoleAndTeacher_IdOrderByCreatedAtDesc(Long schoolId, Roles role, Long teacherId);

    Page<ActivityLog> findBySchool_IdAndRoleAndTeacher_IdOrderByCreatedAtDesc(Long schoolId, Roles role, Long teacherId, Pageable pageable);

}
