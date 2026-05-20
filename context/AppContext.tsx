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

  // Users CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Global Student Modal
  activeStudentNis: string | null;
  viewStudent: (nis: string | null) => void;

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
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(MOCK_PERMISSIONS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeStudentNis, setActiveStudentNis] = useState<string | null>(null);

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

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: `u-${Math.random().toString(36).substring(2, 9)}`,
    };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const viewStudent = useCallback((nis: string | null) => {
    setActiveStudentNis(nis);
  }, []);

  const addPermission = useCallback((perm: Omit<Permission, 'id' | 'createdAt'>) => {
    const newId = `P-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const nowStr = new Date().toISOString();
    const newPerm: Permission = {
      ...perm,
      id: newId,
      createdAt: nowStr,
      comments: [],
      auditLog: [
        { id: `a-${Math.random().toString(36).substring(2, 9)}`, action: 'Diajukan', actorName: perm.studentName, actorRole: UserRole.SISWA, timestamp: nowStr }
      ]
    };
    setPermissions(prev => [newPerm, ...prev]);

    // Automatically trigger notification for Wali Kelas
    const matchedStudent = users.find(u => u.id === perm.studentId || u.name === perm.studentName);
    const notification: Notification = {
      id: `n-${Math.random().toString(36).substring(2, 9)}`,
      title: 'Pengajuan Izin Baru',
      message: `${perm.studentName} mengajukan izin baru untuk keperluan: "${perm.reason}"`,
      timestamp: nowStr,
      read: false,
      type: 'info',
      permissionId: newId
    };
    setNotifications(prev => [notification, ...prev]);
  }, [users]);

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
      addUser,
      updateUser,
      deleteUser,
      activeStudentNis,
      viewStudent,
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
