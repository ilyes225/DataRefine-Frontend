import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';
import { FileText, Table, Loader2, RefreshCw } from 'lucide-react';

export default function Reports() {
  const { lang } = useTranslation();
  const [kpis, setKpis] = useState(null);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const isEN = lang === 'en';
  const t = (en, fr) => isEN ? en : fr;

  useEffect(() => { fetchKpis(); }, []);

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const [anomRes, corrRes, sourcesRes, recentRes] = await Promise.all([
        apiClient.get('/anomalies/?per_page=9999'),
        apiClient.get('/corrections/?per_page=9999'),
        apiClient.get('/sources/'),
        apiClient.get('/anomalies/?per_page=5&page=1'),
      ]);

      const anomalies   = anomRes.data.items   ?? anomRes.data;
      const corrections = corrRes.data.items   ?? corrRes.data;
      const sources     = sourcesRes.data.items ?? sourcesRes.data;
      const recent      = recentRes.data.items  ?? recentRes.data;

      const totalAnom    = anomRes.data.total  ?? anomalies.length;
      const totalCorr    = corrRes.data.total  ?? corrections.length;
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
      setRecentAnomalies(Array.isArray(recent) ? recent.slice(0, 5) : recent.slice?.(0, 5) ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await apiClient.get(`/reports/export/${format}`, { responseType: 'blob' });
      const ext  = format === 'pdf' ? 'pdf' : 'xlsx';
      const mime = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
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

  const TYPE_CONFIG = {
    duplicate:    { label: t('Duplicates','Doublons'),           dot: 'bg-red-500',    pill: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20' },
    outlier:      { label: t('Outliers','Valeurs aberrantes'),   dot: 'bg-orange-500', pill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' },
    missing_value:{ label: t('Missing','Manquantes'),            dot: 'bg-yellow-500', pill: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20' },
    format_error: { label: t('Format errors','Erreurs format'),  dot: 'bg-purple-500', pill: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20' },
  };

  const qualityScore = kpis && kpis.totalAnom > 0
    ? Math.round((kpis.approvedCorr / kpis.totalAnom) * 100)
    : 100;

  const scoreColor = qualityScore >= 75 ? 'text-emerald-500' : qualityScore >= 40 ? 'text-amber-500' : 'text-red-500';
  const scoreBg    = qualityScore >= 75 ? 'bg-emerald-500'   : qualityScore >= 40 ? 'bg-amber-500'   : 'bg-red-500';

  return (
    <div className="max-w-7xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t('Reports', 'Rapports')}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {t('Global KPI summary', 'Résumé global des KPIs du système')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchKpis} disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('Refresh', 'Actualiser')}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-40 transition-colors">
            {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={exporting !== null || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-40 transition-colors">
            {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
            Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
          <span className="text-sm text-gray-400 dark:text-gray-500">{t('Loading…', 'Chargement…')}</span>
        </div>
      ) : kpis && (
        /* ── 2-column layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT COLUMN (2/3) ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Overview KPIs */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
              <SectionTitle label={t('Overview', "Vue d'ensemble")} color="text-teal-600 dark:text-teal-400" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label={t('Sources','Sources')}           value={kpis.totalSources} sub={t('imported','importées')} color="teal" />
                <KpiCard label={t('Anomalies','Anomalies')}       value={kpis.totalAnom}    sub={t('detected','détectées')} color="red" />
                <KpiCard label={t('Corrections','Corrections')}   value={kpis.totalCorr}    sub={t('suggested','suggérées')} color="emerald" />
                <KpiCard label={t('Pending','En attente')}        value={kpis.pendingAnom}  sub={t('anomalies','anomalies')} color="amber" />
              </div>
            </div>

            {/* Anomalies */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
              <SectionTitle label={t('Detected Anomalies','Anomalies détectées')} color="text-red-600 dark:text-red-400" />
              <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCell label={t('Total','Total')}        value={kpis.totalAnom} />
                <StatCell label={t('Pending','En attente')} value={kpis.pendingAnom} />
                <StatCell label={t('Resolved','Résolues')}  value={kpis.resolvedAnom} accent="emerald" />
              </div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                {t('Distribution by type','Répartition par type')}
              </p>
              <div className="space-y-2.5">
                {Object.entries(kpis.typeMap).map(([type, count]) => {
                  const cfg = TYPE_CONFIG[type] || { label: type, dot: 'bg-gray-400', pill: 'bg-gray-50 dark:bg-white/[0.04] text-gray-500 border border-gray-200 dark:border-white/[0.08]' };
                  const pct = kpis.totalAnom > 0 ? Math.round((count / kpis.totalAnom) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium w-36 shrink-0 ${cfg.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-16 text-right tabular-nums">
                        {count} <span className="text-gray-300 dark:text-gray-600">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
                {Object.keys(kpis.typeMap).length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('No anomalies detected yet.','Aucune anomalie détectée.')}</p>
                )}
              </div>
            </div>

            {/* Corrections */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
              <SectionTitle label={t('Suggested Corrections','Corrections suggérées')} color="text-emerald-600 dark:text-emerald-400" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <StatCell label={t('Total','Total')}       value={kpis.totalCorr} />
                <StatCell label={t('Approved','Approuvées')} value={kpis.approvedCorr} accent="emerald" />
                <StatCell label={t('Rejected','Rejetées')}   value={kpis.rejectedCorr} accent="red" />
                <StatCell label={t('Pending','En attente')}  value={kpis.pendingCorr}  accent="amber" />
              </div>
              {kpis.totalCorr > 0 && (
                <>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    {kpis.approvedCorr > 0 && <div className="bg-emerald-500 rounded-l-full" style={{ width: `${(kpis.approvedCorr/kpis.totalCorr)*100}%` }} />}
                    {kpis.rejectedCorr > 0 && <div className="bg-red-500" style={{ width: `${(kpis.rejectedCorr/kpis.totalCorr)*100}%` }} />}
                    {kpis.pendingCorr  > 0 && <div className="bg-amber-400 rounded-r-full" style={{ width: `${(kpis.pendingCorr/kpis.totalCorr)*100}%` }} />}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    {[
                      { color:'bg-emerald-500', label: t('Approved','Approuvées'), val: kpis.approvedCorr },
                      { color:'bg-red-500',     label: t('Rejected','Rejetées'),   val: kpis.rejectedCorr },
                      { color:'bg-amber-400',   label: t('Pending','En attente'),  val: kpis.pendingCorr },
                    ].map(({ color, label, val }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{label} ({val})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (1/3) ── */}
          <div className="space-y-4">

            {/* Quality Score */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
              <SectionTitle label={t('Quality Score','Score qualité')} color="text-gray-600 dark:text-gray-400" />
              <div className="flex flex-col items-center py-3">
                {/* Circle */}
                <div className="relative w-28 h-28 mb-4">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                      className="text-gray-100 dark:text-white/[0.06]" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                      className={scoreBg.replace('bg-','stroke-')}
                      strokeDasharray={`${qualityScore * 2.513} 251.3`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{qualityScore}%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                  {qualityScore >= 75
                    ? t('Good data quality', 'Bonne qualité des données')
                    : qualityScore >= 40
                    ? t('Moderate quality', 'Qualité modérée')
                    : t('Needs attention', 'Nécessite attention')}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-center">
                  {t('Based on approved corrections vs anomalies', 'Corrections approuvées / anomalies')}
                </p>
              </div>
            </div>

            {/* Recent anomalies feed */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
              <SectionTitle label={t('Recent Anomalies','Dernières anomalies')} color="text-gray-600 dark:text-gray-400" />
              {recentAnomalies.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-center">
                  {t('No anomalies yet.','Aucune anomalie détectée.')}
                </p>
              ) : (
                <div className="space-y-2 mt-1">
                  {recentAnomalies.map((a, i) => {
                    const cfg = TYPE_CONFIG[a.anomaly_type] || { dot: 'bg-gray-400', pill: 'bg-gray-50 dark:bg-white/[0.04] text-gray-500 border border-gray-200 dark:border-white/[0.08]', label: a.anomaly_type };
                    return (
                      <div key={a.id ?? i} className="flex items-start gap-2.5 py-2 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${cfg.pill}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate">
                              {a.field_name || '—'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5 font-mono truncate">
                            {a.original_value || '—'}
                          </p>
                        </div>
                        {a.row_number && (
                          <span className="text-[10px] font-mono text-teal-500 dark:text-teal-400 shrink-0">
                            L{a.row_number}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary text */}
            <div className="bg-gray-50/80 dark:bg-white/[0.01] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t('Summary','Résumé')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t(
                  `${kpis.totalAnom} anomalies detected across ${kpis.totalSources} source${kpis.totalSources !== 1 ? 's' : ''}. ${kpis.approvedCorr} correction${kpis.approvedCorr !== 1 ? 's' : ''} approved, ${kpis.pendingAnom} still pending.`,
                  `${kpis.totalAnom} anomalie${kpis.totalAnom !== 1 ? 's' : ''} détectée${kpis.totalAnom !== 1 ? 's' : ''} sur ${kpis.totalSources} source${kpis.totalSources !== 1 ? 's' : ''}. ${kpis.approvedCorr} correction${kpis.approvedCorr !== 1 ? 's' : ''} approuvée${kpis.approvedCorr !== 1 ? 's' : ''}, ${kpis.pendingAnom} en attente.`
                )}
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ label, color }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
      <h2 className={`text-sm font-semibold ${color}`}>{label}</h2>
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  const c = {
    teal:    { bg:'bg-teal-50 dark:bg-teal-500/10',    border:'border-teal-100 dark:border-teal-500/20',    num:'text-teal-700 dark:text-teal-300',    text:'text-teal-600 dark:text-teal-400' },
    red:     { bg:'bg-red-50 dark:bg-red-500/10',      border:'border-red-100 dark:border-red-500/20',      num:'text-red-700 dark:text-red-300',      text:'text-red-600 dark:text-red-400' },
    emerald: { bg:'bg-emerald-50 dark:bg-emerald-500/10', border:'border-emerald-100 dark:border-emerald-500/20', num:'text-emerald-700 dark:text-emerald-300', text:'text-emerald-600 dark:text-emerald-400' },
    amber:   { bg:'bg-amber-50 dark:bg-amber-500/10',  border:'border-amber-100 dark:border-amber-500/20',  num:'text-amber-700 dark:text-amber-300',  text:'text-amber-600 dark:text-amber-400' },
  }[color] || {};
  return (
    <div className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
      <p className={`text-3xl font-bold tabular-nums ${c.num}`}>{value}</p>
      <p className={`text-xs font-medium mt-1 ${c.text}`}>{label}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function StatCell({ label, value, accent }) {
  const cls = { emerald:'text-emerald-600 dark:text-emerald-400', red:'text-red-600 dark:text-red-400', amber:'text-amber-600 dark:text-amber-400' };
  return (
    <div className="bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold tabular-nums ${accent ? cls[accent] : 'text-gray-800 dark:text-white'}`}>{value}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{label}</p>
    </div>
  );
}