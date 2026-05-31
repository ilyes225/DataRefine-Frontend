import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TeamPanel from './TeamPanel';

function Layout({ children, onLogout, user }) {
  const [teamOpen, setTeamOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Navbar
        onLogout={onLogout}
        user={user}
        onToggleTeam={() => setTeamOpen(prev => !prev)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>

      {/* Team Panel — consultant only */}
      {user?.role === 'consultant' && (
        <TeamPanel open={teamOpen} onClose={() => setTeamOpen(false)} />
      )}
    </div>
  );
}

export default Layout;