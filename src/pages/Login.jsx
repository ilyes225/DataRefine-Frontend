import { useState } from 'react';
import { authAPI } from '../api/auth';
import { useTranslation } from '../i18n';
import logo from '../assets/datarefine_logo.svg';

function Login({ onLogin }) {
  const { t } = useTranslation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const [view, setView]                   = useState('login');
  const [forgotEmail, setForgotEmail]     = useState('');
  const [resetToken, setResetToken]       = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage]             = useState(null);
  const [generatedToken, setGeneratedToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch {
      setError(t('login.errorCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setError(t('login.forgotEmailError')); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.forgotPassword(forgotEmail);
      setGeneratedToken(res.data.reset_token);
      setMessage(t('login.forgotMessage'));
      setView('reset');
    } catch {
      setError(t('login.forgotTokenError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken)                        { setError(t('login.resetTokenMissing'));    return; }
    if (!newPassword)                       { setError(t('login.resetPasswordMissing')); return; }
    if (newPassword !== confirmPassword)    { setError(t('login.resetPasswordMismatch')); return; }
    setLoading(true);
    setError(null);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setMessage(t('login.resetSuccess'));
      setTimeout(() => {
        setView('login');
        setMessage(null);
        setGeneratedToken(null);
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || t('login.resetTokenMissing'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const Logo = () => (
    <div className="flex flex-col items-center mb-4">
      <img src={logo} alt="DataRefine" style={{ height: '50px', width: '50px' }} />
      <p className="text-xl font-bold tracking-tight mt-2">
        <span className="text-teal-500">Data</span>
        <span className="text-gray-900 font-light">Refine</span>
      </p>
      <p className="text-xs text-gray-400 tracking-widest">SMART DATA QUALITY</p>
    </div>
  );

  // ── VUE FORGOT PASSWORD ──────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-bold text-gray-900">{t('login.forgotTitle')}</h1>
            <p className="text-gray-500 mt-1">{t('login.forgotSubtitle')}</p>
          </div>

          {error   && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">❌ {error}</div>}
          {message && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">✅ {message}</div>}

          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t('login.email')}</label>
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                placeholder="votre@email.com" className={inputClass} />
            </div>
            <button onClick={handleForgotPassword} disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium transition ${loading ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
              {loading ? t('login.forgotLoading') : t('login.forgotSubmit')}
            </button>
            <button onClick={() => { setView('login'); setError(null); setMessage(null); }}
              className="w-full py-3 rounded-lg text-gray-600 font-medium border border-gray-200 hover:bg-gray-50 transition">
              {t('login.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VUE RESET PASSWORD ───────────────────────────────────────────
  if (view === 'reset') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-bold text-gray-900">{t('login.resetTitle')}</h1>
            <p className="text-gray-500 mt-1">{t('login.resetSubtitle')}</p>
          </div>

          {error   && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">❌ {error}</div>}
          {message && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">✅ {message}</div>}

          {generatedToken && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
              <p className="text-xs text-yellow-700 font-medium mb-1">{t('login.devTokenLabel')}</p>
              <p className="font-mono text-sm text-yellow-800 break-all select-all">{generatedToken}</p>
              <button onClick={() => navigator.clipboard.writeText(generatedToken)}
                className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline">
                {t('login.devTokenCopy')}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t('login.resetTokenLabel')}</label>
              <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)}
                placeholder={t('login.resetTokenPlaceholder')} className={`${inputClass} font-mono text-sm`} />
            </div>
            <div>
              <label className={labelClass}>{t('login.resetNewPassword')}</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('login.resetConfirmPassword')}</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" className={inputClass} />
            </div>
            <button onClick={handleResetPassword} disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium transition ${loading ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
              {loading ? t('login.resetLoading') : t('login.resetSubmit')}
            </button>
            <button onClick={() => { setView('login'); setError(null); setMessage(null); setGeneratedToken(null); }}
              className="w-full py-3 rounded-lg text-gray-600 font-medium border border-gray-200 hover:bg-gray-50 transition">
              {t('login.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VUE LOGIN PRINCIPALE ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <p className="text-gray-500 mt-1">{t('login.subtitle')}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">❌ {error}</div>}

        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t('login.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@gmail.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('login.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={inputClass} />
          </div>
          <div className="flex justify-end">
            <button onClick={() => { setView('forgot'); setError(null); }}
              className="text-sm text-teal-600 hover:underline">
              {t('login.forgotPassword')}
            </button>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-medium transition ${loading ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </div>

        <div className="mt-6 p-3 bg-teal-50 rounded-lg text-sm text-teal-700">
          <p className="font-medium">{t('login.testAccount')}</p>
          <p>Email : admin@gmail.com</p>
          <p>Password : admin123</p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('login.noAccount')}{' '}
          <a href="/register" className="text-teal-600 hover:underline font-medium">{t('login.register')}</a>
        </p>
      </div>
    </div>
  );
}

export default Login;