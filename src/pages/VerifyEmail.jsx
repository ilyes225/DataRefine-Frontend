import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import logo from '../assets/datarefine_logo.svg';

function VerifyEmail() {
  
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
    const token = urlParams.get('token');
    console.log('Token récupéré:', token);
    
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }

    apiClient.get('/auth/verify-email', { params: { token } })
      .then(res => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Erreur de vérification.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">

        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="DataRefine" style={{ height: '50px', width: '50px' }} />
          <p className="text-xl font-bold tracking-tight mt-2">
            <span className="text-teal-500">Data</span>
            <span className="text-gray-900 font-light">Refine</span>
          </p>
          <p className="text-xs text-gray-400 tracking-widest">SMART DATA QUALITY</p>
        </div>

        {status === 'loading' && (
          <div className="text-gray-500 text-lg">⏳ Vérification en cours...</div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <a href="/login"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">
              Se connecter
            </a>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Échec de la vérification</h2>
            <p className="text-red-500 mb-6">{message}</p>
            <a href="/register"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">
              Réessayer
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

export default VerifyEmail;