import { useState, useEffect } from 'react';
import { anomaliesAPI } from '../api/anomalies';
import { sourcesAPI } from '../api/sources';
import { correctionsAPI } from '../api/corrections';
import { useTranslation } from '../i18n';
import { Search, Star, Database, Wrench, Activity, Plus, Play, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

function QualityGauge({ score, label }) {
  const pct     = Math.round(score * 100);
  const radius  = 52;
  const stroke  = 9;
  const cx = 70; const cy = 70;
  const startAngle = -210;
  const totalArc   = 240;
  const toRad = d => (d * Math.PI) / 180;
  const pointOnArc = (angle) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });
  const arcPath = (from, to) => {
    const s = pointOnArc(from); const e = pointOnArc(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const filledAngle = startAngle + (totalArc * pct) / 100;
  const color = pct >= 80 ? '#14b8a6' : pct >= 60 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="100" viewBox="0 0 140 100">
        <path d={arcPath(startAngle, startAngle + totalArc)} fill="none"
          stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          className="text-gray-100 dark:text-white/[0.06]" />
        {pct > 0 && (
          <path d={arcPath(startAngle, filledAngle)} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
        )}
        <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
          fontSize="18" fontWeight="700" fill={color}>{pct}%</text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="9"
          fill="#9ca3af" fontWeight="500" letterSpacing="1">{label.toUpperCase()}</text>
      </svg>
    </div>
  );
}

