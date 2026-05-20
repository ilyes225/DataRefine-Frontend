import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';

export default function Reports() {
  const { lang } = useTranslation();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => { fetchKpis(); }, []);

  const fetchKpis = async () => {
    try {
      const [anomRes, corrRes, sourcesRes] = await Promise.all([
        apiClient.get('/anomalies/?per_page=9999'),
        apiClient.get('/corrections/?per_page=9999'),
        apiClient.get('/sources/'),
      ]);

      const anomalies   = anomRes.data.items   ?? anomRes.data;
      const corrections = corrRes.data.items   ?? corrRes.data;
      const sources     = sourcesRes.data.items ?? sourcesRes.data;

      const totalAnom    = anomRes.data.total   ?? anomalies.length;
      const totalCorr    = corrRes.data.total   ?? corrections.length;

      const pendingAnom  = anomalies.filter(a => a.status === 'pending').length;
      const resolvedAnom = anomalies.filter(a => a.status !== 'pending').length;
      const approvedCorr = corrections.filter(c => c.status === 'approved').length;
      const rejectedCorr = corrections.filter(c => c.status === 'rejected').length;
      const pendingCorr  = corrections.filter(c => c.status === 'pending').length;

      const typeMap = {};
      anomalies.forEach(a => { typeMap[a.anomaly_type] = (typeMap[a.anomaly_type] || 0) + 1; });

      setKpis({
        totalSources: sources.length,
        totalAnom, pendingAnom, resolvedAnom,
        totalCorr, approvedCorr, rejectedCorr, pendingCorr,
        typeMap,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await apiClient.get(`/reports/export/${format}`, { responseType: 'blob' });
      const ext  = format === 'pdf' ? 'pdf' : 'xlsx';
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `rapport_anomalies_${new Date().toISOString().slice(0, 10)}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export :', err);
      alert(`Erreur lors de l'export ${format.toUpperCase()}`);
    } finally { setExporting(null); }
  };

  const isEN = lang === 'en';

  const typeLabels = {
    duplicate:   { label: isEN ? 'Duplicates'     : 'Doublons',           color: 'bg-purple-100 text-purple-700' },
    outlier:     { label: isEN ? 'Outliers'        : 'Valeurs aberrantes', color: 'bg-red-100 text-red-700' },
    missing:     { label: isEN ? 'Missing values'  : 'Valeurs manquantes', color: 'bg-yellow-100 text-yellow-700' },
    format:      { label: isEN ? 'Format errors'   : 'Erreurs de format',  color: 'bg-blue-100 text-blue-700' },
    format_error:{ label: isEN ? 'Format errors'   : 'Erreurs de format',  color: 'bg-blue-100 text-blue-700' },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isEN ? 'Reports' : 'Rapports'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isEN ? 'Global KPI summary' : 'Résumé global des KPIs du système'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
            {exporting === 'pdf'
              ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              : <span>📄</span>}
            {isEN ? 'Export PDF' : 'Exporter PDF'}
          </button>
          <button onClick={() => handleExport('excel')} disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
            {exporting === 'excel'
              ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              : <span>📊</span>}
            {isEN ? 'Export Excel' : 'Exporter Excel'}
          </button>
        </div>
      </div>

      {kpis && (
        <div className="space-y-6">

          {/* Section 1 — Vue d'ensemble */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {isEN ? '1. Overview' : "1. Vue d'ensemble"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label={isEN ? 'Sources'         : 'Sources'}           value={kpis.totalSources} color="blue"   icon="🗄️" />
              <KpiCard label={isEN ? 'Total anomalies' : 'Anomalies totales'} value={kpis.totalAnom}    color="red"    icon="⚠️" />
              <KpiCard label={isEN ? 'Corrections'     : 'Corrections'}       value={kpis.totalCorr}    color="green"  icon="✅" />
              <KpiCard label={isEN ? 'Pending'         : 'En attente'}        value={kpis.pendingAnom}  color="yellow" icon="⏳" />
            </div>
          </div>

          {/* Section 2 — Anomalies */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {isEN ? '2. Detected Anomalies' : '2. Anomalies détectées'}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <StatRow label={isEN ? 'Total'   : 'Total'}      value={kpis.totalAnom} />
              <StatRow label={isEN ? 'Pending' : 'En attente'} value={kpis.pendingAnom} />
              <StatRow label={isEN ? 'Resolved': 'Résolues'}   value={kpis.resolvedAnom} />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {isEN ? 'Distribution by type:' : 'Répartition par type :'}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(kpis.typeMap).map(([type, count]) => {
                const meta = typeLabels[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
                return (
                  <span key={type} className={`px-3 py-1 rounded-full text-sm font-medium ${meta.color}`}>
                    {meta.label} : {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Section 3 — Corrections */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-green-700 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {isEN ? '3. Suggested Corrections' : '3. Corrections suggérées'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatRow label={isEN ? 'Total'    : 'Total'}      value={kpis.totalCorr} />
              <StatRow label={isEN ? 'Approved' : 'Approuvées'} value={kpis.approvedCorr} />
              <StatRow label={isEN ? 'Rejected' : 'Rejetées'}   value={kpis.rejectedCorr} />
              <StatRow label={isEN ? 'Pending'  : 'En attente'} value={kpis.pendingCorr} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, icon }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };
  return (
    <div className={`rounded-lg border p-4 text-center ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}