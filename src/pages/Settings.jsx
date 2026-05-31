import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';

const SETTING_ICONS = {
  duplicate_threshold:   '🔁',
  outlier_contamination: '📈',
  missing_threshold:     '❓',
  email_validation:      '📧',
  phone_validation:      '📞',
  date_validation:       '📅',
};

export default function Settings() {
  const { t, lang, switchLang } = useTranslation();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';

  const [settings, setSettings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState({});
  const [resetting, setResetting] = useState(false);
  const [edited, setEdited]       = useState({});
  const [toast, setToast]         = useState(null);
  const [errors, setErrors]       = useState({});

  const [changePwd, setChangePwd]               = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changePwdError, setChangePwdError]     = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const [deletePassword, setDeletePassword]         = useState('');
  const [deleteError, setDeleteError]               = useState('');
  const [deleteLoading, setDeleteLoading]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/settings/');
      setSettings(res.data);
      const initial = {};
      res.data.forEach(s => { initial[s.key] = s.value; });
      setEdited(initial);
      setErrors({});
    } catch { showToast(t('settings.loadError'), 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const validate = (key, value, type) => {
    if (type === 'int')   { const n = parseInt(value);   if (isNaN(n) || n < 0 || n > 100) return t('settings.intError'); }
    if (type === 'float') { const f = parseFloat(value); if (isNaN(f) || f < 0 || f > 1)   return t('settings.floatError'); }
    if (type === 'bool')  { if (value !== 'true' && value !== 'false') return t('settings.boolError'); }
    return null;
  };

  const handleChange = (key, value, type) => {
    setEdited(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: validate(key, value, type) }));
  };

  const handleSave = async (key, type) => {
    const value = edited[key];
    const err = validate(key, value, type);
    if (err) { setErrors(prev => ({ ...prev, [key]: err })); return; }
    try {
      setSaving(prev => ({ ...prev, [key]: true }));
      await apiClient.put(`/settings/${key}`, { value });
      showToast(t('settings.saveSuccess'));
      fetchSettings();
    } catch { showToast(t('settings.saveError'), 'error'); }
    finally { setSaving(prev => ({ ...prev, [key]: false })); }
  };

  const handleReset = async () => {
    if (!window.confirm(t('settings.resetConfirm'))) return;
    try {
      setResetting(true);
      await apiClient.post('/settings/reset');
      showToast(t('settings.resetSuccess'));
      fetchSettings();
    } catch { showToast(t('settings.resetError'), 'error'); }
    finally { setResetting(false); }
  };

  const handleChangePassword = async () => {
    setChangePwdError('');
    const { current_password, new_password, confirm_password } = changePwd;
    if (!current_password || !new_password || !confirm_password) { setChangePwdError(t('settings.account.errorRequired')); return; }
    if (new_password.length < 6)           { setChangePwdError(t('settings.account.errorMinLength')); return; }
    if (new_password !== confirm_password) { setChangePwdError(t('settings.account.errorMismatch')); return; }
    try {
      setChangePwdLoading(true);
      await apiClient.put('/auth/change-password', { current_password, new_password });
      showToast(t('settings.saveSuccess'));
      setChangePwd({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { setChangePwdError(err.response?.data?.error || t('settings.account.errorChange')); }
    finally { setChangePwdLoading(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError(t('settings.account.errorRequired')); return; }
    try {
      setDeleteLoading(true);
      await apiClient.delete('/auth/delete-account', { data: { password: deletePassword } });
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (err) { setDeleteError(err.response?.data?.error || t('settings.account.errorDelete')); }
    finally { setDeleteLoading(false); }
  };

  const hasChanges = (key) => {
    const original = settings.find(s => s.key === key);
    return original && edited[key] !== original.value;
  };

  const numericSettings = settings.filter(s => s.type === 'int' || s.type === 'float');
  const boolSettings    = settings.filter(s => s.type === 'bool');

  const inputBase = "w-full px-3 py-1.5 rounded-lg border bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors placeholder-gray-400 dark:placeholder-gray-600";

  return (
    <div className="max-w-4xl space-y-8">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-[#1a1d23] text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
            : 'bg-red-50 dark:bg-[#1a1d23] text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{t('settings.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1d23] text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('settings.resetAll')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg className="animate-spin w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm text-gray-400 dark:text-gray-500">Loading settings…</span>
        </div>
      ) : (
        <div className="space-y-8">

        {isAdmin && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-teal-50/50 dark:bg-teal-500/[0.04] border-teal-100 dark:border-teal-500/10">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-0.5">{t('settings.infoTitle')}</p>
            <p className="text-xs text-teal-600/80 dark:text-teal-400/80 leading-relaxed">{t('settings.infoText')}</p>
          </div>
        </div>
)}

          {/* Langue */}
          <section>
            <SectionTitle icon="🌐" label={t('settings.languageSection')} />
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {[{ code: 'fr', flag: '🇫🇷', label: 'Français' }, { code: 'en', flag: '🇬🇧', label: 'English' }].map(l => (
                <button
                  key={l.code}
                  onClick={() => switchLang(l.code)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    lang === l.code
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-sm'
                      : 'bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14]'
                  }`}
                >
                  <span>{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          </section>

          {/* Seuils numériques — Admin only */}
          {isAdmin && (
            <section>
              <SectionTitle icon="📐" label={t('settings.numericSection')} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {numericSettings.map(setting => (
                  <div
                    key={setting.key}
                    className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-4 hover:border-gray-300 dark:hover:border-white/[0.1] transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-lg bg-gray-50 dark:bg-white/[0.04] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/[0.04]">
                        {SETTING_ICONS[setting.key] || '🔧'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {t(`settings.labels.${setting.key}`)}
                          </p>
                          {hasChanges(setting.key) && (
                            <span className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-medium">
                              {t('settings.modified')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                          {t(`settings.descriptions.${setting.key}`)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={edited[setting.key] ?? setting.value}
                          onChange={e => handleChange(setting.key, e.target.value, setting.type)}
                          step={setting.type === 'float' ? '0.01' : '1'} min="0" max={setting.type === 'float' ? '1' : '100'}
                          className={`${inputBase} ${errors[setting.key] ? 'border-red-400 dark:border-red-500/50' : 'border-gray-200 dark:border-white/[0.08]'}`}
                        />
                        {errors[setting.key] && <p className="text-xs text-red-500 mt-1.5 px-1">{errors[setting.key]}</p>}
                      </div>
                      <button
                        onClick={() => handleSave(setting.key, setting.type)}
                        disabled={saving[setting.key] || !!errors[setting.key] || !hasChanges(setting.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          hasChanges(setting.key) && !errors[setting.key]
                            ? 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {saving[setting.key] ? t('settings.saving') : t('settings.save')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Validations booléennes — Admin only */}
          {isAdmin && (
            <section>
              <SectionTitle icon="✓" label={t('settings.boolSection')} />
              <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] divide-y divide-gray-50 dark:divide-white/[0.04]">
                {boolSettings.map(setting => {
                  const isEnabled = (edited[setting.key] ?? setting.value) === 'true';
                  return (
                    <div key={setting.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-gray-400">{SETTING_ICONS[setting.key] || '⚡'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t(`settings.labels.${setting.key}`)}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t(`settings.descriptions.${setting.key}`)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-4">
                        {hasChanges(setting.key) && (
                          <span className="text-[10px] uppercase tracking-wider text-teal-500 font-medium hidden sm:block">{t('settings.modified')}</span>
                        )}
                        <button
                          onClick={() => {
                            const newVal = isEnabled ? 'false' : 'true';
                            handleChange(setting.key, newVal, 'bool');
                            setTimeout(() => handleSave(setting.key, 'bool'), 100);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            isEnabled ? 'bg-teal-500' : 'bg-gray-200 dark:bg-white/[0.1]'
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                            isEnabled ? 'translate-x-4.5' : 'translate-x-1'
                          }`} style={{ transform: isEnabled ? 'translateX(18px)' : 'translateX(2px)' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Gestion du compte */}
          <section>
            <SectionTitle icon="👤" label={t('settings.account.sectionTitle')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Changement mot de passe */}
              <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400">🔑</span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.account.changePasswordTitle')}</h3>
                </div>
                <div className="space-y-3">
                  {['current_password', 'new_password', 'confirm_password'].map(field => (
                    <input
                      key={field}
                      type="password"
                      placeholder={t(`settings.account.${field === 'current_password' ? 'currentPassword' : field === 'new_password' ? 'newPassword' : 'confirmPassword'}`)}
                      value={changePwd[field]}
                      onChange={e => setChangePwd(prev => ({ ...prev, [field]: e.target.value }))}
                      className={`${inputBase} border-gray-200 dark:border-white/[0.08]`}
                    />
                  ))}
                  {changePwdError && <p className="text-xs text-red-500 px-1">{changePwdError}</p>}
                  <button
                    onClick={handleChangePassword}
                    disabled={changePwdLoading || !changePwd.current_password}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                      changePwd.current_password
                        ? 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {changePwdLoading ? t('settings.account.updating') : t('settings.account.updateButton')}
                  </button>
                </div>
              </div>

              {/* Suppression compte */}
              <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-red-100 dark:border-red-500/20 p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-50 dark:border-red-500/10">
                  <span className="text-red-400">🗑️</span>
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">{t('settings.account.deleteTitle')}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{t('settings.account.deleteWarning')}</p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.08] text-xs font-medium transition-colors"
                  >
                    {t('settings.account.deleteButton')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder={t('settings.account.deletePasswordPlaceholder')}
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className={`${inputBase} border-red-200 focus:border-red-500 focus:ring-red-500 dark:border-red-500/30 dark:focus:border-red-500`}
                    />
                    {deleteError && <p className="text-xs text-red-500 px-1">{deleteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                        className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        {t('settings.account.cancelButton')}
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || !deletePassword}
                        className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {deleteLoading ? t('settings.account.deleting') : t('settings.account.confirmDeleteButton')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

// Composant titre minimaliste au style Notion
function SectionTitle({ icon, label }) {
  return (
    <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4 px-1">
      <span className="text-gray-400 dark:text-gray-500 text-base">{icon}</span>
      {label}
    </h2>
  );
}