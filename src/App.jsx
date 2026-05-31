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
import UserManagement from './pages/UserManagement'
import Notifications from './pages/Notifications'
import PendingAssignment from './pages/PendingAssignment'

function PrivateRoute({ children, user }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />

  // Consultant non assigné → page d'attente
  if (user && user.role === 'consultant' && !user.is_assigned) {
    return <PendingAssignment />
  }

  return children
}

function AdminRoute({ children, user }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  if (!user || user.role !== 'admin') return <Navigate to="/" />
  return children
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
      {/* Public */}
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register onLogin={handleLogin} />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected — tous les utilisateurs assignés */}
      <Route path="/" element={<PrivateRoute user={user}><Layout {...layoutProps}><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/anomalies" element={<PrivateRoute user={user}><Layout {...layoutProps}><Anomalies /></Layout></PrivateRoute>} />
      <Route path="/sources" element={<PrivateRoute user={user}><Layout {...layoutProps}><Sources /></Layout></PrivateRoute>} />
      <Route path="/corrections" element={<PrivateRoute user={user}><Layout {...layoutProps}><Corrections /></Layout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute user={user}><Layout {...layoutProps}><Reports /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute user={user}><Layout {...layoutProps}><Settings /></Layout></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute user={user}><Layout {...layoutProps}><Notifications /></Layout></PrivateRoute>} />

      {/* Admin only */}
      <Route path="/users" element={<AdminRoute user={user}><Layout {...layoutProps}><UserManagement /></Layout></AdminRoute>} />

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