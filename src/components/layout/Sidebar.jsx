import { Home, AlertTriangle, CheckCircle, Database, FileText, Settings, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';

function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: Home,          label: t('sidebar.dashboard'),   path: '/' },
    { icon: AlertTriangle, label: t('sidebar.anomalies'),   path: '/anomalies' },
    { icon: CheckCircle,   label: t('sidebar.corrections'), path: '/corrections' },
    { icon: Database,      label: t('sidebar.sources'),     path: '/sources' },
    { icon: FileText,      label: t('sidebar.reports'),     path: '/reports' },
    { icon: Settings,      label: t('sidebar.settings'),    path: '/settings' },
    ...(isAdmin ? [{ icon: Users, label: t('sidebar.userManagement') || 'Utilisateurs', path: '/users' }] : []),
  ];

  return (
    <aside className="w-56 bg-white dark:bg-[#111318] border-r border-gray-100 dark:border-white/[0.06] h-full flex flex-col">

      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-5 px-4 border-b border-gray-100 dark:border-white/[0.06]">
        <img
          src="/iliade-logo.png"
          alt="Iliade Consulting"
          className="h-10 w-auto object-contain mb-1.5"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <span className="text-xs font-medium text-gray-400 dark:text-white/40 tracking-widest uppercase">
          Iliade Consulting
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                active
                  ? 'bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-800 dark:hover:text-white/80'
              }`}
            >
              <item.icon
                size={15}
                className={`shrink-0 transition-colors ${
                  active
                    ? 'text-teal-500 dark:text-teal-400'
                    : 'text-gray-400 dark:text-white/30 group-hover:text-gray-600 dark:group-hover:text-white/60'
                }`}
              />
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-teal-500 dark:bg-teal-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User badge */}
      {user && (
        <div className="p-3 border-t border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.05] transition cursor-default">
            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold text-xs shrink-0">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 dark:text-white/80 truncate">{user.username}</p>
              <p className="text-[10px] text-gray-400 dark:text-white/30 truncate">
                {isAdmin ? '👑 Admin' : '👤 Consultant'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;