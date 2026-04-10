import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../features/profile/services/userService';
import { getErrorMessage } from '../utils/errorUtils';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import type { UpdateProfileInput, UpdateRolesInput } from '@tennis-club/shared';

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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => userService.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Profil aktualisiert');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Profil konnte nicht aktualisiert werden'), 'error'),
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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateRolesInput }) =>
      userService.updateUserRoles(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubMembers'] });
      showToast('Rollen aktualisiert');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Rollen konnten nicht aktualisiert werden'), 'error'),
  });
}
