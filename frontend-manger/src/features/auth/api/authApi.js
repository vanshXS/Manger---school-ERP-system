import { AUTH_ROLES } from '../constants';
import { createApiClient } from './createApiClient';

export const adminApi = createApiClient(AUTH_ROLES.admin);
export const studentApi = createApiClient(AUTH_ROLES.student);
export const teacherApi = createApiClient(AUTH_ROLES.teacher);
