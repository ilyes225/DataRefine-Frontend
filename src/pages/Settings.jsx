import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';

const SETTING_ICONS = {
  duplicate_threshold:  '🔁',
  outlier_contamination: '📊',
  missing_threshold:    '❓',
  email_validation:     '📧',
  phone_validation:     '📞',
  date_validation:      '📅',
};

export default function Settings() {
  const { t, lang, switchLang } = useTranslation();

  const [settings, setSettings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState({});
  const [resetting, setResetting] = useState(false);
  const [edited, setEdited]     = useState({});
  const [toast, setToast]       = useState(null);
  const [errors, setErrors]     = useState({});

  // Account Management state
  const [changePwd, setChangePwd] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changePwdError, setChangePwdError] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    } catch {
      showToast(t('settings.loadError'), 'error');
    } finally {
      setLoading(false);
    }
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
    } catch {
      showToast(t('settings.saveError'), 'error');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t('settings.resetConfirm'))) return;
    try {
      setResetting(true);
      await apiClient.post('/settings/reset');
      showToast(t('settings.resetSuccess'));
      fetchSettings();
    } catch {
      showToast(t('settings.resetError'), 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleChangePassword = async () => {
    setChangePwdError('');
    const { current_password, new_password, confirm_password } = changePwd;

    if (!current_password || !new_password || !confirm_password) {
      setChangePwdError(t('settings.account.errorRequired'));
      return;
    }
    if (new_password.length < 6) {
      setChangePwdError(t('settings.account.errorMinLength'));
      return;
    }
    if (new_password !== confirm_password) {
      setChangePwdError(t('settings.account.errorMismatch'));
      return;
    }

    try {
      setChangePwdLoading(true);
      await apiClient.put('/auth/change-password', { current_password, new_password });
      showToast(t('settings.saveSuccess'));
      setChangePwd({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setChangePwdError(err.response?.data?.error || t('settings.account.errorChange'));
    } finally {
      setChangePwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError(t('settings.account.errorRequired'));
      return;
    }
    try {
      setDeleteLoading(true);
      await apiClient.delete('/auth/delete-account', { data: { password: deletePassword } });
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.error || t('settings.account.errorDelete'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasChanges = (key) => {
    const original = settings.find(s => s.key === key);
    return original && edited[key] !== original.value;
  };

  const numericSettings = settings.filter(s => s.type === 'int' || s.type === 'float');
  const boolSettings    = settings.filter(s => s.type === 'bool');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
        </div>
        <button onClick={handleReset} disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition disabled:opacity-50">
          {resetting ? <span className="animate-spin">↺</span> : '↺'} {t('settings.resetAll')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Sélecteur de langue ── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full text-sm font-bold">
                🌐 {t('settings.languageSection')}
              </span>
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex gap-3">
                <button onClick={() => switchLang('fr')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium border transition ${
                    lang === 'fr'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}>
                  🇫🇷 Français
                </button>
                <button onClick={() => switchLang('en')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium border transition ${
                    lang === 'en'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}>
                  🇬🇧 English
                </button>
              </div>
            </div>
          </section>

          {/* ── Seuils numériques ── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold">
                {t('settings.numericSection')}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {numericSettings.map(setting => (
                <div key={setting.key}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 transition ${
                    hasChanges(setting.key) ? 'border-blue-300 dark:border-blue-600' : 'border-gray-100 dark:border-gray-700'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{SETTING_ICONS[setting.key] || '🔧'}</span>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{t(`settings.labels.${setting.key}`)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                          setting.type === 'int' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {setting.type}
                        </span>
                      </div>
                    </div>
                    {hasChanges(setting.key) && <span className="text-xs text-blue-500 font-medium">{t('settings.modified')}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    {t(`settings.descriptions.${setting.key}`)}
                  </p>
                  <div className="space-y-2">
                    <input type="number" value={edited[setting.key] ?? setting.value}
                      onChange={e => handleChange(setting.key, e.target.value, setting.type)}
                      step={setting.type === 'float' ? '0.01' : '1'} min="0" max={setting.type === 'float' ? '1' : '100'}
                      className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition ${
                        errors[setting.key] ? 'border-red-400 bg-red-50' : 'border-gray-200 dark:border-gray-600'
                      }`} />
                    {errors[setting.key] && <p className="text-xs text-red-500">{errors[setting.key]}</p>}
                    <button onClick={() => handleSave(setting.key, setting.type)}
                      disabled={saving[setting.key] || !!errors[setting.key]}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50">
                      {saving[setting.key] ? t('settings.saving') : t('settings.save')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Validations booléennes ── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-bold">
                {t('settings.boolSection')}
              </span>
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
              {boolSettings.map((setting) => {
                const isEnabled = (edited[setting.key] ?? setting.value) === 'true';
                return (
                  <div key={setting.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{SETTING_ICONS[setting.key] || '✅'}</span>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t(`settings.labels.${setting.key}`)}</p>
                        <p className="text-xs text-gray-400">{t(`settings.descriptions.${setting.key}`)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasChanges(setting.key) && <span className="text-xs text-blue-500 font-medium">{t('settings.modified')}</span>}
                      <button
                        onClick={() => {
                          const newVal = isEnabled ? 'false' : 'true';
                          handleChange(setting.key, newVal, 'bool');
                          setTimeout(() => handleSave(setting.key, 'bool'), 100);
                        }}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                          isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                          isEnabled ? 'translate-x-8' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Gestion du compte ── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-bold">
                👤 {t('settings.account.sectionTitle')}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Changement de mot de passe */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔑</span>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('settings.account.changePasswordTitle')}</h3>
                </div>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder={t('settings.account.currentPassword')}
                    value={changePwd.current_password}
                    onChange={e => setChangePwd(prev => ({ ...prev, current_password: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <input
                    type="password"
                    placeholder={t('settings.account.newPassword')}
                    value={changePwd.new_password}
                    onChange={e => setChangePwd(prev => ({ ...prev, new_password: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <input
                    type="password"
                    placeholder={t('settings.account.confirmPassword')}
                    value={changePwd.confirm_password}
                    onChange={e => setChangePwd(prev => ({ ...prev, confirm_password: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {changePwdError && (
                    <p className="text-xs text-red-500">{changePwdError}</p>
                  )}
                  <button
                    onClick={handleChangePassword}
                    disabled={changePwdLoading}
                    className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition disabled:opacity-50">
                    {changePwdLoading ? t('settings.account.updating') : t('settings.account.updateButton')}
                  </button>
                </div>
              </div>

              {/* Suppression de compte */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/40 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🗑️</span>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">{t('settings.account.deleteTitle')}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {t('settings.account.deleteWarning')}
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition">
                    {t('settings.account.deleteButton')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {t('settings.account.deleteConfirmLabel')}
                    </p>
                    <input
                      type="password"
                      placeholder={t('settings.account.deletePasswordPlaceholder')}
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className="w-full border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    {deleteError && (
                      <p className="text-xs text-red-500">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                        className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        {t('settings.account.cancelButton')}
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50">
                        {deleteLoading ? t('settings.account.deleting') : t('settings.account.confirmDeleteButton')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* ── Info ── */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex gap-4">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">{t('settings.infoTitle')}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">{t('settings.infoText')}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}