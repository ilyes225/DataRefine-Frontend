import { useState, useEffect } from 'react';
import { correctionsAPI } from '../api/corrections';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';

function Corrections() {
  const { t } = useTranslation();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState(null);
  const [activeTab, setActiveTab]     = useState('pending');
  const [stats, setStats]             = useState({ pending: 0, approved: 0, rejected: 0 });
  const [manualModal, setManualModal] = useState(null);
  const [manualValue, setManualValue] = useState('');
  const [updating, setUpdating]       = useState(false);
  const [datasets, setDatasets]       = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [exporting, setExporting]     = useState(false);

  // ── Filtre source ──────────────────────────────────────────────
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => { fetchCorrections(); fetchDatasets(); }, []);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await correctionsAPI.getAll();
      const all = res.data;
      setCorrections(all);
      setStats({
        pending:  all.filter(c => c.status === 'pending').length,
        approved: all.filter(c => c.status === 'approved').length,
        rejected: all.filter(c => c.status === 'rejected').length,
      });
    } catch (error) { console.error('Erreur:', error); }
    finally { setLoading(false); }
  };

  const fetchDatasets = async () => {
    try {
      const res = await apiClient.get('/corrections/datasets');
      setDatasets(res.data);
      if (res.data.length > 0) setSelectedDataset(res.data[0].dataset_id);
    } catch (error) { console.error('Erreur datasets:', error); }
  };

  // ── Export SQL ─────────────────────────────────────────────────
  const handleExportSQL = async () => {
    if (!selectedDataset) return;
    setExporting(true);
    try {
      const res = await apiClient.get(`/corrections/export-sql/${selectedDataset}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      const disposition = res.headers['content-disposition'];
      let filename = 'corrections.sql';
      if (disposition && disposition.includes('filename=')) filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: t('corrections.export.successSQL') });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: t('corrections.export.errorSQL') });
      setTimeout(() => setMessage(null), 3000);
    } finally { setExporting(false); }
  };

  // ── Export fichier corrigé ─────────────────────────────────────
  const handleExport = async () => {
    if (!selectedDataset) return;
    setExporting(true);
    try {
      const res = await apiClient.get(`/corrections/export/${selectedDataset}`, { responseType: 'blob' });
      const contentType = res.headers['content-type'] || 'text/csv';
      const disposition = res.headers['content-disposition'];
      let filename = 'fichier_corrige.csv';
      if (disposition && disposition.includes('filename=')) filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
      else if (contentType.includes('spreadsheetml')) filename = 'fichier_corrige.xlsx';
      else if (contentType.includes('xml')) filename = 'fichier_corrige.xml';
      const blob = new Blob([res.data], { type: contentType });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: t('corrections.export.successFile') });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: t('corrections.export.errorFile') });
      setTimeout(() => setMessage(null), 3000);
    } finally { setExporting(false); }
  };

  // ── Helpers ────────────────────────────────────────────────────
  const getTypeColor = (type) => ({
    duplicate:     'bg-red-100 text-red-600',
    outlier:       'bg-orange-100 text-orange-600',
    missing_value: 'bg-yellow-100 text-yellow-600',
    format_error:  'bg-purple-100 text-purple-600',
  }[type] || 'bg-gray-100 text-gray-600');

  const getTypeLabel   = (type)   => t(`anomalies.types.${type}`)         || type   || '—';
  const getMethodLabel = (method) => t(`corrections.methods.${method}`)   || method || '—';

  const handleApprove = async (id) => {
    try {
      await correctionsAPI.approve(id);
      setMessage({ type: 'success', text: t('corrections.messages.approved') });
      fetchCorrections(); fetchDatasets();
    } catch { setMessage({ type: 'error', text: t('corrections.messages.errorApprove') }); }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReject = async (id) => {
    try {
      await correctionsAPI.reject(id);
      setMessage({ type: 'success', text: t('corrections.messages.rejected') });
      fetchCorrections();
    } catch { setMessage({ type: 'error', text: t('corrections.messages.errorReject') }); }
    setTimeout(() => setMessage(null), 3000);
  };

  const openManualModal  = (correction) => { setManualModal(correction); setManualValue(correction.suggested_value || ''); };
  const closeManualModal = () => { setManualModal(null); setManualValue(''); };

  const handleUpdateValue = async () => {
    if (!manualModal) return;
    setUpdating(true);
    try {
      await correctionsAPI.updateValue(manualModal.id, manualValue);
      setCorrections(prev => prev.map(c =>
        c.id === manualModal.id ? { ...c, suggested_value: manualValue, correction_method: 'manual' } : c
      ));
      setMessage({ type: 'success', text: t('corrections.messages.updated') });
      setTimeout(() => setMessage(null), 4000);
      closeManualModal();
    } catch {
      setMessage({ type: 'error', text: t('corrections.messages.errorUpdate') });
      setTimeout(() => setMessage(null), 3000);
    } finally { setUpdating(false); }
  };

  // ── Filtrage combiné : onglet (status) + source ────────────────
  const filteredCorrections = corrections.filter(c => {
    const matchTab    = c.status === activeTab;
    const matchSource = filterSource === 'all' || String(c.anomaly?.dataset_id) === String(filterSource);
    return matchTab && matchSource;
  });

  // Stats recalculées selon le filtre source actif
  const filteredStats = {
    pending:  corrections.filter(c => c.status === 'pending'  && (filterSource === 'all' || String(c.anomaly?.dataset_id) === String(filterSource))).length,
    approved: corrections.filter(c => c.status === 'approved' && (filterSource === 'all' || String(c.anomaly?.dataset_id) === String(filterSource))).length,
    rejected: corrections.filter(c => c.status === 'rejected' && (filterSource === 'all' || String(c.anomaly?.dataset_id) === String(filterSource))).length,
  };

  const getFormatIcon = (sourceType) => sourceType === 'excel' ? '📊' : sourceType === 'xml' ? '📄' : '📋';

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('corrections.title')}</h1>
        <button onClick={fetchCorrections} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
          {t('corrections.refresh')}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* ── Filtre par source ───────────────────────────────────── */}
      {datasets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              🗂️ {t('corrections.filter.sourceLabel') || 'Filtrer par source :'}
            </span>

            {/* Bouton "Toutes" */}
            <button
              onClick={() => setFilterSource('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                filterSource === 'all'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
              }`}
            >
              {t('corrections.filter.all') || 'Toutes les sources'}
            </button>

            {/* Un bouton par dataset */}
            {datasets.map(d => (
              <button
                key={d.dataset_id}
                onClick={() => setFilterSource(String(d.dataset_id))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  filterSource === String(d.dataset_id)
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
                }`}
              >
                {getFormatIcon(d.source_type)} {d.source_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Section Export ──────────────────────────────────────── */}
      {datasets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">{t('corrections.export.title')}</h2>
          <div className="flex items-center gap-3">
            <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {datasets.map(d => (
                <option key={d.dataset_id} value={d.dataset_id}>
                  {getFormatIcon(d.source_type)} {d.source_name} — {d.dataset_name}
                </option>
              ))}
            </select>
            {datasets.find(d => d.dataset_id == selectedDataset && ['postgresql', 'mysql'].includes(d.source_type)) && (
              <button onClick={handleExportSQL} disabled={exporting || !selectedDataset}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                {exporting ? t('corrections.export.exporting') : t('corrections.export.sqlButton')}
              </button>
            )}
            {datasets.find(d => d.dataset_id == selectedDataset && !['postgresql', 'mysql'].includes(d.source_type)) && (
              <button onClick={handleExport} disabled={exporting || !selectedDataset}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                {exporting ? t('corrections.export.exporting') : t('corrections.export.downloadButton')}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('corrections.export.onlyApproved')}</p>
        </div>
      )}

      {/* ── Stats tabs (recalculées avec le filtre source) ─────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { key: 'pending',  label: t('corrections.tabs.pending'),  value: filteredStats.pending,  color: 'text-orange-600' },
          { key: 'approved', label: t('corrections.tabs.approved'), value: filteredStats.approved, color: 'text-green-600' },
          { key: 'rejected', label: t('corrections.tabs.rejected'), value: filteredStats.rejected, color: 'text-red-600' },
        ].map(s => (
          <div key={s.key} onClick={() => setActiveTab(s.key)}
            className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border cursor-pointer transition text-center ${
              activeTab === s.key ? 'border-teal-400 ring-2 ring-teal-200' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Liste corrections ───────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredCorrections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-4xl mb-3">{activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '✅' : '🚫'}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {t(`corrections.empty.${activeTab}`)}
          </p>
          {activeTab === 'pending' && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('corrections.empty.pendingSub')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCorrections.map((correction) => (
            <div key={correction.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(correction.anomaly?.anomaly_type)}`}>
                      {getTypeLabel(correction.anomaly?.anomaly_type)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('corrections.card.field')} <strong className="text-gray-700 dark:text-gray-200">{correction.anomaly?.field_name || '—'}</strong>
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('corrections.card.method')} <strong className="text-gray-700 dark:text-gray-200">{getMethodLabel(correction.correction_method)}</strong>
                    </span>
                    {correction.correction_method === 'manual' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full">
                        {t('corrections.card.manual')}
                      </span>
                    )}
                    {/* Badge source sur chaque carte */}
                    {filterSource === 'all' && (() => {
                      const ds = datasets.find(d => String(d.dataset_id) === String(correction.anomaly?.dataset_id));
                      return ds ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                          {getFormatIcon(ds.source_type)} {ds.source_name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs font-medium text-red-600 mb-1">{t('corrections.card.original')}</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {correction.anomaly?.original_value || t('corrections.card.empty')}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs font-medium text-green-600 mb-1">{t('corrections.card.suggested')}</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{correction.suggested_value || '—'}</p>
                    </div>
                  </div>
                </div>

                {activeTab === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => handleApprove(correction.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
                      {t('corrections.card.approve')}
                    </button>
                    <button onClick={() => handleReject(correction.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
                      {t('corrections.card.reject')}
                    </button>
                    <button onClick={() => openManualModal(correction)} className="px-4 py-2 bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-100 transition text-sm font-medium">
                      {t('corrections.card.modify')}
                    </button>
                  </div>
                )}
                {activeTab === 'approved' && (
                  <span className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{t('corrections.card.approvedBadge')}</span>
                )}
                {activeTab === 'rejected' && (
                  <span className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">{t('corrections.card.rejectedBadge')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal correction manuelle ───────────────────────────── */}
      {manualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('corrections.modal.title')}</h2>
              <button onClick={closeManualModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none">×</button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('corrections.modal.fieldLabel')}</span>
                <strong className="text-gray-800 dark:text-white">{manualModal.anomaly?.field_name || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('corrections.modal.typeLabel')}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(manualModal.anomaly?.anomaly_type)}`}>
                  {getTypeLabel(manualModal.anomaly?.anomaly_type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('corrections.modal.originalLabel')}</span>
                <strong className="text-red-600 font-mono">{manualModal.anomaly?.original_value || t('corrections.card.empty')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('corrections.modal.suggestionLabel')}</span>
                <strong className="text-green-600 font-mono">{manualModal.suggested_value || '—'}</strong>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('corrections.modal.newValueLabel')}
              </label>
              <input type="text" value={manualValue} onChange={(e) => setManualValue(e.target.value)}
                placeholder={t('corrections.modal.newValuePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                autoFocus onKeyDown={(e) => e.key === 'Enter' && handleUpdateValue()} />
              <p className="text-xs text-gray-400 mt-1">{t('corrections.modal.hint')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeManualModal} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">
                {t('corrections.modal.cancel')}
              </button>
              <button onClick={handleUpdateValue} disabled={updating || !manualValue.trim()}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium disabled:opacity-50">
                {updating ? t('corrections.modal.loading') : t('corrections.modal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Corrections;