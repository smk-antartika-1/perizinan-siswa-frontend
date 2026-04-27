'use client';

import { useAppContext } from '@/context/AppContext';
import { UserRole } from '@/lib/types';

export function useAuth() {
  const { currentUser, login, logout, register, isAuthenticated } = useAppContext();

  const hasRole = (...roles: UserRole[]) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  const canAccess = (allowedRoles: UserRole[]) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    return allowedRoles.includes(currentUser.role);
  };

  return { currentUser, login, logout, register, isAuthenticated, hasRole, canAccess };
}
