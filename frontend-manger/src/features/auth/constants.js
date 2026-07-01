export const AUTH_ROLES = {
  admin: {
    label: 'Admin Portal',
    loginPath: '/admin/auth/admin-login',
    dashboardPath: '/admin/dashboard',
    apiPrefix: '/api/auth/admin',
    tokenKey: '__AUTH_ACCESS_TOKEN__',
    accentColor: 'blue',
    icon: 'School',
  },
  student: {
    label: 'Student Portal',
    loginPath: '/student/auth/student-login',
    dashboardPath: '/student/dashboard',
    apiPrefix: '/api/auth/student',
    tokenKey: '__STUDENT_AUTH_ACCESS_TOKEN__',
    accentColor: 'orange',
    icon: 'GraduationCap',
  },
  teacher: {
    label: 'Teacher Portal',
    loginPath: '/teacher/auth/login',
    dashboardPath: '/teacher/dashboard',
    apiPrefix: '/api/auth/teacher',
    tokenKey: '__TEACHER_AUTH_ACCESS_TOKEN__',
    accentColor: 'blue',
    icon: 'School',
  },
};
