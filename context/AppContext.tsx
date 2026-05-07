'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, Permission, Notification, UserRole } from '@/lib/types';
import { MOCK_USERS, MOCK_PERMISSIONS, MOCK_NOTIFICATIONS } from '@/lib/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;

  // Permissions
  permissions: Permission[];
  addPermission: (perm: Omit<Permission, 'id' | 'createdAt'>) => void;
  updatePermission: (id: string, updates: Partial<Permission>) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(MOCK_PERMISSIONS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const login = useCallback((username: string, password: string) => {
    const user = users.find(u => {
      const matchUsername = u.username === username || u.nis === username;
      return matchUsername && u.password === password;
    });
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

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

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
      isAuthenticated: !!currentUser,
      permissions,
      addPermission,
      updatePermission,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
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
