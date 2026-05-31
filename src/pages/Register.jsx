import { useState } from 'react';
import { authAPI } from '../api/auth';
import logo from '../assets/datarefine_logo.svg';
import { useTranslation } from '../i18n/index';

function Register({ onLogin }) {
  const { t, language, setLanguage } = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.register(username, email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t('register.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const LangToggle = () => (
    <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5">
      {['fr', 'en'].map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide transition ${
            language === lang
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111318] flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200/60 dark:border-white/[0.06] shadow-xl p-8 w-full max-w-sm text-center">
          <LangToggle />

          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="DataRefine" className="h-10 w-10" />
            <p className="text-base font-bold tracking-tight mt-2">
              <span className="text-teal-500">Data</span>
              <span className="text-gray-900 dark:text-white font-light">Refine</span>
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            {t('register.successTitle')}
          </h2>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 leading-relaxed">
            {t('register.successText')}{' '}
            <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>.{' '}
            {t('register.successText2')}
          </p>

          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-sm font-medium transition"
          >
            {t('register.goToLogin')}
          </a>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'username', label: t('register.username'), value: username, set: setUsername, type: 'text',     placeholder: t('register.usernamePlaceholder') },
    { key: 'email',    label: t('register.email'),    value: email,    set: setEmail,    type: 'email',    placeholder: t('register.emailPlaceholder') },
    { key: 'password', label: t('register.password'), value: password, set: setPassword, type: 'password', placeholder: t('register.passwordPlaceholder') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111318] flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200/60 dark:border-white/[0.06] shadow-xl p-8 w-full max-w-sm">
        <LangToggle />

        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <img src={logo} alt="DataRefine" className="h-10 w-10" />
          <p className="text-base font-bold tracking-tight mt-2">
            <span className="text-teal-500">Data</span>
            <span className="text-gray-900 dark:text-white font-light">Refine</span>
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-0.5">
            Smart Data Quality
          </p>
        </div>

        <h1 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {t('register.title')}
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {t('register.subtitle')}
        </p>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-4 bg-red-50 dark:bg-red-500/[0.08] text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-500/20">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111318] text-gray-900 dark:text-white text-sm placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition ${
              loading
                ? 'bg-teal-400/60 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('register.loading')}
              </span>
            ) : (
              t('register.submit')
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          {t('register.alreadyAccount')}{' '}
          <a href="/login" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">
            {t('register.login')}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;