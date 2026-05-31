import { useState, useEffect } from 'react';
import { anomaliesAPI } from '../api/anomalies';
import { sourcesAPI } from '../api/sources';
import { useTranslation } from '../i18n';
import { useNotifications } from '../context/NotificationsContext';

function RecordModal({ anomaly, onClose }) {
  const { t } = useTranslation();
  if (!anomaly) return null;
  const recordData   = anomaly.record_data || {};
  const entries      = Object.entries(recordData);
  const anomalyField = anomaly.field_name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1d23] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-gray-200/60 dark:border-white/[0.06]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('anomalies.modal.title')}
                </h2>
                {anomaly.row_number && (
                  <span className="px-2 py-0.5 text-xs bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 rounded-md font-mono border border-teal-100 dark:border-teal-500/20">
                    {t('anomalies.modal.line')} {anomaly.row_number}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t('anomalies.modal.anomalyField')}{' '}
                <span className="font-mono text-gray-600 dark:text-gray-300">«{anomalyField}»</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">{t('anomalies.modal.noData')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  <th className="text-left py-2 pb-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider w-1/3">
                    {t('anomalies.modal.colField')}
                  </th>
                  <th className="text-left py-2 pb-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('anomalies.modal.colValue')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {entries.map(([key, value]) => {
                  const isAnomalyField = key === anomalyField;
                  return (
                    <tr
                      key={key}
                      className={isAnomalyField ? 'bg-red-50/60 dark:bg-red-500/[0.07]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}
                    >
                      <td className={`py-2.5 pr-4 font-mono text-xs font-medium ${isAnomalyField ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {isAnomalyField && <span className="mr-1.5 text-red-500">⚠</span>}
                        {key}
                      </td>
                      <td className={`py-2.5 font-mono text-xs break-all ${isAnomalyField ? 'text-red-700 dark:text-red-300 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                        {value === null || value === undefined || value === ''
                          ? <span className="italic text-gray-300 dark:text-gray-600">{t('anomalies.modal.empty')}</span>
                          : String(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 dark:border-white/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            {t('anomalies.modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPE_CONFIG = {
  duplicate:     { dot: 'bg-red-500',    pill: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20' },
  outlier:       { dot: 'bg-orange-500', pill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' },
  missing_value: { dot: 'bg-yellow-500', pill: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20' },
  format_error:  { dot: 'bg-purple-500', pill: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20' },
};

const SEVERITY_CONFIG = {
  critical: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
  high:     'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
  medium:   'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20',
  low:      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
};

const STATUS_CONFIG = {
  approved: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
  rejected: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
  resolved: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
  pending:  'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20',
};

const getSourceIcon = (name) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('excel') || n.endsWith('.xlsx')) return '📊';
  if (n.includes('xml'))  return '📄';
  if (n.includes('api'))  return '🔌';
  if (n.includes('db') || n.includes('sql') || n.includes('postgres')) return '🗄️';
  return '📋';
};

function StatCard({ emoji, count, label, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-4 rounded-xl border transition-all duration-150 ${
        active
          ? 'bg-white dark:bg-[#1a1d23] border-teal-400 dark:border-teal-500/60 shadow-sm ring-2 ring-teal-400/20 dark:ring-teal-500/10'
          : 'bg-white dark:bg-[#1a1d23] border-gray-200/80 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1] hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl">{emoji}</span>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1" />}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{count}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{label}</p>
    </button>
  );
}

function Anomalies() {
  const { t } = useTranslation();
  const { fetchNotifications } = useNotifications();
  const [results, setResults]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [analyzing, setAnalyzing]             = useState(false);
  const [analyzeMsg, setAnalyzeMsg]           = useState('');
  const [analyzeMsgType, setAnalyzeMsgType]   = useState('success');
  const [filter, setFilter]                   = useState('all');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [sources, setSources]                 = useState([]);
  const [selectedSource, setSelectedSource]   = useState('');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [totalCount, setTotalCount]           = useState(0);
  const [counts, setCounts]                   = useState({ duplicate: 0, outlier: 0, missing_value: 0, format_error: 0 });
  const perPage = 10;

  useEffect(() => {
    sourcesAPI.getAll()
      .then(res => setSources(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSources([]));
  }, []);

  useEffect(() => {
    const params = {};
    if (selectedSource) params.source_id = selectedSource;
    anomaliesAPI.getCounts(params).then(res => setCounts(res.data)).catch(() => {});
  }, [selectedSource]);

  useEffect(() => { setCurrentPage(1); }, [filter, statusFilter, selectedSource]);
  useEffect(() => { fetchAnomalies(); }, [selectedSource, currentPage, filter, statusFilter]);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: perPage };
      if (selectedSource) params.source_id = selectedSource;
      if (filter !== 'all')       params.type   = filter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await anomaliesAPI.getAll(params);
      if (res.data.items) {
        setResults(res.data.items);
        setTotalPages(res.data.pages);
        setTotalCount(res.data.total);
      } else {
        setResults(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedSource) {
      setAnalyzeMsg(t('anomalies.selectSourceFirst') || 'Please select a source first.');
      setAnalyzeMsgType('error');
      return;
    }
    setAnalyzing(true);
    setAnalyzeMsg('');
    try {
      await sourcesAPI.analyzeSource(selectedSource);
      setAnalyzeMsg(t('anomalies.analyzeSuccess') || 'Analysis completed successfully.');
      setAnalyzeMsgType('success');
      fetchAnomalies();
      anomaliesAPI.getCounts({ source_id: selectedSource }).then(res => setCounts(res.data)).catch(() => {});
      fetchNotifications();
    } catch {
      setAnalyzeMsg(t('anomalies.analyzeFailed') || 'Analysis failed. Please try again.');
      setAnalyzeMsgType('error');
    } finally {
      setAnalyzing(false);
    }
  };

  const getTypeInfo = (type) => {
    const cfg = TYPE_CONFIG[type];
    if (!cfg) return { label: type, dot: 'bg-gray-400', pill: 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 border border-gray-200 dark:border-white/[0.08]' };
    return { label: t(`anomalies.types.${type}`) || type, ...cfg };
  };

  const getStatusInfo = (status, type) => {
    if (type === 'duplicate' && status === 'approved')
      return { label: t('anomalies.statuses.auto_corrected') || 'Auto-corrected', pill: STATUS_CONFIG.approved };
    return {
      label: t(`anomalies.statuses.${status}`) || status,
      pill: STATUS_CONFIG[status] || 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 border border-gray-200 dark:border-white/[0.08]',
    };
  };

  const typeFilters = [
    { key: 'all',           label: t('anomalies.filters.allTypes') },
    { key: 'duplicate',     label: t('anomalies.types.duplicate') },
    { key: 'outlier',       label: t('anomalies.types.outlier') },
    { key: 'missing_value', label: t('anomalies.types.missing_value') },
    { key: 'format_error',  label: t('anomalies.types.format_error') },
  ];

  const statusFilters = [
    { key: 'all',      label: t('anomalies.filters.allStatuses') },
    { key: 'pending',  label: t('anomalies.filters.pending') },
    { key: 'approved', label: t('anomalies.filters.approved') },
    { key: 'rejected', label: t('anomalies.filters.rejected') },
  ];

  const tableHeaders = [
    t('anomalies.table.line'),
    t('anomalies.table.type'),
    t('anomalies.table.field'),
    t('anomalies.table.originalValue'),
    t('anomalies.table.severity'),
    t('anomalies.table.status'),
    t('anomalies.table.detectedAt'),
    t('anomalies.table.view'),
  ];

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="max-w-7xl space-y-5">
      {selectedAnomaly && (
        <RecordModal anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t('anomalies.title')}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {totalCount} {t('anomalies.total')}
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing || !selectedSource}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            analyzing || !selectedSource
              ? 'bg-teal-400/50 dark:bg-teal-600/30 text-white cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white shadow-sm'
          }`}
        >
          {analyzing ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t('anomalies.analyzing') || 'Analyzing…'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('anomalies.analyze') || 'Analyze Dataset'}
            </>
          )}
        </button>
      </div>

      {/* Flash message */}
      {analyzeMsg && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
          analyzeMsgType === 'error'
            ? 'bg-red-50 dark:bg-red-500/[0.08] text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'
            : 'bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
        }`}>
          {analyzeMsgType === 'error' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {analyzeMsg}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('anomalies.cards.duplicates'), type: 'duplicate',     color: 'text-red-600 dark:text-red-400',       emoji: '🔁' },
          { label: t('anomalies.cards.outliers'),   type: 'outlier',       color: 'text-orange-600 dark:text-orange-400', emoji: '📈' },
          { label: t('anomalies.cards.missing'),    type: 'missing_value', color: 'text-yellow-600 dark:text-yellow-400', emoji: '❓' },
          { label: t('anomalies.cards.format'),     type: 'format_error',  color: 'text-purple-600 dark:text-purple-400', emoji: '✗' },
        ].map(stat => (
          <StatCard
            key={stat.type}
            emoji={stat.emoji}
            count={counts[stat.type] || 0}
            label={stat.label}
            color={stat.color}
            active={filter === stat.type}
            onClick={() => setFilter(filter === stat.type ? 'all' : stat.type)}
          />
        ))}
      </div>

      {/* Source filter */}
      {sources.length > 0 && (
        <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
              {t('anomalies.filters.sourceLabel') || 'Source'}
            </span>
            <button
              onClick={() => setSelectedSource('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                selectedSource === ''
                  ? 'bg-teal-600 dark:bg-teal-500 text-white border-transparent shadow-sm'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14]'
              }`}
            >
              {t('anomalies.filters.allSources')}
            </button>
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(String(s.id))}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  selectedSource === String(s.id)
                    ? 'bg-teal-600 dark:bg-teal-500 text-white border-transparent shadow-sm'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14]'
                }`}
              >
                {getSourceIcon(s.name)} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type + Status filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {typeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filter === f.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                  : 'bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.08] mx-1 hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === f.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                  : 'bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <svg className="animate-spin w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm text-gray-400 dark:text-gray-500">Loading anomalies…</span>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  {tableHeaders.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">🔍</span>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t('anomalies.empty')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((anomaly, index) => {
                    const typeInfo   = getTypeInfo(anomaly.anomaly_type);
                    const statusInfo = getStatusInfo(anomaly.status, anomaly.anomaly_type);
                    const sevCls     = SEVERITY_CONFIG[anomaly.severity] || 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 border border-gray-200 dark:border-white/[0.08]';
                    return (
                      <tr key={anomaly.id || index} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                          {anomaly.row_number ? `L${anomaly.row_number}` : `#${(currentPage - 1) * perPage + index + 1}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${typeInfo.dot}`} />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-200 font-mono">
                          {anomaly.field_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate font-mono">
                          {anomaly.original_value || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {anomaly.severity
                            ? <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${sevCls}`}>{anomaly.severity}</span>
                            : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.pill}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                          {anomaly.detected_at
                            ? new Date(anomaly.detected_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedAnomaly(anomaly)}
                            disabled={!anomaly.record_data}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              anomaly.record_data
                                ? 'opacity-0 group-hover:opacity-100 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 border border-teal-100 dark:border-teal-500/20'
                                : 'bg-gray-50 dark:bg-white/[0.03] text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-100 dark:border-white/[0.04]'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {t('anomalies.table.view')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('anomalies.pagination.page')}{' '}
                <span className="font-medium text-gray-600 dark:text-gray-300">{currentPage}</span>{' '}
                {t('anomalies.pagination.of')}{' '}
                <span className="font-medium text-gray-600 dark:text-gray-300">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('anomalies.pagination.previous')}
                </button>

                {pageNumbers.map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-xs text-gray-300 dark:text-gray-600">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium border transition-colors ${
                        currentPage === p
                          ? 'bg-teal-600 dark:bg-teal-500 text-white border-transparent'
                          : 'bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('anomalies.pagination.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Anomalies;