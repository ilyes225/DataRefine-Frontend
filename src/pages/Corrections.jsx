import { useState, useEffect } from 'react';
import { correctionsAPI } from '../api/corrections';
import { sourcesAPI } from '../api/sources';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';

function Corrections() {
  const { t } = useTranslation();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState(null);
  const [activeTab, setActiveTab]     = useState('pending');
  const [manualModal, setManualModal] = useState(null);
  const [manualValue, setManualValue] = useState('');
  const [updating, setUpdating]       = useState(false);
  const [datasets, setDatasets]       = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [exporting, setExporting]     = useState(false);
  const [sources, setSources]         = useState([]);
  const [filterSource, setFilterSource] = useState('all');
  // commentaire inline : { [correctionId]: string }
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    fetchCorrections();
    fetchDatasets();
    sourcesAPI.getAll()
      .then(res => setSources(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSources([]));
  }, []);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await correctionsAPI.getAll();
      setCorrections(res.data);
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

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

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
      if (disposition?.includes('filename=')) filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
      link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      showMsg('success', t('corrections.export.successSQL'));
    } catch { showMsg('error', t('corrections.export.errorSQL')); }
    finally { setExporting(false); }
  };

  const handleExport = async () => {
    if (!selectedDataset) return;
    setExporting(true);
    try {
      const res = await apiClient.get(`/corrections/export/${selectedDataset}`, { responseType: 'blob' });
      const contentType = res.headers['content-type'] || 'text/csv';
      const disposition = res.headers['content-disposition'];
      let filename = 'fichier_corrige.csv';
      if (disposition?.includes('filename=')) filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
      else if (contentType.includes('spreadsheetml')) filename = 'fichier_corrige.xlsx';
      else if (contentType.includes('xml')) filename = 'fichier_corrige.xml';
      const blob = new Blob([res.data], { type: contentType });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url; link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      showMsg('success', t('corrections.export.successFile'));
    } catch { showMsg('error', t('corrections.export.errorFile')); }
    finally { setExporting(false); }
  };

  const handleApprove = async (id) => {
    const comment = commentInputs[id] || null;
    try {
      await correctionsAPI.approve(id, comment);
      showMsg('success', t('corrections.messages.approved'));
      fetchCorrections();
      fetchDatasets();
    } catch { showMsg('error', t('corrections.messages.errorApprove')); }
  };

  const handleReject = async (id) => {
    const comment = commentInputs[id] || null;
    try {
      await correctionsAPI.reject(id, comment);
      showMsg('success', t('corrections.messages.rejected'));
      fetchCorrections();
    } catch { showMsg('error', t('corrections.messages.errorReject')); }
  };

  const handleUpdateValue = async () => {
    if (!manualModal) return;
    setUpdating(true);
    try {
      await correctionsAPI.updateValue(manualModal.id, manualValue);
      setCorrections(prev => prev.map(c =>
        c.id === manualModal.id ? { ...c, suggested_value: manualValue, correction_method: 'manual' } : c
      ));
      showMsg('success', t('corrections.messages.updated'));
      closeManualModal();
    } catch { showMsg('error', t('corrections.messages.errorUpdate')); }
    finally { setUpdating(false); }
  };

  const openManualModal  = (c) => { setManualModal(c); setManualValue(c.suggested_value || ''); };
  const closeManualModal = () => { setManualModal(null); setManualValue(''); };

  const getTypeInfo = (type) => ({
    duplicate:     { label: t('anomalies.types.duplicate'),     dot: 'bg-red-500',    pill: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20' },
    outlier:       { label: t('anomalies.types.outlier'),       dot: 'bg-orange-500', pill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' },
    missing_value: { label: t('anomalies.types.missing_value'), dot: 'bg-yellow-500', pill: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20' },
    format_error:  { label: t('anomalies.types.format_error'),  dot: 'bg-purple-500', pill: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20' },
  }[type] || { label: type, dot: 'bg-gray-400', pill: 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 border border-gray-200 dark:border-white/[0.08]' });

  const getSourceIcon = (type) => {
    if (type === 'excel') return '📊';
    if (type === 'xml')   return '📄';
    if (type === 'postgresql' || type === 'mysql') return '🗄️';
    return '📋';
  };

  const getFormatIcon = (t) => t === 'excel' ? '📊' : t === 'xml' ? '📄' : '📋';

  const filteredCorrections = corrections.filter(c => {
    const matchTab    = c.status === activeTab;
    const matchSource = filterSource === 'all' || String(c.anomaly?.source_id) === String(filterSource);
    return matchTab && matchSource;
  });

  const filteredStats = {
    pending:  corrections.filter(c => c.status === 'pending'  && (filterSource === 'all' || String(c.anomaly?.source_id) === String(filterSource))).length,
    approved: corrections.filter(c => c.status === 'approved' && (filterSource === 'all' || String(c.anomaly?.source_id) === String(filterSource))).length,
    rejected: corrections.filter(c => c.status === 'rejected' && (filterSource === 'all' || String(c.anomaly?.source_id) === String(filterSource))).length,
  };

  const selectedDatasetObj = datasets.find(d => d.dataset_id == selectedDataset);
  const isDBSource = selectedDatasetObj && ['postgresql', 'mysql'].includes(selectedDatasetObj.source_type);

  return (
    <div className="max-w-7xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t('corrections.title')}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {corrections.length} {t('corrections.total') || 'corrections'}
          </p>
        </div>
        <button onClick={fetchCorrections}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('corrections.refresh')}
        </button>
      </div>

      {/* Flash message */}
      {message && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
          message.type === 'error'
            ? 'bg-red-50 dark:bg-red-500/[0.08] text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'
            : 'bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Source filter */}
      {sources.length > 0 && (
        <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
              {t('corrections.export.filter.sourceLabel')}
            </span>
            <button onClick={() => setFilterSource('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                filterSource === 'all'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white border-transparent'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08]'
              }`}>
              {t('corrections.export.filter.all')}
            </button>
            {sources.map(s => (
              <button key={s.id} onClick={() => setFilterSource(String(s.id))}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  filterSource === String(s.id)
                    ? 'bg-teal-600 dark:bg-teal-500 text-white border-transparent'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08]'
                }`}>
                {getSourceIcon(s.type)} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Export section */}
      {datasets.length > 0 && (
        <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('corrections.export.title')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111318] text-gray-700 dark:text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 transition">
              {datasets.map(d => (
                <option key={d.dataset_id} value={d.dataset_id}>
                  {getFormatIcon(d.source_type)} {d.source_name} — {d.dataset_name}
                </option>
              ))}
            </select>
            {isDBSource ? (
              <button onClick={handleExportSQL} disabled={exporting || !selectedDataset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 whitespace-nowrap">
                {exporting ? '...' : t('corrections.export.sqlButton')}
              </button>
            ) : (
              <button onClick={handleExport} disabled={exporting || !selectedDataset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 whitespace-nowrap">
                {exporting ? '...' : t('corrections.export.downloadButton')}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('corrections.export.onlyApproved')}</p>
        </div>
      )}

      {/* Stats tabs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'pending',  label: t('corrections.tabs.pending'),  color: 'text-amber-600 dark:text-amber-400' },
          { key: 'approved', label: t('corrections.tabs.approved'), color: 'text-emerald-600 dark:text-emerald-400' },
          { key: 'rejected', label: t('corrections.tabs.rejected'), color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <button key={s.key} onClick={() => setActiveTab(s.key)}
            className={`p-4 rounded-xl border transition-all duration-150 text-center ${
              activeTab === s.key
                ? 'bg-white dark:bg-[#1a1d23] border-teal-400 dark:border-teal-500/60 shadow-sm ring-2 ring-teal-400/20'
                : 'bg-white dark:bg-[#1a1d23] border-gray-200/80 dark:border-white/[0.06]'
            }`}>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{filteredStats[s.key]}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{s.label}</p>
            {activeTab === s.key && <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 mt-2" />}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : filteredCorrections.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] py-14 text-center">
          <p className="text-3xl mb-2">{activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '✅' : '🚫'}</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t(`corrections.empty.${activeTab}`)}</p>
          {activeTab === 'pending' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('corrections.empty.pendingSub')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCorrections.map(correction => {
            const typeInfo = getTypeInfo(correction.anomaly?.anomaly_type);
            const src = sources.find(s => String(s.id) === String(correction.anomaly?.source_id));
            return (
              <div key={correction.id}
                className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5 hover:border-gray-300 dark:hover:border-white/[0.1] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeInfo.dot}`} />
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t('corrections.card.field')}{' '}
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{correction.anomaly?.field_name || '—'}</span>
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t('corrections.card.method')}{' '}
                        <span className="font-medium text-gray-600 dark:text-gray-300">{correction.correction_method}</span>
                      </span>
                      {correction.correction_method === 'manual' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 rounded-md border border-teal-100 dark:border-teal-500/20">
                          {t('corrections.card.manual')}
                        </span>
                      )}
                      {filterSource === 'all' && src && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-white/[0.08]">
                          {getSourceIcon(src.type)} {src.name}
                        </span>
                      )}
                    </div>

                    {/* Value comparison */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-red-50/60 dark:bg-red-500/[0.07] border border-red-100 dark:border-red-500/20">
                        <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1.5">{t('corrections.card.original')}</p>
                        <p className="text-xs font-mono text-gray-800 dark:text-gray-100 break-all">
                          {correction.anomaly?.original_value || <span className="italic text-gray-300 dark:text-gray-600">{t('corrections.card.empty')}</span>}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-500/[0.07] border border-emerald-100 dark:border-emerald-500/20">
                        <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 mb-1.5">{t('corrections.card.suggested')}</p>
                        <p className="text-xs font-mono text-gray-800 dark:text-gray-100 break-all">
                          {correction.suggested_value || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Commentaire inline — visible en pending */}
                    {activeTab === 'pending' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={commentInputs[correction.id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [correction.id]: e.target.value }))}
                          placeholder="Commentaire optionnel..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 text-xs placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-teal-400 transition"
                        />
                      </div>
                    )}

                    {/* Commentaire affiché — visible en approved/rejected */}
                    {correction.comment && activeTab !== 'pending' && (
                      <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                        <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="text-xs text-blue-700 dark:text-blue-300 italic">{correction.comment}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {activeTab === 'pending' ? (
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => handleApprove(correction.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition">
                          {t('corrections.card.approve')}
                        </button>
                        <button onClick={() => handleReject(correction.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition">
                          {t('corrections.card.reject')}
                        </button>
                        <button onClick={() => openManualModal(correction)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition">
                          {t('corrections.card.modify')}
                        </button>
                      </div>
                    ) : activeTab === 'approved' ? (
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                        {t('corrections.card.approvedBadge')}
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                        {t('corrections.card.rejectedBadge')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual correction modal */}
      {manualModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeManualModal}>
          <div className="bg-white dark:bg-[#1a1d23] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200/60 dark:border-white/[0.06] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('corrections.modal.title')}</h2>
              <button onClick={closeManualModal} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-4 mb-4 space-y-2.5 text-xs">
                {[
                  [t('corrections.modal.fieldLabel'),      manualModal.anomaly?.field_name || '—', ''],
                  [t('corrections.modal.originalLabel'),   manualModal.anomaly?.original_value || '—', 'text-red-600 dark:text-red-400 font-mono'],
                  [t('corrections.modal.suggestionLabel'), manualModal.suggested_value || '—', 'text-emerald-600 dark:text-emerald-400 font-mono'],
                ].map(([label, value, cls]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500">{label}</span>
                    <span className={`font-medium text-gray-800 dark:text-white ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  {t('corrections.modal.newValueLabel')}
                </label>
                <input type="text" value={manualValue} onChange={e => setManualValue(e.target.value)}
                  placeholder={t('corrections.modal.newValuePlaceholder')} autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdateValue()}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111318] text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 transition" />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-white/[0.06] flex gap-2">
              <button onClick={closeManualModal}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition">
                {t('corrections.modal.cancel')}
              </button>
              <button onClick={handleUpdateValue} disabled={updating || !manualValue.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white transition disabled:opacity-50">
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