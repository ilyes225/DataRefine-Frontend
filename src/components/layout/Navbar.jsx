import { Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../i18n';
import logo from '../../assets/datarefine_logo.svg';

function Navbar({ onLogout, user }) {
  const { dark, toggleDark } = useTheme();
  const { t, lang, switchLang } = useTranslation();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DataRefine" style={{ height: '40px', width: '40px' }} />
          <div>
            <p className="text-lg font-bold tracking-tight">
              <span className="text-teal-400">Data</span>
              <span className="text-white font-light">Refine</span>
            </p>
            <p className="text-xs text-gray-400 tracking-widest">SMART DATA QUALITY</p>
          </div>
        </div>

        <div className="flex items-center gap-4">

          {/* ── TOGGLE LANGUE FR/EN ── */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => switchLang('fr')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                lang === 'fr'
                  ? 'bg-white dark:bg-gray-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => switchLang('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                lang === 'en'
                  ? 'bg-white dark:bg-gray-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* ── TOGGLE MODE NUIT ── */}
          <button
            onClick={toggleDark}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title={dark ? t('navbar.lightMode') : t('navbar.darkMode')}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'analyst'}</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
              <User size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;