import { useState, useEffect } from 'react';
import { sourcesAPI } from '../api/sources';
import { uploadAPI } from '../api/upload';
import apiClient from '../api/client';
import { useTranslation } from '../i18n';

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

  // ── Preview ──
  const [previewSource, setPreviewSource]   = useState(null);
  const [previewData, setPreviewData]       = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [dbForm, setDbForm] = useState({
    type: 'postgresql', host: 'localhost', port: '5432',
    database: '', user: 'postgres', password: '', table_name: '', source_name: ''
  });

  const [apiForm, setApiForm] = useState({
    url: '', method: 'GET', source_name: '', api_key: '', data_path: ''
  });

  useEffect(() => { fetchSources(); }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await sourcesAPI.getAll();
      setSources(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error('Erreur fetchSources:', error); }
    finally { setLoading(false); }
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
      setPendingExcelFile(file);
      setSelectedSheet(0);
      setExcelSheets([]);
      const sheets = await readExcelSheets(file);
      if (sheets && sheets.length > 1) {
        setExcelSheets(sheets);
        setMessage({ type: 'info', text: t('sources.file.sheetInfo')(sheets.length) });
      } else {
        await importExcel(file, sourceName, 0);
      }
      return;
    }

    setUploading(true);
    try {
      let res;
      if (file.name.endsWith('.csv'))       res = await uploadAPI.uploadCSV(file, sourceName);
      else if (file.name.endsWith('.xml'))  res = await uploadAPI.uploadXML(file, sourceName);
      else {
        setMessage({ type: 'error', text: t('sources.file.unsupported') });
        setUploading(false);
        return;
      }
      await handleImportSuccess(res, sourceName);
    } catch (error) {
      console.error('Erreur:', error.response?.data || error.message);
      setMessage({ type: 'error', text: t('sources.file.errorImport') });
    } finally { setUploading(false); }
  };

  const importExcel = async (file, sourceName, sheetName) => {
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadAPI.uploadExcel(file, sourceName, sheetName);
      await handleImportSuccess(res, sourceName);
      setPendingExcelFile(null);
      setExcelSheets([]);
    } catch (error) {
      console.error('Erreur:', error.response?.data || error.message);
      setMessage({ type: 'error', text: t('sources.file.errorExcel') });
    } finally { setUploading(false); }
  };

  const handleImportSuccess = async (res, sourceName) => {
    const data = parseResponse(res.data);
    if (!data?.dataset_id) {
      setMessage({ type: 'error', text: '❌ dataset_id manquant (check backend)' });
      return;
    }
    setMessage({
      type: 'success',
      text: t('sources.success.imported')(data.records_imported)
    });
    fetchSources();
  };

  const handleLoadTables = async () => {
    if (!dbForm.host || !dbForm.database || !dbForm.user) {
      setMessage({ type: 'error', text: t('sources.db.errorRequired') });
      return;
    }
    setLoadingTables(true);
    setDbTables([]);
    setDbForm(f => ({ ...f, table_name: '' }));
    setMessage(null);
    try {
      const res = await apiClient.post('/upload/tables', {
        type: dbForm.type, host: dbForm.host, port: parseInt(dbForm.port),
        database: dbForm.database, user: dbForm.user, password: dbForm.password
      });
      if (res.data.tables && res.data.tables.length > 0) {
        setDbTables(res.data.tables);
      } else {
        setMessage({ type: 'error', text: t('sources.db.errorNoTables') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('sources.db.errorConnect')(err.response?.data?.error || err.message) });
    } finally { setLoadingTables(false); }
  };

  const handleDBConnect = async () => {
    if (!dbForm.host || !dbForm.database || !dbForm.user) {
      setMessage({ type: 'error', text: t('sources.db.errorRequired') });
      return;
    }
    if (!dbForm.table_name) {
      setMessage({ type: 'error', text: t('sources.db.errorTable') });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/upload/database', {
        connection_params: {
          type: dbForm.type, host: dbForm.host, port: parseInt(dbForm.port),
          database: dbForm.database, user: dbForm.user, password: dbForm.password
        },
        table_name: dbForm.table_name,
        source_name: dbForm.source_name || `${dbForm.database}_${dbForm.table_name}`
      });
      const data = parseResponse(res.data);
      if (!data?.dataset_id) throw new Error('dataset_id manquant');
      setMessage({ type: 'success', text: t('sources.success.imported')(data.records_imported) });
      fetchSources();
    } catch (error) {
      setMessage({ type: 'error', text: t('sources.db.errorConnect')(error.response?.data?.error || error.message) });
    } finally { setUploading(false); }
  };

  const handleAPIConnect = async () => {
    if (!apiForm.url) {
      setMessage({ type: 'error', text: t('sources.api.errorUrl') });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const api_config = {
        url: apiForm.url, method: apiForm.method, data_path: apiForm.data_path || null,
        headers: apiForm.api_key ? { 'X-API-Key': apiForm.api_key } : {}
      };
      const res = await apiClient.post('/upload/api', {
        api_config, source_name: apiForm.source_name || 'api_source'
      });
      const data = parseResponse(res.data);
      if (!data?.dataset_id) throw new Error('dataset_id manquant');
      setMessage({ type: 'success', text: t('sources.success.imported')(data.records_imported) });
      fetchSources();
    } catch (error) {
      setMessage({ type: 'error', text: t('sources.db.errorConnect')(error.response?.data?.error || error.message) });
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('sources.list.deleteConfirm'))) return;
    try { await sourcesAPI.delete(id); fetchSources(); }
    catch (error) { console.error('Erreur delete source:', error); }
  };

  const handlePreview = async (source) => {
    setPreviewSource(source);
    setPreviewData(null);
    setPreviewLoading(true);
    try {
      const res = await apiClient.get(`/sources/${source.id}/preview`);
      setPreviewData(res.data);
    } catch (err) {
      console.error('Erreur preview:', err);
      setPreviewData({ error: 'Impossible de charger l\'aperçu.' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewSource(null);
    setPreviewData(null);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  const tabs = [
    { id: 'file',     label: t('sources.tabs.file') },
    { id: 'database', label: t('sources.tabs.database') },
    { id: 'api',      label: t('sources.tabs.api') },
  ];

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('sources.title')}</h1>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(null); setPendingExcelFile(null); setExcelSheets([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">

        {/* ── Fichier ── */}
        {activeTab === 'file' && (
          <div className="text-center">
            <p className="text-4xl mb-3">📁</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('sources.file.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('sources.file.subtitle')}</p>
            <label className="cursor-pointer">
              <span className={`px-6 py-3 rounded-lg text-white font-medium transition ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}>
                {uploading ? t('sources.file.loading') : t('sources.file.button')}
              </span>
              <input type="file" accept=".csv,.xml,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>

            {pendingExcelFile && excelSheets.length > 1 && (
              <div className="mt-6 text-left max-w-sm mx-auto">
                <label className={labelClass}>{t('sources.file.sheetLabel')}</label>
                <select value={selectedSheet} onChange={e => setSelectedSheet(e.target.value)} className={inputClass}>
                  {excelSheets.map((name, i) => <option key={i} value={name}>{name}</option>)}
                </select>
                <button
                  onClick={() => importExcel(pendingExcelFile, pendingExcelFile.name.replace(/\.[^/.]+$/, ''), selectedSheet)}
                  disabled={uploading}
                  className={`mt-3 w-full py-2 rounded-lg text-white font-medium transition ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}>
                  {uploading ? t('sources.file.loading') : t('sources.file.sheetButton')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Base de données ── */}
        {activeTab === 'database' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('sources.db.title')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('sources.db.typeLabel')}</label>
                <select value={dbForm.type}
                  onChange={e => setDbForm({ ...dbForm, type: e.target.value, port: e.target.value === 'mysql' ? '3306' : '5432', table_name: '' })}
                  className={inputClass}>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('sources.db.nameLabel')}</label>
                <input type="text" placeholder={t('sources.db.namePlaceholder')} value={dbForm.source_name}
                  onChange={e => setDbForm({ ...dbForm, source_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('sources.db.hostLabel')}</label>
                <input type="text" placeholder="localhost" value={dbForm.host}
                  onChange={e => setDbForm({ ...dbForm, host: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('sources.db.portLabel')}</label>
                <input type="number" value={dbForm.port}
                  onChange={e => setDbForm({ ...dbForm, port: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('sources.db.databaseLabel')}</label>
                <input type="text" placeholder={t('sources.db.databasePlaceholder')} value={dbForm.database}
                  onChange={e => setDbForm({ ...dbForm, database: e.target.value, table_name: '', dbTables: [] })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('sources.db.userLabel')}</label>
                <input type="text" placeholder={t('sources.db.userPlaceholder')} value={dbForm.user}
                  onChange={e => setDbForm({ ...dbForm, user: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>{t('sources.db.passwordLabel')}</label>
                <input type="password" placeholder="••••••••" value={dbForm.password}
                  onChange={e => setDbForm({ ...dbForm, password: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <button onClick={handleLoadTables} disabled={loadingTables || !dbForm.host || !dbForm.database}
                  className={`w-full py-2 rounded-lg text-white font-medium transition ${
                    loadingTables || !dbForm.host || !dbForm.database ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                  }`}>
                  {loadingTables ? t('sources.db.loadingTables') : t('sources.db.loadTablesButton')}
                </button>
              </div>
              {dbTables.length > 0 && (
                <div className="col-span-2">
                  <label className={labelClass}>
                    {t('sources.db.tableLabel')}
                    <span className="text-gray-400 font-normal ml-2">({t('sources.db.tableFound')(dbTables.length)})</span>
                  </label>
                  <select value={dbForm.table_name} onChange={e => setDbForm({ ...dbForm, table_name: e.target.value })} className={inputClass}>
                    <option value="">{t('sources.db.tableSelect')}</option>
                    {dbTables.map(t_ => <option key={t_} value={t_}>{t_}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button onClick={handleDBConnect} disabled={uploading || !dbForm.table_name}
              className={`mt-6 px-6 py-3 rounded-lg text-white font-medium transition ${
                uploading || !dbForm.table_name ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
              }`}>
              {uploading ? t('sources.db.connecting') : t('sources.db.connectButton')}
            </button>
          </div>
        )}

        {/* ── API REST ── */}
        {activeTab === 'api' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('sources.api.title')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>{t('sources.api.urlLabel')}</label>
                <input type="url" placeholder={t('sources.api.urlPlaceholder')} value={apiForm.url}
                  onChange={e => setApiForm({ ...apiForm, url: e.target.value })} className={inputClass} />
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
                <input type="text" placeholder={t('sources.api.namePlaceholder')} value={apiForm.source_name}
                  onChange={e => setApiForm({ ...apiForm, source_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('sources.api.keyLabel')}</label>
                <input type="text" placeholder={t('sources.api.keyPlaceholder')} value={apiForm.api_key}
                  onChange={e => setApiForm({ ...apiForm, api_key: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('sources.api.pathLabel')}</label>
                <input type="text" placeholder={t('sources.api.pathPlaceholder')} value={apiForm.data_path}
                  onChange={e => setApiForm({ ...apiForm, data_path: e.target.value })} className={inputClass} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('sources.api.pathHint')}</p>
              </div>
            </div>
            <button onClick={handleAPIConnect} disabled={uploading}
              className={`mt-6 px-6 py-3 rounded-lg text-white font-medium transition ${
                uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
              }`}>
              {uploading ? t('sources.api.connecting') : t('sources.api.connectButton')}
            </button>
          </div>
        )}

        {/* Message retour */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : message.type === 'info'  ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Liste des sources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('sources.list.title')(sources.length)}</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : sources.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{t('sources.list.empty')}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {[t('sources.list.colName'), t('sources.list.colType'), t('sources.list.colStatus'), t('sources.list.colCreated'), t('sources.list.colActions')].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sources.map(source => (
                <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{source.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                      {source.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      source.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {source.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(source.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <button
                      onClick={() => handlePreview(source)}
                      className="text-teal-600 hover:text-teal-800 text-sm font-medium">
                      Aperçu
                    </button>
                    <button onClick={() => handleDelete(source.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                      {t('sources.list.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Preview ── */}
      {previewSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Aperçu — {previewSource.name}
                </h2>
                {previewData && !previewData.error && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {previewData.total_records} lignes · {previewData.total_columns} colonnes · affichage des 10 premières lignes
                  </p>
                )}
              </div>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-light leading-none">×</button>
            </div>

            <div className="overflow-auto flex-1 p-4">
              {previewLoading && (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                </div>
              )}
              {!previewLoading && previewData?.error && (
                <div className="text-center text-red-500 py-10">{previewData.error}</div>
              )}
              {!previewLoading && previewData && !previewData.error && previewData.columns.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">Aucune donnée disponible.</div>
              )}
              {!previewLoading && previewData && !previewData.error && previewData.columns.length > 0 && (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-teal-50 dark:bg-teal-900/30">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-teal-600 dark:text-teal-300 border border-gray-200 dark:border-gray-600 w-10">#</th>
                      {previewData.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-teal-600 dark:text-teal-300 border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                        <td className="px-3 py-2 text-xs text-gray-400 border border-gray-200 dark:border-gray-600 text-center">{i + 1}</td>
                        {previewData.columns.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 max-w-xs truncate">
                            {row[col] === null || row[col] === undefined || row[col] === ''
                              ? <span className="text-gray-300 dark:text-gray-600 italic">—</span>
                              : String(row[col])
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={closePreview} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
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