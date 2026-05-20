'use client';

import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAppContext } from '@/context/AppContext';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const TYPE_ICONS: Record<Notification['type'], typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
  success: 'bg-emerald-100 text-emerald-600',
  error: 'bg-red-100 text-red-600',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useAppContext();

  return (
    <AppShell>
      <div className="page-header">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Notifikasi</h1>
            <p className="page-subtitle">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi telah dibaca'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="btn-secondary text-sm"
            >
              <CheckCheck size={16} />
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl space-y-3">
        {notifications.length > 0 ? (
          notifications.map(n => {
            const Icon = TYPE_ICONS[n.type];
            return (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.permissionId) {
                    router.push(`/izin/${n.permissionId}`);
                  }
                }}
                className={`w-full card p-4 flex items-start gap-4 text-left hover:shadow-md transition-all ${
                  !n.read ? 'border-blue-200 bg-blue-50/30' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[n.type]}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${!n.read ? 'text-slate-800' : 'text-slate-600'}`}>
                      {n.title}
                    </p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-300 mt-2">{formatRelativeTime(n.timestamp)}</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <Bell size={36} className="opacity-30" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600">Tidak ada notifikasi</p>
              <p className="text-sm mt-1">Semua notifikasi akan ditampilkan di sini</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
