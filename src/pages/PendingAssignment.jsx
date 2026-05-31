import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';

export default function PendingAssignment() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#111318] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white dark:bg-[#1a1d23] border border-gray-200/80 dark:border-white/[0.06] rounded-2xl p-8 text-center shadow-sm">

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>

          {/* Title */}
          <h1 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            En attente d'assignation
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed mb-6">
            Votre compte est créé et vérifié. Un administrateur doit vous assigner à un client avant que vous puissiez accéder à la plateforme.
          </p>

          {/* Info box */}
          <div className="bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-3 mb-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Si l'attente est trop longue, contactez votre administrateur.
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:text-red-500 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          DataRefine · Smart Data Quality
        </p>

      </div>
    </div>
  );
}