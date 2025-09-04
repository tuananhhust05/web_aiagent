import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/contacts/Contacts'
import ContactDetail from './pages/contacts/ContactDetail'
import ContactImport from './pages/contacts/ContactImport'
import CRM from './pages/crm/CRM'
import Agent from './pages/Agent'
import RAG from './pages/RAG'
import VoiceTraining from './pages/VoiceTraining'
import Profile from './pages/Profile'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Pricing from './pages/Pricing'
import Help from './pages/Help'
import LoadingSpinner from './components/ui/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/:id" element={<ContactDetail />} />
        <Route path="/contacts/import" element={<ContactImport />} />
                 <Route path="/crm" element={<CRM />} />
         <Route path="/agent" element={<Agent />} />
         <Route path="/ragclient" element={<RAG />} />
         <Route path="/voice-training" element={<VoiceTraining />} />
         <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App 