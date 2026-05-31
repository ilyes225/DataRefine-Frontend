import { useState } from 'react';
import { authAPI } from '../api/auth';
import { useTranslation } from '../i18n';
import logo from '../assets/datarefine_logo.svg';

function Login({ onLogin }) {
  const { t, language, setLanguage } = useTranslation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [view, setView]         = useState('login');
  const [forgotEmail, setForgotEmail]         = useState('');
  const [resetToken, setResetToken]           = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage]                 = useState(null);
  const [generatedToken, setGeneratedToken]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch { setError(t('login.errorCredentials')); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setError(t('login.forgotEmailError')); return; }
    setLoading(true); setError(null);
    try {
      const res = await authAPI.forgotPassword(forgotEmail);
      setGeneratedToken(res.data.reset_token);
      setMessage(t('login.forgotMessage'));
      setView('reset');
    } catch { setError(t('login.forgotTokenError')); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!resetToken)                     { setError(t('login.resetTokenMissing'));    return; }
    if (!newPassword)                    { setError(t('login.resetPasswordMissing')); return; }
    if (newPassword !== confirmPassword) { setError(t('login.resetPasswordMismatch')); return; }
    setLoading(true); setError(null);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setMessage(t('login.resetSuccess'));
      setTimeout(() => { setView('login'); setMessage(null); setGeneratedToken(null); setResetToken(''); setNewPassword(''); setConfirmPassword(''); }, 2000);
    } catch (err) { setError(err.response?.data?.error || t('login.resetTokenMissing')); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 dark:focus:border-teal-400 transition";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-white/40 mb-1.5 uppercase tracking-wider";

  const LangToggle = () => (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5">
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

  const Logo = () => (
    <div className="flex flex-col items-center mb-8">
      <img src={logo} alt="DataRefine" className="h-10 w-10 mb-3" />
      <p className="text-lg font-semibold">
        <span className="text-teal-500 dark:text-teal-400">Data</span>
        <span className="text-gray-900 dark:text-white/80 font-light">Refine</span>
      </p>
      <p className="text-[10px] text-gray-400 dark:text-white/25 tracking-widest mt-0.5">SMART DATA QUALITY</p>
    </div>
  );

  const Card = ({ children, title, subtitle }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0f12] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + toggle alignés */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1" />
          <Logo />
          <div className="flex-1 flex justify-end pt-1">
            <LangToggle />
          </div>
        </div>
        {title && (
          <div className="mb-6 text-center">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400 dark:text-white/30 mt-0.5">{subtitle}</p>}
          </div>
        )}
        <div className="bg-white dark:bg-[#16181d] border border-gray-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );

  if (view === 'forgot') return (
    <Card title={t('login.forgotTitle')} subtitle={t('login.forgotSubtitle')}>
      {error   && <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>}
      {message && <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg px-3 py-2 mb-4">{message}</p>}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>{t('login.email')}</label>
          <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="votre@email.com" className={inputClass} />
        </div>
        <button onClick={handleForgotPassword} disabled={loading}
          className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition">
          {loading ? t('login.forgotLoading') : t('login.forgotSubmit')}
        </button>
        <button onClick={() => { setView('login'); setError(null); setMessage(null); }}
          className="w-full py-2.5 rounded-lg text-sm text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 transition">
          ← {t('login.backToLogin')}
        </button>
      </div>
    </Card>
  );

  if (view === 'reset') return (
    <Card title={t('login.resetTitle')} subtitle={t('login.resetSubtitle')}>
      {error   && <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>}
      {message && <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg px-3 py-2 mb-4">{message}</p>}
      {generatedToken && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">{t('login.devTokenLabel')}</p>
          <p className="font-mono text-xs text-amber-700 dark:text-amber-300 break-all select-all">{generatedToken}</p>
          <button onClick={() => navigator.clipboard.writeText(generatedToken)} className="mt-1.5 text-xs text-amber-500 hover:text-amber-700 underline">
            {t('login.devTokenCopy')}
          </button>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>{t('login.resetTokenLabel')}</label>
          <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder={t('login.resetTokenPlaceholder')} className={`${inputClass} font-mono`} />
        </div>
        <div>
          <label className={labelClass}>{t('login.resetNewPassword')}</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('login.resetConfirmPassword')}</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
        </div>
        <button onClick={handleResetPassword} disabled={loading}
          className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition">
          {loading ? t('login.resetLoading') : t('login.resetSubmit')}
        </button>
        <button onClick={() => { setView('login'); setError(null); setMessage(null); setGeneratedToken(null); }}
          className="w-full py-2.5 rounded-lg text-sm text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 transition">
          ← {t('login.backToLogin')}
        </button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0f12] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo + toggle */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1" />
          <Logo />
          <div className="flex-1 flex justify-end pt-1">
            <LangToggle />
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181d] border border-gray-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('login.subtitle')}</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mb-6">{t('login.subtitle')}</p>

          {error && <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>{t('login.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@gmail.com" className={inputClass} autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>{t('login.password')}</label>
                <button type="button" onClick={() => { setView('forgot'); setError(null); }}
                  className="text-[11px] text-teal-500 dark:text-teal-400 hover:underline">
                  {t('login.forgotPassword')}
                </button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={inputClass} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition mt-2">
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>

        {/* Test account */}
        <div className="mt-3 px-4 py-3 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl">
          <p className="text-[11px] font-medium text-gray-500 dark:text-white/30 mb-1">{t('login.testAccount')}</p>
          <p className="text-xs text-gray-400 dark:text-white/20 font-mono">admin@gmail.com · admin123</p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-white/20 mt-4">
          {t('login.noAccount')}{' '}
          <a href="/register" className="text-teal-500 dark:text-teal-400 hover:underline font-medium">{t('login.register')}</a>
        </p>
      </div>
    </div>
  );
}

export default Login;