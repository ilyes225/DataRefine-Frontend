import { Bell, LogOut, Sun, Moon, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../i18n';
import logo from '../../assets/datarefine_logo.svg';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';

function Navbar({ onLogout, user, onToggleTeam }) {
  const { dark, toggleDark } = useTheme();
  const { t, lang, switchLang } = useTranslation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <nav className="bg-white dark:bg-[#111318] border-b border-gray-100 dark:border-white/[0.06] px-5 flex items-center justify-between h-14 shrink-0">

      {/* Left */}
      <div className="flex items-center gap-2.5">
        <img src={logo} alt="DataRefine" className="h-7 w-7" />
        <div>
          <p className="text-sm font-semibold leading-none">
            <span className="text-teal-500 dark:text-teal-400">Data</span>
            <span className="text-gray-800 dark:text-white/80 font-light">Refine</span>
          </p>
          <p className="text-[9px] text-gray-400 dark:text-white/25 tracking-widest mt-0.5">SMART DATA QUALITY</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">

        {/* Lang */}
        <div className="flex items-center bg-gray-100 dark:bg-white/[0.05] rounded-lg p-0.5 mr-2">
          {['fr', 'en'].map(l => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                lang === l
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="p-2 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Team */}
        {user?.role === 'consultant' && (
          <button
            onClick={onToggleTeam}
            className="p-2 text-gray-400 dark:text-white/30 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition"
            title="Mon équipe"
          >
            <Users size={16} />
          </button>
        )}

        <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.08] mx-2" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700 dark:text-white/70 leading-none">{user?.username || 'User'}</p>
            <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">{user?.role || 'consultant'}</p>
          </div>
          <div className="w-7 h-7 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold text-xs">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="ml-1 p-2 text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;