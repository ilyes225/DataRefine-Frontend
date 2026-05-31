import { useState } from 'react';
import { Bell, BrainCircuit, Trash2, CheckCheck, Filter, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { useTranslation } from '../i18n';

function timeAgo(date, lang) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (lang === 'en') {
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const { t, lang } = useTranslation();
  const [filter, setFilter] = useState('all');

  const TYPE_CONFIG = {
    anomaly: {
      icon: AlertTriangle,
      iconCls:  'text-amber-500',
      bgCls:    'bg-amber-50 dark:bg-amber-500/10',
      badgeCls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20',
      label: t('notifications.filters.anomalies'),
    },
    ml: {
      icon: BrainCircuit,
      iconCls:  'text-emerald-500',
      bgCls:    'bg-emerald-50 dark:bg-emerald-500/10',
      badgeCls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
      label: t('notifications.filters.ml'),
    },
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread')  return !n.read;
    if (filter === 'anomaly') return n.type === 'anomaly';
    if (filter === 'ml')      return n.type === 'ml';
    return true;
  });

  const filterTabs = [
    { key: 'all',     label: t('notifications.filters.all') },
    { key: 'unread',  label: t('notifications.filters.unread') },
    { key: 'anomaly', label: t('notifications.filters.anomalies') },
    { key: 'ml',      label: t('notifications.filters.ml') },
  ];

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
              {t('notifications.title')}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} ${lang === 'en' ? `unread` : `non lue${unreadCount > 1 ? 's' : ''}`}`
                : lang === 'en' ? 'All caught up' : 'Tout est lu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
              {t('notifications.markAllRead')}
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              {t('notifications.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              filter === tab.key
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                : 'bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14]'
            }`}>
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('notifications.empty')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filter !== 'all'
              ? lang === 'en' ? 'Try another filter.' : 'Essayez un autre filtre.'
              : lang === 'en' ? 'You are all caught up!' : 'Vous êtes à jour !'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const cfg  = TYPE_CONFIG[notif.type];
            const Icon = cfg.icon;
            return (
              <div key={notif.id} onClick={() => markAsRead(notif.id)}
                className={`relative flex gap-3 p-4 rounded-xl border cursor-pointer transition-all group ${
                  notif.read
                    ? 'bg-white dark:bg-[#1a1d23] border-gray-200/80 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1]'
                    : 'bg-white dark:bg-[#1a1d23] border-teal-200 dark:border-teal-500/30 shadow-sm ring-1 ring-teal-100 dark:ring-teal-500/10'
                }`}>
                {!notif.read && <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-teal-500" />}

                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bgCls}`}>
                  <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${cfg.badgeCls}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                      {timeAgo(notif.time, lang)}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold mb-0.5 ${notif.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-mono">📁 {notif.dataset}</p>
                </div>

                <button onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}