import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { userService } from '../features/profile/services/userService';
import { useAuthStore } from '../stores/authStore';
import type { UpdateProfileInput, UpdateRolesInput } from '@tennis-club/shared';

interface ApiErrorResponse {
  error?: { message?: string };
}

function getErrorMessage(err: Error, fallback: string): string {
  const axiosErr = err as AxiosError<ApiErrorResponse>;
  return axiosErr.response?.data?.error?.message ?? fallback;
}

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const user = await userService.getProfile();
      setUser(user);
      return user;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => userService.updateProfile(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
    onError: (err: Error) => Alert.alert('Fehler', getErrorMessage(err, 'Profil konnte nicht aktualisiert werden')),
  });
}

export function useClubMembers() {
  return useQuery({
    queryKey: ['clubMembers'],
    queryFn: () => userService.getClubMembers(),
  });
}

export function useUpdateRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateRolesInput }) =>
      userService.updateUserRoles(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubMembers'] }),
    onError: (err: Error) => Alert.alert('Fehler', getErrorMessage(err, 'Rollen konnten nicht aktualisiert werden')),
  });
}
