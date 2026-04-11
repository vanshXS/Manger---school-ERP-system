package com.vansh.manger.Manger.common.config;

import com.vansh.manger.Manger.common.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Component
public class TenantFilterInterceptor {

    @PersistenceContext
    private EntityManager entityManager;

    public boolean enableFilter() {
        if (TenantContext.get() == null) {
            return false;
        }

        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("schoolFilter").setParameter("schoolId", TenantContext.get());
        return true;
    }

    public void disableFilter() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("schoolFilter") != null) {
            session.disableFilter("schoolFilter");
        }
    }
}