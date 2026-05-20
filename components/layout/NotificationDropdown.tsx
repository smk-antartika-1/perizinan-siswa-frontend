'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useAppContext();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const recent = notifications.slice(0, 5);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={20} className="text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {recent.length > 0 ? (
              recent.map(n => {
                const Icon = TYPE_ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setOpen(false);
                      if (n.permissionId) {
                        router.push(`/izin/${n.permissionId}`);
                      }
                    }}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors ${
                      !n.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[n.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-800' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{formatRelativeTime(n.timestamp)}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-sm text-blue-600 font-semibold hover:underline py-1"
            >
              Lihat Semua Notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
