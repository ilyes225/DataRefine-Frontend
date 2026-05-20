import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Anomalies from './pages/Anomalies'
import Sources from './pages/Sources'
import Corrections from './pages/Corrections'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const handleLogin = (userData) => {
    setUser(userData)
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const layoutProps = { onLogout: handleLogout, user }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register onLogin={handleLogin} />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/" element={<PrivateRoute><Layout {...layoutProps}><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/anomalies" element={<PrivateRoute><Layout {...layoutProps}><Anomalies /></Layout></PrivateRoute>} />
      <Route path="/sources" element={<PrivateRoute><Layout {...layoutProps}><Sources /></Layout></PrivateRoute>} />
      <Route path="/corrections" element={<PrivateRoute><Layout {...layoutProps}><Corrections /></Layout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Layout {...layoutProps}><Reports /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout {...layoutProps}><Settings /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}