import { useState } from 'react';
import { authAPI } from '../api/auth';
import logo from '../assets/datarefine_logo.svg';

function Register({ onLogin }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.register(username, email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="DataRefine" style={{ height: '50px', width: '50px' }} />
            <p className="text-xl font-bold tracking-tight mt-2">
              <span className="text-teal-500">Data</span>
              <span className="text-gray-900 font-light">Refine</span>
            </p>
            <p className="text-xs text-gray-400 tracking-widest">SMART DATA QUALITY</p>
          </div>
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez votre email !</h2>
          <p className="text-gray-500 mb-6">
            Un email de vérification a été envoyé à <strong>{email}</strong>. 
            Cliquez sur le lien dans l'email pour activer votre compte.
          </p>
          <a href="/login" className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">
            Aller au Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="DataRefine" style={{ height: '50px', width: '50px' }} />
          <p className="text-xl font-bold tracking-tight mt-2">
            <span className="text-teal-500">Data</span>
            <span className="text-gray-900 font-light">Refine</span>
          </p>
          <p className="text-xs text-gray-400 tracking-widest">SMART DATA QUALITY</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 mt-1">Join DataRefine today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="johndoe"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-medium transition ${loading ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {loading ? '⏳ Creating account...' : '✅ Register'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-teal-600 hover:underline font-medium">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;