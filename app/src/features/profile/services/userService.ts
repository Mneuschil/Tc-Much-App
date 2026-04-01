import api from '../../../lib/api';
import type { User } from '@tennis-club/shared';
import type { UpdateProfileInput, UpdateRolesInput } from '@tennis-club/shared';

export const userService = {
  getProfile: () =>
    api.get<{ data: User }>('/users/me').then(r => r.data.data),

  updateProfile: (input: UpdateProfileInput) =>
    api.put<{ data: User }>('/users/me', input).then(r => r.data.data),

  uploadAvatar: (formData: FormData) =>
    api.post<{ data: { url: string } }>('/uploads/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data),

  getClubMembers: () =>
    api.get<{ data: User[] }>('/users').then(r => r.data.data),

  updateUserRoles: (userId: string, input: UpdateRolesInput) =>
    api.put<{ data: User }>(`/users/${userId}/roles`, input).then(r => r.data.data),
};