function TrendBadge({ current, previous }) {
  if (previous === undefined || previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-400"><Minus size={10} /> stable</span>;
  if (diff > 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500"><TrendingUp size={10} /> +{diff}</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-500"><TrendingDown size={10} /> {diff}</span>;
}

function StatCard({ label, value, sub, valueClass, icon: Icon, iconBg, children }) {
  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5 flex flex-col gap-3 hover:border-gray-200 dark:hover:border-white/[0.12] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={15} />
        </div>
      </div>
      {children || (
        <>
          <p className={`text-3xl font-bold tracking-tight tabular-nums ${valueClass}`}>{value}</p>
          <p className="text-xs text-gray-400 dark:text-white/30">{sub}</p>
        </>
      )}
    </div>
  );
}

function QuickCorrectionCard({ correction, onApprove, onReject }) {
  const TYPE_DOT = {
    duplicate:     'bg-red-400',
    outlier:       'bg-orange-400',
    missing_value: 'bg-yellow-400',
    format_error:  'bg-purple-400',
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/60 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:border-gray-200 dark:hover:border-white/[0.08] transition-colors group">
      <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[correction.anomaly?.anomaly_type] || 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate font-mono">
          {correction.anomaly?.field_name || '—'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-red-400 font-mono truncate max-w-[80px]">{correction.anomaly?.original_value || '—'}</span>
          <span className="text-[10px] text-gray-300 dark:text-gray-600">→</span>
          <span className="text-[10px] text-emerald-500 font-mono truncate max-w-[80px]">{correction.suggested_value || '—'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onApprove(correction.id)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
          <CheckCircle size={13} />
        </button>
        <button onClick={() => onReject(correction.id)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
          <XCircle size={13} />
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const isDark = document.documentElement.classList.contains('dark');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [stats, setStats] = useState({
    total_anomalies: 0, total_records: 0, quality_score: 1, anomaly_rate: 0,
    breakdown: { duplicates: 0, outliers: 0, missing: 0, format_errors: 0 }
  });
  const [sources, setSources]         = useState([]);
  const [corrections, setCorrections] = useState({ pending: 0, approved: 0, list: [] });
  const [loading, setLoading]         = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [trendData, setTrendData]     = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const prevBreakdown = { duplicates: 8, outliers: 5, missing: 12, format_errors: 3 };

  useEffect(() => {
    fetchData();
    fetchTrendData();
  }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, anomaliesRes, correctionsRes] = await Promise.all([
        sourcesAPI.getAll(), anomaliesAPI.getCounts(), correctionsAPI.getAll()
      ]);
      setSources(sourcesRes.data);

      const counts = anomaliesRes.data;
      const duplicates    = counts.duplicate     || 0;
      const outliers      = counts.outlier       || 0;
      const missing       = counts.missing_value || 0;
      const format_errors = counts.format_error  || 0;
      const total = duplicates + outliers + missing + format_errors;

      const totalRecords = sourcesRes.data.reduce((sum, s) => sum + (s.record_count || 0), 0);
      const anomalyRate  = totalRecords > 0 ? total / totalRecords : 0;
      const qualityScore = totalRecords > 0 ? Math.max(0, 1 - anomalyRate) : 1;

      setStats({ total_anomalies: total, total_records: totalRecords, quality_score: qualityScore, anomaly_rate: anomalyRate, breakdown: { duplicates, outliers, missing, format_errors } });

      const allCorr  = correctionsRes.data;
      const pending  = allCorr.filter(c => c.status === 'pending');
      setCorrections({ pending: pending.length, approved: allCorr.filter(c => c.status === 'approved').length, list: pending.slice(0, 5) });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTrendData = async (sourceId = null) => {
    setTrendLoading(true);
    try {
      const res = await anomaliesAPI.getHistory(sourceId);
      setTrendData(res.data);
    } catch (e) {
      console.error('Erreur chargement tendances:', e);
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await correctionsAPI.approve(id);
      setCorrections(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
        list: prev.list.filter(c => c.id !== id),
      }));
    } catch (e) { console.error(e); }
    finally { setApprovingId(null); }
  };

  const handleReject = async (id) => {
    try {
      await correctionsAPI.reject(id);
      setCorrections(prev => ({ ...prev, pending: prev.pending - 1, list: prev.list.filter(c => c.id !== id) }));
    } catch (e) { console.error(e); }
  };

  const qualityLabel = stats.quality_score * 100 >= 80
    ? t('dashboard.excellent')
    : stats.quality_score * 100 >= 60
      ? t('dashboard.average')
      : t('dashboard.critical');

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <svg className="animate-spin w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span className="text-sm text-gray-400 dark:text-gray-500">{t('dashboard.loadingText')}</span>
    </div>
  );

  const breakdownItems = [
    { label: t('dashboard.breakdown.duplicates'), value: stats.breakdown.duplicates,    color: '#f87171', bgClass: 'bg-red-400',    prev: prevBreakdown.duplicates },
    { label: t('dashboard.breakdown.outliers'),   value: stats.breakdown.outliers,      color: '#fb923c', bgClass: 'bg-orange-400', prev: prevBreakdown.outliers },
    { label: t('dashboard.breakdown.missing'),    value: stats.breakdown.missing,       color: '#facc15', bgClass: 'bg-yellow-400', prev: prevBreakdown.missing },
    { label: t('dashboard.breakdown.format'),     value: stats.breakdown.format_errors, color: '#c084fc', bgClass: 'bg-purple-400', prev: prevBreakdown.format_errors },
  ];

  const pieData = breakdownItems.filter(i => i.value > 0);

  const sourceQuality = (s) => {
    if (!s.record_count || s.record_count === 0) return 100;
    return Math.max(0, Math.round((1 - (s.anomaly_count || 0) / s.record_count) * 100));
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#1a1d23' : '#ffffff',
    borderColor: isDark ? '#ffffff10' : '#e5e7eb',
    borderRadius: '10px',
    color: isDark ? '#fff' : '#111827',
    fontSize: '12px',
    boxShadow: '0 4px 20px #0006',
  };

  return (
    <div className="max-w-7xl space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.hello')}, {currentUser?.username || 'Utilisateur'} 👋
          </h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">
            {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/sources')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-sm font-medium rounded-lg text-white transition-colors shadow-sm"
        >
          <Plus size={15} /> {t('dashboard.newSource')}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/[0.06] rounded-xl p-4 hover:border-gray-200 dark:hover:border-white/[0.12] transition-colors col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest">{t('dashboard.kpi.quality')}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20">
              <Star size={15} />
            </div>
          </div>
          <QualityGauge score={stats.quality_score} label={qualityLabel} />
          <p className="text-xs text-gray-400 dark:text-white/30 text-center -mt-1">{t('dashboard.kpi.qualitySub')}</p>
        </div>

        <StatCard label={t('dashboard.kpi.anomalies')} icon={Search}
          iconBg="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
          value={stats.total_anomalies} sub={`${stats.total_records} ${t('dashboard.sources.records')}`}
          valueClass="text-gray-900 dark:text-white" />

        <StatCard label={t('dashboard.kpi.sources')} icon={Database}
          iconBg="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20"
          value={sources.length} sub={`${stats.total_records} ${t('dashboard.sources.records')}`}
          valueClass="text-gray-900 dark:text-white" />

        <StatCard label={t('dashboard.kpi.corrections')} icon={Wrench}
          iconBg="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
          value={corrections.pending} sub={`${corrections.approved} ${t('dashboard.kpi.correctionsSub')}`}
          valueClass="text-amber-500 dark:text-amber-400" />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Line chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/80">{t('dashboard.trendTitle')}</h2>
            <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('dashboard.trendDays')}</span>
          </div>

          {trendLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
          ) : trendData.length === 0 || trendData.every(d => d.anomalies === 0) ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2">
              <Activity size={28} className="text-gray-300 dark:text-white/20" />
              <p className="text-xs text-gray-400 dark:text-white/30">{t('dashboard.trendEmpty')}</p>
              <button
                onClick={() => navigate('/anomalies')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Play size={10} /> {t('dashboard.trendLaunch')}
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dx={-8} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#14b8a6' }} cursor={{ stroke: '#14b8a620', strokeWidth: 20 }} />
                <Line type="monotone" dataKey="anomalies" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 3.5, fill: '#14b8a6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#14b8a6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdown */}
        <div className="bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/80 mb-4">{t('dashboard.breakdown.title')}</h2>

          <div className="flex items-center justify-center mb-4">
            {stats.total_anomalies === 0 ? (
              <div className="relative w-[110px] h-[110px] flex items-center justify-center">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="36" fill="none"
                    stroke="currentColor" strokeWidth="9"
                    className="text-gray-100 dark:text-white/[0.06]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-300 dark:text-white/20">0</span>
                  <span className="text-[9px] text-gray-300 dark:text-white/20 uppercase tracking-wider">anomalies</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={36} outerRadius={50}
                      paddingAngle={4} dataKey="value" stroke="none" cx="50%" cy="50%">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ ...tooltipStyle, fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-gray-800 dark:text-white/80">{stats.total_anomalies}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {breakdownItems.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.bgClass}`} />
                    <span className="text-xs text-gray-500 dark:text-white/50">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendBadge current={item.value} previous={item.prev} />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white/90 tabular-nums w-5 text-right">{item.value}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/[0.04] rounded-full h-1 overflow-hidden">
                  <div className={`${item.bgClass} h-1 rounded-full transition-all duration-700`}
                    style={{ width: stats.total_anomalies > 0 ? `${(item.value / stats.total_anomalies) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Sources */}
        <div className="bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/80">{t('dashboard.sources.title')}</h2>
            <button onClick={() => navigate('/sources')} className="inline-flex items-center gap-0.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">
              {t('dashboard.seeAll')} <ChevronRight size={12} />
            </button>
          </div>

          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-300 dark:text-white/20">
              <Database size={26} className="opacity-50" />
              <p className="text-xs">{t('dashboard.sources.empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.slice(0, 4).map(source => {
                const q = sourceQuality(source);
                const qColor = q >= 80 ? 'bg-teal-400' : q >= 60 ? 'bg-amber-400' : 'bg-red-400';
                const qText  = q >= 80 ? 'text-teal-600 dark:text-teal-400' : q >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400';
                return (
                  <div key={source.id} className="p-3 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/[0.04] rounded-lg border border-gray-100 dark:border-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-white dark:bg-[#111318] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                          <Database size={12} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-white/90">{source.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
                            {source.type?.toUpperCase()} · {source.record_count || 0} {t('dashboard.linesCount')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${qText}`}>{q}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/[0.04] rounded-full h-1 overflow-hidden">
                      <div className={`${qColor} h-1 rounded-full transition-all duration-700`} style={{ width: `${q}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick corrections */}
        <div className="bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/80">{t('dashboard.pendingCorrections')}</h2>
              {corrections.pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                  {corrections.pending}
                </span>
              )}
            </div>
            <button onClick={() => navigate('/corrections')} className="inline-flex items-center gap-0.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">
              {t('dashboard.seeAll')} <ChevronRight size={12} />
            </button>
          </div>

          {corrections.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('dashboard.allDone')}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('dashboard.allDoneSub')(corrections.approved)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {corrections.list.map(correction => (
                <QuickCorrectionCard
                  key={correction.id}
                  correction={correction}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
              {corrections.pending > corrections.list.length && (
                <button
                  onClick={() => navigate('/corrections')}
                  className="w-full py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-center"
                >
                  {t('dashboard.moreCorrections')(corrections.pending - corrections.list.length)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ML CTA Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-600/80 dark:to-emerald-600/60 rounded-xl p-5 shadow-sm">
        <Activity size={140} className="absolute -right-4 -top-4 text-white opacity-[0.06] rotate-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white mb-1">{t('dashboard.mlBannerTitle')}</p>
            <p className="text-xs text-white/70 leading-relaxed max-w-md">{t('dashboard.mlBannerSub')}</p>
          </div>
          <button
            onClick={() => navigate('/anomalies')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur-sm whitespace-nowrap shrink-0"
          >
            <Play size={13} fill="currentColor" /> {t('dashboard.mlBannerBtn')}
          </button>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;