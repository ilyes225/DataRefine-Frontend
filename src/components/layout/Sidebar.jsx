import { Home, AlertTriangle, CheckCircle, Database, FileText, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';

function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { icon: Home,          label: t('sidebar.dashboard'),    path: '/' },
    { icon: AlertTriangle, label: t('sidebar.anomalies'),    path: '/anomalies' },
    { icon: CheckCircle,   label: t('sidebar.corrections'),  path: '/corrections' },
    { icon: Database,      label: t('sidebar.sources'),      path: '/sources' },
    { icon: FileText,      label: t('sidebar.reports'),      path: '/reports' },
    { icon: Settings,      label: t('sidebar.settings'),     path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">

      {/* ── LOGO ILIADE CONSULTING ── */}
      <div className="flex flex-col items-center justify-center py-6 px-4 border-b border-gray-100 dark:border-gray-700">
        <img
          src="/iliade-logo.png"
          alt="Iliade Consulting"
          className="h-12 w-auto object-contain mb-2"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
          Iliade Consulting
        </span>
      </div>

      {/* ── MENU ── */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === item.path
                ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
