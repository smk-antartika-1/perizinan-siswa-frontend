'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, Permission, UserRole } from '@/lib/types';
import { MOCK_USERS, MOCK_PERMISSIONS } from '@/lib/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string, expectedRole?: UserRole) => boolean;
  logout: () => void;
  register: (data: { name: string; nis: string; kelas: string; password: string }) => boolean;
  isAuthenticated: boolean;

  // Permissions
  permissions: Permission[];
  addPermission: (perm: Omit<Permission, 'id' | 'createdAt'>) => void;
  updatePermission: (id: string, updates: Partial<Permission>) => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(MOCK_PERMISSIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const login = useCallback((username: string, password: string, expectedRole?: UserRole) => {
    const user = users.find(u => {
      const matchUsername = u.username === username || u.name.toLowerCase() === username.toLowerCase() || u.nis === username;
      return matchUsername && u.password === password;
    });
    if (user) {
      // If an expected role is provided, ensure it matches
      if (expectedRole && user.role !== expectedRole) {
        return false;
      }
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const register = useCallback((data: { name: string; nis: string; kelas: string; password: string }) => {
    // Check if username/nis already exists
    if (users.some(u => u.username === data.nis)) {
      return false;
    }

    const newUser: User = {
      id: `u${Date.now()}`,
      name: data.name,
      role: UserRole.SISWA,
      email: `${data.nis}@sekolah.id`,
      username: data.nis,
      password: data.password,
      nis: data.nis,
      kelas: data.kelas,
    };

    setUsers(prev => [...prev, newUser]);
    return true;
  }, [users]);

  const addPermission = useCallback((perm: Omit<Permission, 'id' | 'createdAt'>) => {
    const newPerm: Permission = {
      ...perm,
      id: `P-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      createdAt: new Date().toISOString(),
    };
    setPermissions(prev => [newPerm, ...prev]);
  }, []);

  const updatePermission = useCallback((id: string, updates: Partial<Permission>) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      register,
      isAuthenticated: !!currentUser,
      permissions,
      addPermission,
      updatePermission,
      toasts,
      showToast,
      removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
