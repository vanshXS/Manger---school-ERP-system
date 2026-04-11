package com.vansh.manger.Manger.common.util;

public class TenantContext {

    private static final ThreadLocal<Long> threadLocal = new ThreadLocal<>();

    public static void setSchoolId(Long schoolId){
        threadLocal.set(schoolId);
    }

    public static Long get() {
        return threadLocal.get();
    }

    public static void remove(){
        threadLocal.remove();
    }
}
