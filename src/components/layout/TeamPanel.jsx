import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { getMyTeam } from '../../api/projects';
import { useTranslation } from '../../i18n/index';

export default function TeamPanel({ open, onClose }) {
  const { t } = useTranslation();
  const [team, setTeam] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMyTeam()
      .then(res => setTeam(res.data))
      .catch(() => setTeam({}))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-72 z-40 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-500" />
            <span className="font-semibold text-gray-800 dark:text-white text-sm">
              {t('teamPanel.title')}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
            </div>
          ) : Object.keys(team).length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('teamPanel.empty')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(team).map(([projectName, data]) => (
                <div key={projectName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={data.project.logo_url}
                        alt={projectName}
                        className="w-5 h-5 object-contain"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-gray-500">${projectName[0]}</span>`;
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {projectName}
                    </span>
                  </div>

                  {data.members.length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-2">{t('teamPanel.onlyMember')}</p>
                  ) : (
                    <div className="space-y-2">
                      {data.members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0">
                            {member.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{member.username}</p>
                            <p className="text-xs text-gray-400 truncate">{member.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}