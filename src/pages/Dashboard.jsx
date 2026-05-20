import { useState, useEffect } from 'react';
import { anomaliesAPI } from '../api/anomalies';
import { sourcesAPI } from '../api/sources';
import { correctionsAPI } from '../api/corrections';
import { useTranslation } from '../i18n';

function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_anomalies: 0,
    total_records: 0,
    quality_score: 100,
    anomaly_rate: 0,
    breakdown: { duplicates: 0, outliers: 0, missing: 0, format_errors: 0 }
  });
  const [sources, setSources] = useState([]);
  const [corrections, setCorrections] = useState({ pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, anomaliesRes, correctionsRes] = await Promise.all([
        sourcesAPI.getAll(),
        anomaliesAPI.getCounts(),
        correctionsAPI.getAll()
      ]);

      setSources(sourcesRes.data);

      const counts = anomaliesRes.data;
      const duplicates    = counts.duplicate     || 0;
      const outliers      = counts.outlier       || 0;
      const missing       = counts.missing_value || 0;
      const format_errors = counts.format_error  || 0;
      const total = duplicates + outliers + missing + format_errors;

      const allCorrections = correctionsRes.data;
      const totalRecords = sourcesRes.data.reduce((sum, s) => sum + (s.record_count || 0), 0);
      const anomalyRate  = totalRecords > 0 ? total / totalRecords : 0;
      const qualityScore = totalRecords > 0 ? Math.max(0, 1 - anomalyRate) : 1;

      setStats({
        total_anomalies: total,
        total_records: totalRecords,
        quality_score: qualityScore,
        anomaly_rate: anomalyRate,
        breakdown: { duplicates, outliers, missing, format_errors }
      });

      setCorrections({
        pending:  allCorrections.filter(c => c.status === 'pending').length,
        approved: allCorrections.filter(c => c.status === 'approved').length
      });

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('dashboard.title')}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: t('dashboard.kpi.anomalies'),
            emoji: '🔍',
            value: stats.total_anomalies,
            sub: t('dashboard.kpi.anomaliesSub'),
            valueClass: 'text-gray-900 dark:text-white'
          },
          {
            label: t('dashboard.kpi.quality'),
            emoji: '⭐',
            value: `${Math.round(stats.quality_score * 100)}%`,
            sub: t('dashboard.kpi.qualitySub'),
            valueClass: stats.quality_score >= 0.8 ? 'text-green-600' : stats.quality_score >= 0.6 ? 'text-orange-500' : 'text-red-600'
          },
          {
            label: t('dashboard.kpi.sources'),
            emoji: '🗄️',
            value: sources.length,
            sub: `${stats.total_records} ${t('dashboard.sources.records')}`,
            valueClass: 'text-gray-900 dark:text-white'
          },
          {
            label: t('dashboard.kpi.corrections'),
            emoji: '🔧',
            value: corrections.pending,
            sub: `${corrections.approved} ${t('dashboard.kpi.correctionsSub')}`,
            valueClass: 'text-orange-500'
          },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.label}</span>
              <span className="text-2xl">{card.emoji}</span>
            </div>
            <p className={`text-3xl font-bold ${card.valueClass}`}>{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Breakdown + Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.breakdown.title')}</h2>
          {stats.total_anomalies === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('dashboard.breakdown.empty')}</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: t('dashboard.breakdown.duplicates'), value: stats.breakdown.duplicates,    color: 'bg-red-500' },
                { label: t('dashboard.breakdown.outliers'),   value: stats.breakdown.outliers,      color: 'bg-orange-500' },
                { label: t('dashboard.breakdown.missing'),    value: stats.breakdown.missing,       color: 'bg-yellow-500' },
                { label: t('dashboard.breakdown.format'),     value: stats.breakdown.format_errors, color: 'bg-purple-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: stats.total_anomalies > 0 ? `${(item.value / stats.total_anomalies) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.sources.title')}</h2>
          {sources.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.sources.empty')}</p>
          ) : (
            <div className="space-y-3">
              {sources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{source.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {source.type.toUpperCase()} — {source.record_count || 0} {t('dashboard.sources.records')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${source.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {source.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
