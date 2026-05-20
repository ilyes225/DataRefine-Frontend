import { useState, useEffect } from 'react';
import { anomaliesAPI } from '../api/anomalies';
import { sourcesAPI } from '../api/sources';
import { useTranslation } from '../i18n';

function RecordModal({ anomaly, onClose }) {
  const { t } = useTranslation();
  if (!anomaly) return null;
  const recordData   = anomaly.record_data || {};
  const entries      = Object.entries(recordData);
  const anomalyField = anomaly.field_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('anomalies.modal.title')}
              {anomaly.row_number && (
                <span className="ml-2 px-2 py-0.5 text-sm bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full font-mono">
                  {t('anomalies.modal.line')} {anomaly.row_number}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('anomalies.modal.anomalyField')} <span className="font-mono font-medium text-gray-700 dark:text-gray-300">«{anomalyField}»</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">{t('anomalies.modal.noData')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 w-1/3">{t('anomalies.modal.colField')}</th>
                  <th className="text-left py-2">{t('anomalies.modal.colValue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {entries.map(([key, value]) => {
                  const isAnomalyField = key === anomalyField;
                  return (
                    <tr key={key} className={isAnomalyField ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                      <td className={`py-2.5 pr-4 font-mono font-medium ${isAnomalyField ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isAnomalyField && <span className="mr-1">⚠️</span>}{key}
                      </td>
                      <td className={`py-2.5 font-mono break-all ${isAnomalyField ? 'text-red-800 dark:text-red-300 font-semibold' : 'text-gray-800 dark:text-gray-200'}`}>
                        {value === null || value === undefined || value === ''
                          ? <span className="italic text-gray-300">{t('anomalies.modal.empty')}</span>
                          : String(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition">
            {t('anomalies.modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Anomalies() {
  const { t } = useTranslation();
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
.then(res => {
  console.log('SOURCES:', res.data);
  setSources(Array.isArray(res.data) ? res.data : []);
})      .catch(() => setSources([]));
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
    setAnalyzeMsg('Please select a source first.');
    setAnalyzeMsgType('error');
    return;
  }
  setAnalyzing(true);
  setAnalyzeMsg('');
  try {
    await sourcesAPI.analyzeSource(selectedSource);
    setAnalyzeMsg('Analysis completed successfully.');
    setAnalyzeMsgType('success');
    fetchAnomalies();
    anomaliesAPI.getCounts({ source_id: selectedSource })
      .then(res => setCounts(res.data))
      .catch(() => {});
  } catch (error) {
    setAnalyzeMsg('Analysis failed. Please try again.');
    setAnalyzeMsgType('error');
  } finally {
    setAnalyzing(false);
  }
};

  const getTypeInfo = (type) => {
    const map = {
      duplicate:     { label: t('anomalies.types.duplicate'),     color: 'bg-red-100 text-red-600' },
      outlier:       { label: t('anomalies.types.outlier'),       color: 'bg-orange-100 text-orange-600' },
      missing_value: { label: t('anomalies.types.missing_value'), color: 'bg-yellow-100 text-yellow-600' },
      format_error:  { label: t('anomalies.types.format_error'),  color: 'bg-purple-100 text-purple-600' },
    };
    return map[type] || { label: type, color: 'bg-gray-100 text-gray-600' };
  };

  const getSeverityColor = (severity) => ({
    critical: 'bg-red-100 text-red-700',
    high:     'bg-red-100 text-red-700',
    medium:   'bg-yellow-100 text-yellow-700',
    low:      'bg-green-100 text-green-700',
  }[severity] || 'bg-gray-100 text-gray-600');

  const getStatusInfo = (status, type) => {
    if (type === 'duplicate' && status === 'approved')
      return { label: t('anomalies.statuses.auto_corrected'), color: 'bg-green-100 text-green-700' };
    return ({
      approved: { label: t('anomalies.statuses.approved'), color: 'bg-green-100 text-green-600' },
      rejected: { label: t('anomalies.statuses.rejected'), color: 'bg-red-100 text-red-600' },
      resolved: { label: t('anomalies.statuses.resolved'), color: 'bg-green-100 text-green-600' },
      pending:  { label: t('anomalies.statuses.pending'),  color: 'bg-orange-100 text-orange-600' },
    }[status] || { label: status, color: 'bg-gray-100 text-gray-600' });
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

  const getSourceIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('excel') || n.endsWith('.xlsx')) return '📊';
    if (n.includes('xml'))  return '📄';
    if (n.includes('api'))  return '🔌';
    if (n.includes('db') || n.includes('sql') || n.includes('postgres')) return '🗄️';
    return '📋';
  };

  return (
    <div className="max-w-7xl">
      {selectedAnomaly && (
        <RecordModal anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('anomalies.title')}</h1>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !selectedSource}
          className={`px-4 py-2 rounded-lg text-white font-medium transition flex items-center gap-2 ${
            analyzing || !selectedSource
              ? 'bg-teal-300 dark:bg-teal-800 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700'
          }`}>
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>🔍 Analyze Dataset</>
          )}
        </button>
      </div>

      {/* Flash message */}
      {analyzeMsg && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
          analyzeMsgType === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
        }`}>
          {analyzeMsgType === 'error' ? '❌' : '✅'} {analyzeMsg}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('anomalies.cards.duplicates'), type: 'duplicate',    color: 'text-red-600',    emoji: '🔁' },
          { label: t('anomalies.cards.outliers'),   type: 'outlier',      color: 'text-orange-600', emoji: '📈' },
          { label: t('anomalies.cards.missing'),    type: 'missing_value', color: 'text-yellow-600', emoji: '❓' },
          { label: t('anomalies.cards.format'),     type: 'format_error', color: 'text-purple-600', emoji: '❌' },
        ].map(stat => (
          <div key={stat.type}
            onClick={() => setFilter(filter === stat.type ? 'all' : stat.type)}
            className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border cursor-pointer transition ${
              filter === stat.type
                ? 'border-teal-400 ring-2 ring-teal-200'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
            <p className="text-2xl text-center">{stat.emoji}</p>
            <p className={`text-2xl font-bold text-center ${stat.color}`}>{counts[stat.type] || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtre par source (pills) */}
      {sources.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              🗂️ {t('anomalies.filters.sourceLabel') || 'Filtrer par source :'}
            </span>
            <button
              onClick={() => setSelectedSource('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                selectedSource === ''
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
              }`}>
              {t('anomalies.filters.allSources')}
            </button>
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(String(s.id))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  selectedSource === String(s.id)
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
                }`}>
                {getSourceIcon(s.name)} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtres type + statut */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap">
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === f.key
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {totalCount} {t('anomalies.total')}
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {tableHeaders.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('anomalies.empty')}
                    </td>
                  </tr>
                ) : (
                  results.map((anomaly, index) => {
                    const typeInfo   = getTypeInfo(anomaly.anomaly_type);
                    const statusInfo = getStatusInfo(anomaly.status, anomaly.anomaly_type);
                    return (
                      <tr key={anomaly.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-4 py-4 text-sm font-mono font-semibold text-teal-600 dark:text-teal-400">
                          {anomaly.row_number ? `L${anomaly.row_number}` : `#${(currentPage - 1) * perPage + index + 1}`}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{anomaly.field_name || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate font-mono">{anomaly.original_value || '—'}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(anomaly.severity)}`}>{anomaly.severity || '—'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {anomaly.detected_at ? new Date(anomaly.detected_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedAnomaly(anomaly)}
                            disabled={!anomaly.record_data}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                              anomaly.record_data
                                ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 cursor-not-allowed'
                            }`}>
                            🔍 {t('anomalies.table.view')}
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
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('anomalies.pagination.page')} {currentPage} {t('anomalies.pagination.of')} {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  {t('anomalies.pagination.previous')}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
                    ) : (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          currentPage === p
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                        }`}>
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
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