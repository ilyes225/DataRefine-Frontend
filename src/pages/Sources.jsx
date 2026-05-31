import { useState, useEffect } from 'react';
import { sourcesAPI } from '../api/sources';
import { uploadAPI } from '../api/upload';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';
import { Upload, Database, Globe, X, Eye, Trash2, Filter } from 'lucide-react';

function Sources() {
  const { t } = useTranslation();
  const [sources, setSources]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [message, setMessage]             = useState(null);
  const [activeTab, setActiveTab]         = useState('file');
  const [dbTables, setDbTables]           = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [excelSheets, setExcelSheets]     = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [pendingExcelFile, setPendingExcelFile] = useState(null);
  const [previewSource, setPreviewSource]   = useState(null);
  const [previewData, setPreviewData]       = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [projects, setProjects]             = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [userRole, setUserRole]             = useState(null);

  const [dbForm, setDbForm] = useState({
    type: 'postgresql', host: 'localhost', port: '5432',
    database: '', user: 'postgres', password: '', table_name: '', source_name: ''
  });
  const [apiForm, setApiForm] = useState({
    url: '', method: 'GET', source_name: '', api_key: '', data_path: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUserRole(u.role);
    }
    fetchSources();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchSources();
  }, [selectedProject]);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await sourcesAPI.getAll(selectedProject || null);
      setSources(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get('/projects/');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
  };

  const parseResponse = (data) => {
    if (typeof data === 'string') { try { return JSON.parse(data); } catch { return null; } }
    return data;
  };

  const readExcelSheets = async (file) => {
    try {
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { bookSheets: true });
      return workbook.SheetNames;
    } catch { return null; }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sourceName = file.name.replace(/\.[^/.]+$/, '');
    setMessage(null);
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setPendingExcelFile(file); setSelectedSheet(0); setExcelSheets([]);
      const sheets = await readExcelSheets(file);
      if (sheets && sheets.length > 1) { setExcelSheets(sheets); setMessage({ type: 'info', text: t('sources.file.sheetInfo')(sheets.length) }); }
      else { await importExcel(file, sourceName, 0); }
      return;
    }
    setUploading(true);
    try {
      let res;
      if (file.name.endsWith('.csv'))      res = await uploadAPI.uploadCSV(file, sourceName);
      else if (file.name.endsWith('.xml')) res = await uploadAPI.uploadXML(file, sourceName);
      else { setMessage({ type: 'error', text: t('sources.file.unsupported') }); setUploading(false); return; }
      await handleImportSuccess(res);
    } catch { setMessage({ type: 'error', text: t('sources.file.errorImport') }); }
    finally { setUploading(false); }
  };

  const importExcel = async (file, sourceName, sheetName) => {
    setUploading(true); setMessage(null);
    try { const res = await uploadAPI.uploadExcel(file, sourceName, sheetName); await handleImportSuccess(res); setPendingExcelFile(null); setExcelSheets([]); }
    catch { setMessage({ type: 'error', text: t('sources.file.errorExcel') }); }
    finally { setUploading(false); }
  };

  const handleImportSuccess = async (res) => {
    const data = parseResponse(res.data);
    if (!data?.dataset_id) { setMessage({ type: 'error', text: '❌ dataset_id manquant' }); return; }
    setMessage({ type: 'success', text: t('sources.success.imported')(data.records_imported) });
    fetchSources();
  };

  const handleLoadTables = async () => {
    if (!dbForm.host || !dbForm.database || !dbForm.user) { setMessage({ type: 'error', text: t('sources.db.errorRequired') }); return; }
    setLoadingTables(true); setDbTables([]); setDbForm(f => ({ ...f, table_name: '' })); setMessage(null);
    try {
      const res = await apiClient.post('/upload/tables', { type: dbForm.type, host: dbForm.host, port: parseInt(dbForm.port), database: dbForm.database, user: dbForm.user, password: dbForm.password });
      if (res.data.tables?.length > 0) setDbTables(res.data.tables);
      else setMessage({ type: 'error', text: t('sources.db.errorNoTables') });
    } catch (err) { setMessage({ type: 'error', text: t('sources.db.errorConnect')(err.response?.data?.error || err.message) }); }
    finally { setLoadingTables(false); }
  };

  const handleDBConnect = async () => {
    if (!dbForm.host || !dbForm.database || !dbForm.user) { setMessage({ type: 'error', text: t('sources.db.errorRequired') }); return; }
    if (!dbForm.table_name) { setMessage({ type: 'error', text: t('sources.db.errorTable') }); return; }
    setUploading(true); setMessage(null);
    try {
      const res = await apiClient.post('/upload/database', { connection_params: { type: dbForm.type, host: dbForm.host, port: parseInt(dbForm.port), database: dbForm.database, user: dbForm.user, password: dbForm.password }, table_name: dbForm.table_name, source_name: dbForm.source_name || `${dbForm.database}_${dbForm.table_name}` });
      const data = parseResponse(res.data);
      if (!data?.dataset_id) throw new Error('dataset_id manquant');
      setMessage({ type: 'success', text: t('sources.success.imported')(data.records_imported) });
      fetchSources();
    } catch (error) { setMessage({ type: 'error', text: t('sources.db.errorConnect')(error.response?.data?.error || error.message) }); }
    finally { setUploading(false); }
  };

  const handleAPIConnect = async () => {
    if (!apiForm.url) { setMessage({ type: 'error', text: t('sources.api.errorUrl') }); return; }
    setUploading(true); setMessage(null);
    try {
      const res = await apiClient.post('/upload/api', { api_config: { url: apiForm.url, method: apiForm.method, data_path: apiForm.data_path || null, headers: apiForm.api_key ? { 'X-API-Key': apiForm.api_key } : {} }, source_name: apiForm.source_name || 'api_source' });
      const data = parseResponse(res.data);
      if (!data?.dataset_id) throw new Error('dataset_id manquant');
      setMessage({ type: 'success', text: t('sources.success.imported')(data.records_imported) });
      fetchSources();
    } catch (error) { setMessage({ type: 'error', text: t('sources.db.errorConnect')(error.response?.data?.error || error.message) }); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('sources.list.deleteConfirm'))) return;
    try { await sourcesAPI.delete(id); fetchSources(); }
    catch (e) { console.error(e); }
  };

  const handlePreview = async (source) => {
    setPreviewSource(source); setPreviewData(null); setPreviewLoading(true);
    try { const res = await apiClient.get(`/sources/${source.id}/preview`); setPreviewData(res.data); }
    catch { setPreviewData({ error: "Impossible de charger l'aperçu." }); }
    finally { setPreviewLoading(false); }
  };

  const inputClass = "w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 dark:focus:ring-teal-400 transition";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-white/40 mb-1.5 uppercase tracking-wider";

  const tabs = [
    { id: 'file',     label: t('sources.tabs.file'),     icon: Upload },
    { id: 'database', label: t('sources.tabs.database'), icon: Database },
    { id: 'api',      label: t('sources.tabs.api'),      icon: Globe },
  ];

  const typeColors = {
    csv: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20',
    xml: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    excel: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    postgresql: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    mysql: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    api: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
  };

  return (
    <div className="max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">{t('sources.title')}</h1>
          <p className="text-sm text-gray-400 dark:text-white/30 mt-0.5">Importez et gérez vos sources de données</p>
        </div>

        {/* Filtre projet — admin seulement */}
        {userRole === 'admin' && projects.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 dark:text-white/30" />
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-white/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
            >
              <option value="">Tous les projets</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Import card */}
      <div className="bg-white dark:bg-[#16181d] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/[0.06]">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage(null); setPendingExcelFile(null); setExcelSheets([]); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition -mb-px ${
                activeTab === tab.id
                  ? 'border-teal-500 dark:border-teal-400 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60'
              }`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* File */}
          {activeTab === 'file' && (
            <div>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition ${
                uploading
                  ? 'border-gray-200 dark:border-white/[0.06] opacity-50 cursor-not-allowed'
                  : 'border-gray-200 dark:border-white/[0.08] hover:border-teal-400 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/5'
              }`}>
                <Upload size={28} className="text-gray-300 dark:text-white/20 mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-white/60 mb-1">
                  {uploading ? t('sources.file.loading') : t('sources.file.button')}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/25">{t('sources.file.subtitle')}</p>
                <input type="file" accept=".csv,.xml,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>

              {pendingExcelFile && excelSheets.length > 1 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-xl">
                  <label className={labelClass}>{t('sources.file.sheetLabel')}</label>
                  <div className="flex gap-2 mt-1">
                    <select value={selectedSheet} onChange={e => setSelectedSheet(e.target.value)} className={`flex-1 ${inputClass}`}>
                      {excelSheets.map((name, i) => <option key={i} value={name}>{name}</option>)}
                    </select>
                    <button onClick={() => importExcel(pendingExcelFile, pendingExcelFile.name.replace(/\.[^/.]+$/, ''), selectedSheet)} disabled={uploading}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                      {uploading ? '...' : t('sources.file.sheetButton')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database */}
          {activeTab === 'database' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelClass}>{t('sources.db.typeLabel')}</label>
                  <select value={dbForm.type} onChange={e => setDbForm({ ...dbForm, type: e.target.value, port: e.target.value === 'mysql' ? '3306' : '5432', table_name: '' })} className={inputClass}>
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('sources.db.nameLabel')}</label>
                  <input type="text" placeholder={t('sources.db.namePlaceholder')} value={dbForm.source_name} onChange={e => setDbForm({ ...dbForm, source_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.db.hostLabel')}</label>
                  <input type="text" placeholder="localhost" value={dbForm.host} onChange={e => setDbForm({ ...dbForm, host: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.db.portLabel')}</label>
                  <input type="number" value={dbForm.port} onChange={e => setDbForm({ ...dbForm, port: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.db.databaseLabel')}</label>
                  <input type="text" placeholder={t('sources.db.databasePlaceholder')} value={dbForm.database} onChange={e => setDbForm({ ...dbForm, database: e.target.value, table_name: '' })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.db.userLabel')}</label>
                  <input type="text" placeholder={t('sources.db.userPlaceholder')} value={dbForm.user} onChange={e => setDbForm({ ...dbForm, user: e.target.value })} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>{t('sources.db.passwordLabel')}</label>
                  <input type="password" placeholder="••••••••" value={dbForm.password} onChange={e => setDbForm({ ...dbForm, password: e.target.value })} className={inputClass} />
                </div>
              </div>
              <button onClick={handleLoadTables} disabled={loadingTables || !dbForm.host || !dbForm.database}
                className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 text-sm font-medium transition mb-3">
                {loadingTables ? t('sources.db.loadingTables') : t('sources.db.loadTablesButton')}
              </button>
              {dbTables.length > 0 && (
                <div className="mb-4">
                  <label className={labelClass}>{t('sources.db.tableLabel')} <span className="text-gray-300 dark:text-white/20 normal-case">({dbTables.length} trouvées)</span></label>
                  <select value={dbForm.table_name} onChange={e => setDbForm({ ...dbForm, table_name: e.target.value })} className={inputClass}>
                    <option value="">{t('sources.db.tableSelect')}</option>
                    {dbTables.map(t_ => <option key={t_} value={t_}>{t_}</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleDBConnect} disabled={uploading || !dbForm.table_name}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition">
                {uploading ? t('sources.db.connecting') : t('sources.db.connectButton')}
              </button>
            </div>
          )}

          {/* API */}
          {activeTab === 'api' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className={labelClass}>{t('sources.api.urlLabel')}</label>
                  <input type="url" placeholder={t('sources.api.urlPlaceholder')} value={apiForm.url} onChange={e => setApiForm({ ...apiForm, url: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.api.methodLabel')}</label>
                  <select value={apiForm.method} onChange={e => setApiForm({ ...apiForm, method: e.target.value })} className={inputClass}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('sources.api.nameLabel')}</label>
                  <input type="text" placeholder={t('sources.api.namePlaceholder')} value={apiForm.source_name} onChange={e => setApiForm({ ...apiForm, source_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.api.keyLabel')}</label>
                  <input type="text" placeholder={t('sources.api.keyPlaceholder')} value={apiForm.api_key} onChange={e => setApiForm({ ...apiForm, api_key: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('sources.api.pathLabel')}</label>
                  <input type="text" placeholder={t('sources.api.pathPlaceholder')} value={apiForm.data_path} onChange={e => setApiForm({ ...apiForm, data_path: e.target.value })} className={inputClass} />
                </div>
              </div>
              <button onClick={handleAPIConnect} disabled={uploading}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition">
                {uploading ? t('sources.api.connecting') : t('sources.api.connectButton')}
              </button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm border ${
              message.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20'
              : message.type === 'info'  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Sources list */}
      <div className="bg-white dark:bg-[#16181d] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-medium text-gray-600 dark:text-white/60">
            {t('sources.list.title')(sources.length)}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-white/20">
            <Database size={28} className="mb-2" />
            <p className="text-sm">{t('sources.list.empty')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                {[t('sources.list.colName'), t('sources.list.colType'), 'Importé par', t('sources.list.colStatus'), t('sources.list.colCreated'), ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[11px] font-medium text-gray-400 dark:text-white/25 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {sources.map(source => (
                <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-white/80">{source.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${typeColors[source.type] || typeColors.api}`}>
                      {source.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-white/40">
                    {source.imported_by || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                      source.status === 'active'
                        ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/30 border-gray-200 dark:border-white/10'
                    }`}>
                      {source.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-white/25">
                    {new Date(source.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handlePreview(source)}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDelete(source.id)}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Modal */}
      {previewSource && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#16181d] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Aperçu — {previewSource.name}</h2>
                {previewData && !previewData.error && (
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                    {previewData.total_records} lignes · {previewData.total_columns} colonnes
                  </p>
                )}
              </div>
              <button onClick={() => { setPreviewSource(null); setPreviewData(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              {previewLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>}
              {!previewLoading && previewData?.error && <p className="text-center text-red-500 py-8">{previewData.error}</p>}
              {!previewLoading && previewData && !previewData.error && previewData.columns?.length > 0 && (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-3 py-2 text-left font-medium text-gray-400 dark:text-white/25 border border-gray-100 dark:border-white/[0.06] w-8">#</th>
                      {previewData.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-white/40 border border-gray-100 dark:border-white/[0.06] whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2 text-gray-300 dark:text-white/20 border border-gray-100 dark:border-white/[0.06] text-center">{i + 1}</td>
                        {previewData.columns.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 dark:text-white/60 border border-gray-100 dark:border-white/[0.06] max-w-[180px] truncate">
                            {row[col] == null || row[col] === '' ? <span className="text-gray-200 dark:text-white/15 italic">—</span> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.06] flex justify-end">
              <button onClick={() => { setPreviewSource(null); setPreviewData(null); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sources;