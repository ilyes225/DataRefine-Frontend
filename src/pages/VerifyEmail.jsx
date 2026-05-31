import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import apiClient from '../api/client';
import logo from '../assets/datarefine_logo.svg';
import { useTranslation } from '../i18n/index';

export default function VerifyEmail() {
  const { t, language, setLanguage } = useTranslation();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmail.errorTokenMissing'));
      return;
    }

    apiClient.get('/auth/verify-email', { params: { token } })
      .then(res => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || t('verifyEmail.errorDefault'));
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#111318] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header : logo + toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="DataRefine" className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
              Data<span className="text-teal-500 font-light">Refine</span>
            </span>
          </div>

          {/* Lang toggle */}
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
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1a1d23] border border-gray-200/80 dark:border-white/[0.06] rounded-2xl p-8 text-center shadow-sm">

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {t('verifyEmail.loadingTitle')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('verifyEmail.loadingSubtitle')}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-teal-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('verifyEmail.successTitle')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed max-w-[220px] mx-auto">
                  {message || t('verifyEmail.successText')}
                </p>
              </div>
              <a
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t('verifyEmail.successButton')}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('verifyEmail.errorTitle')}
                </p>
                <p className="text-xs text-red-400 mt-1.5 leading-relaxed max-w-[220px] mx-auto">
                  {message}
                </p>
              </div>
              <a
                href="/register"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t('verifyEmail.retryButton')}
              </a>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          DataRefine · Smart Data Quality
        </p>
      </div>
    </div>
  );
}