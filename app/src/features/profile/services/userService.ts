import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { User } from '@tennis-club/shared';
import type { UpdateProfileInput, UpdateRolesInput } from '@tennis-club/shared';

export const userService = {
  getProfile: () => api.get<{ data: User }>(ENDPOINTS.users.me).then((r) => r.data.data),

  updateProfile: (input: UpdateProfileInput) =>
    api.put<{ data: User }>(ENDPOINTS.users.me, input).then((r) => r.data.data),

  uploadAvatar: (formData: FormData) =>
    api
      .post<{ data: { url: string } }>(ENDPOINTS.uploads.avatar, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data),

  getClubMembers: () => api.get<{ data: User[] }>(ENDPOINTS.users.list).then((r) => r.data.data),

  updateUserRoles: (userId: string, input: UpdateRolesInput) =>
    api.put<{ data: User }>(ENDPOINTS.users.updateRoles(userId), input).then((r) => r.data.data),
};
