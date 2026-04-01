import { useMemo } from 'react';
import { UserRole } from '@tennis-club/shared';
import { useAuthStore } from '../stores/authStore';
import * as permissions from '../lib/permissions';

export function usePermissions() {
  const roles = useAuthStore((state) => state.roles);

  return useMemo(() => ({
    roles,
    hasRole: (role: UserRole) => permissions.hasRole(roles, role),
    hasAnyRole: (required: UserRole[]) => permissions.hasAnyRole(roles, required),
    isBoard: permissions.isBoard(roles),
    isAdmin: permissions.isAdmin(roles),
    isTrainer: permissions.isTrainer(roles),
    isTeamCaptain: permissions.isTeamCaptain(roles),
    canManageTeam: (isTeamCaptainForTeam: boolean) =>
      permissions.canManageTeam(roles, isTeamCaptainForTeam),
    canCreateTodo: permissions.canCreateTodo(roles),
    canCreateFolder: permissions.canCreateFolder(roles),
    permissionLevel: permissions.getHighestPermissionLevel(roles),
  }), [roles]);
}
