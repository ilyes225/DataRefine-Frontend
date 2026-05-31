import { useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { sourcesAPI } from '../api/sources';
import { getProjects, createProject, assignUser, unassignUser, deleteProject } from '../api/projects';
import { ChevronDown, ChevronUp, Database, Trash2, Eye, X, Plus, Building2, Users, Globe, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function UserManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userSources, setUserSources] = useState({});
  const [loadingSources, setLoadingSources] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', domain: '' });
  const [creatingProject, setCreatingProject] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningProject, setAssigningProject] = useState(null);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState({});

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data);
    } catch {
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      showToast('Erreur lors du chargement des projets', 'error');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (activeTab === 'projects') fetchProjects(); }, [activeTab]);

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'consultant' : 'admin';
    setUpdating(user.id);
    try {
      await authAPI.updateUserRole(user.id, newRole);
      showToast(`Rôle de ${user.username} mis à jour en ${newRole}`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleExpandUser = async (userId) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (userSources[userId]) return;
    setLoadingSources(userId);
    try {
      const res = await sourcesAPI.getSourcesByUser(userId);
      setUserSources(prev => ({ ...prev, [userId]: res.data }));
    } catch {
      showToast('Erreur lors du chargement des sources', 'error');
    } finally {
      setLoadingSources(null);
    }
  };

  const handleDeleteSource = async (sourceId, userId) => {
    if (!window.confirm('Supprimer cette source ?')) return;
    try {
      await sourcesAPI.adminDeleteSource(sourceId);
      setUserSources(prev => ({ ...prev, [userId]: prev[userId].filter(s => s.id !== sourceId) }));
      showToast('Source supprimée');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handlePreview = async (sourceId) => {
    setLoadingPreview(sourceId);
    try {
      const res = await sourcesAPI.adminPreviewSource(sourceId);
      setPreviewData({ sourceId, ...res.data });
    } catch {
      showToast('Erreur lors du chargement du preview', 'error');
    } finally {
      setLoadingPreview(null);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.domain.trim()) {
      showToast('Nom et domaine requis', 'error');
      return;
    }
    setCreatingProject(true);
    try {
      await createProject(newProject.name.trim(), newProject.domain.trim());
      showToast(`Projet "${newProject.name}" créé`);
      setNewProject({ name: '', domain: '' });
      setShowCreateForm(false);
      fetchProjects();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la création', 'error');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleAssignUser = async (projectId) => {
    const userId = selectedUserToAssign[projectId];
    if (!userId) return;
    setAssigningProject(projectId);
    try {
      await assignUser(projectId, parseInt(userId));
      showToast('Consultant assigné');
      setSelectedUserToAssign(prev => ({ ...prev, [projectId]: '' }));
      fetchProjects();
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de l'assignation", 'error');
    } finally {
      setAssigningProject(null);
    }
  };

  const handleUnassignUser = async (projectId, userId, username) => {
    if (!window.confirm(`Retirer ${username} de ce projet ?`)) return;
    try {
      await unassignUser(projectId, userId);
      showToast(`${username} retiré du projet`);
      fetchProjects();
      fetchUsers();
    } catch {
      showToast('Erreur lors de la désassignation', 'error');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Supprimer le projet "${projectName}" ?`)) return;
    try {
      await deleteProject(projectId);
      showToast(`Projet "${projectName}" supprimé`);
      fetchProjects();
      fetchUsers();
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const getUnassignedToProject = (project) => {
    const assignedIds = project.members?.map(m => m.id) || [];
    return users.filter(u => u.role === 'consultant' && !assignedIds.includes(u.id));
  };

  const typeIcon = (type) => {
    const icons = { csv: '📄', xml: '📋', excel: '📊', postgresql: '🐘', mysql: '🐬', api: '🔌' };
    return icons[type] || '📁';
  };

  return (
    <div className="max-w-7xl space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
            : 'bg-red-50 dark:bg-red-500/[0.08] text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          {toast.message}
        </div>
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPreviewData(null)}>
          <div className="bg-white dark:bg-[#1a1d23] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-gray-200/80 dark:border-white/[0.06]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Aperçu des données</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {previewData.total_records} lignes · {previewData.total_columns} colonnes
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewData(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-5">
              {previewData.rows?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                      {previewData.columns.map(col => (
                        <th key={col} className="text-left px-3 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {previewData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        {previewData.columns.map(col => (
                          <td key={col} className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-nowrap max-w-[200px] truncate">
                            {row[col] ?? <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-10">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t('users.title')}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {t('users.subtitle')}
          </p>
        </div>
        <button
          onClick={() => { fetchUsers(); if (activeTab === 'projects') fetchProjects(); }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('users.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200/80 dark:border-white/[0.06]">
        {[
          { key: 'users',    label: t('users.tabs.users'),    icon: Users },
          { key: 'projects', label: t('users.tabs.projects'), icon: Building2 },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB UTILISATEURS ── */}
      {activeTab === 'users' && (
        loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
            <span className="text-sm text-gray-400 dark:text-gray-500">Chargement…</span>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-400 font-semibold text-xs shrink-0 border border-teal-100 dark:border-teal-500/20">
                    {user.username?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-5 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.username}</span>
                      {currentUser?.id === user.id && (
                        <span className="text-[10px] bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.08] shrink-0">
                          {t('users.actions.you')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium w-fit border ${
                      user.role === 'admin'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      {user.role === 'admin' ? t('users.roles.admin') : t('users.roles.consultant')}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium w-fit border ${
                      user.is_verified
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                        : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/[0.08]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_verified ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {user.is_verified ? 'Vérifié' : 'Non vérifié'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {user.projects?.length > 0 ? user.projects.map(p => (
                        <div key={p.id} className="flex items-center gap-1 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-md px-1.5 py-0.5">
                          <img src={p.logo_url} alt={p.name} className="w-3 h-3 rounded-sm object-contain" onError={e => { e.target.style.display = 'none' }} />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{p.name}</span>
                        </div>
                      )) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600 italic">Non assigné</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {currentUser?.id !== user.id && (
                      <button onClick={() => handleToggleRole(user)} disabled={updating === user.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border disabled:opacity-50 ${
                          user.role === 'admin'
                            ? 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.08]'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                        }`}>
                        {updating === user.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : user.role === 'admin' ? t('users.actions.demote') : t('users.actions.promote')
                        }
                      </button>
                    )}
                    <button onClick={() => handleExpandUser(user.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors">
                      <Database className="w-3 h-3" />
                      Sources
                      {expandedUser === user.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {expandedUser === user.id && (
                  <div className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.01] px-5 py-4">
                    {loadingSources === user.id ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-teal-500 animate-spin" /></div>
                    ) : !userSources[user.id] || userSources[user.id].length === 0 ? (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <Database className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                        <p className="text-xs text-gray-400 dark:text-gray-500">Aucun import pour cet utilisateur</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                          {userSources[user.id].length} source{userSources[user.id].length > 1 ? 's' : ''}
                        </p>
                        {userSources[user.id].map(source => (
                          <div key={source.id} className="flex items-center justify-between bg-white dark:bg-[#1a1d23] rounded-lg px-4 py-3 border border-gray-200/80 dark:border-white/[0.06] group">
                            <div className="flex items-center gap-3">
                              <span className="text-base">{typeIcon(source.type)}</span>
                              <div>
                                <p className="text-xs font-medium text-gray-800 dark:text-white">{source.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                                  {source.type.toUpperCase()} · {source.created_at ? new Date(source.created_at).toLocaleDateString('fr-FR') : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                source.status === 'active'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                  : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/[0.08]'
                              }`}>{source.status}</span>
                              <button onClick={() => handlePreview(source.id)} disabled={loadingPreview === source.id}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-all disabled:opacity-30">
                                {loadingPreview === source.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleDeleteSource(source.id, user.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── TAB PROJETS ── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              {t('users.projects.newProject')}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">{t('users.projects.createTitle')}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 block uppercase tracking-wider">{t('users.projects.nameLabel')}</label>
                  <input type="text" placeholder={t('users.projects.namePlaceholder')} value={newProject.name}
                    onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] text-gray-800 dark:text-white text-sm placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 block uppercase tracking-wider">{t('users.projects.domainLabel')}</label>
                  <input type="text" placeholder={t('users.projects.domainPlaceholder')} value={newProject.domain}
                    onChange={e => setNewProject(prev => ({ ...prev, domain: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] text-gray-800 dark:text-white text-sm placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-colors" />
                </div>
              </div>

              {newProject.domain && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50/60 dark:bg-white/[0.02] rounded-lg border border-gray-200/80 dark:border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center overflow-hidden">
                    <img src={`https://logo.clearbit.com/${newProject.domain}`} alt="logo preview" className="w-6 h-6 object-contain" onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{newProject.name || t('users.projects.nameLabel')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3" />{newProject.domain}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowCreateForm(false); setNewProject({ name: '', domain: '' }); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors border border-gray-200 dark:border-white/[0.08]">
                  {t('users.projects.cancel')}
                </button>
                <button onClick={handleCreateProject} disabled={creatingProject}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                  {creatingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('users.projects.createButton')}
                </button>
              </div>
            </div>
          )}

          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Aucun projet créé pour l'instant</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(project => (
                <div key={project.id} className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200/80 dark:border-white/[0.06] overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={project.logo_url} alt={project.name} className="w-6 h-6 object-contain"
                        onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-gray-400">${project.name[0]}</span>`; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">{project.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3" />{project.domain}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {t('users.projects.assigned')(project.member_count)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors">
                        <Users className="w-3 h-3" />
                        {t('users.projects.members')}
                        {expandedProject === project.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button onClick={() => handleDeleteProject(project.id, project.name)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {expandedProject === project.id && (
                    <div className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.01] px-5 py-4">
                      {getUnassignedToProject(project).length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <select value={selectedUserToAssign[project.id] || ''}
                            onChange={e => setSelectedUserToAssign(prev => ({ ...prev, [project.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1d23] text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-colors">
                            <option value="">{t('users.projects.assignPlaceholder')}</option>
                            {getUnassignedToProject(project).map(u => (
                              <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                            ))}
                          </select>
                          <button onClick={() => handleAssignUser(project.id)}
                            disabled={!selectedUserToAssign[project.id] || assigningProject === project.id}
                            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors">
                            {assigningProject === project.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('users.projects.assignButton')}
                          </button>
                        </div>
                      )}

                      {!project.members || project.members.length === 0 ? (
                        <div className="flex flex-col items-center py-6 gap-2">
                          <Users className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t('users.projects.noMembers')}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            {project.members.length} membre{project.members.length > 1 ? 's' : ''}
                          </p>
                          {project.members.map(member => (
                            <div key={member.id} className="flex items-center justify-between bg-white dark:bg-[#1a1d23] rounded-lg px-4 py-2.5 border border-gray-200/80 dark:border-white/[0.06] group">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-400 font-semibold text-[10px] border border-teal-100 dark:border-teal-500/20">
                                  {member.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-800 dark:text-white">{member.username}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{member.email}</p>
                                </div>
                              </div>
                              <button onClick={() => handleUnassignUser(project.id, member.id, member.username)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}