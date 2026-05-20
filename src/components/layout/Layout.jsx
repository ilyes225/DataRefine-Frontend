import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout({ children, onLogout, user }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar onLogout={onLogout} user={user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;