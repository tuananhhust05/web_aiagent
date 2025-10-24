import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import GoogleCallback from './pages/auth/GoogleCallback'
import GoogleSuccess from './pages/auth/GoogleSuccess'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CallsDashboard from './pages/CallsDashboard'
import CallsLog from './pages/CallsLog'
import CallSentiment from './pages/CallSentiment'
import CallDetail from './pages/CallDetail'
import Contacts from './pages/contacts/Contacts'
import ContactDetail from './pages/contacts/ContactDetail'
import ContactImport from './pages/contacts/ContactImport'
import ContactNew from './pages/contacts/ContactNew'
import ContactGroups from './pages/contacts/ContactGroups'
import GroupDetail from './pages/contacts/GroupDetail'
import CRM from './pages/crm/CRM'
// import Campaign from './pages/Campaign' // Temporarily commented out
import CampaignDetail from './pages/CampaignDetail'
import Agent from './pages/Agent'
import RAG from './pages/RAG'
import VoiceTraining from './pages/VoiceTraining'
import Profile from './pages/Profile'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Pricing from './pages/Pricing'
import Help from './pages/Help'
import AIAgent from './pages/products/AIAgent'
import RAGClient from './pages/products/RAGClient'
import CRMIntegration from './pages/products/CRMIntegration'
import CRMIntegrationPage from './pages/CRMIntegration'
import EmailList from './pages/emails/EmailList'
import EmailCreate from './pages/emails/EmailCreate'
import EmailDetail from './pages/emails/EmailDetail'
import WhatsApp from './pages/WhatsApp'
import WhatsAppConversation from './pages/WhatsAppConversation'
import Telegram from './pages/Telegram'
import TelegramContacts from './pages/telegram/TelegramContacts'
import TelegramContactNew from './pages/telegram/TelegramContactNew'
import TelegramCampaign from './pages/telegram/TelegramCampaign'
import ConventionActivities from './pages/ConventionActivities'
import Deals from './pages/Deals'
import WorkflowBuilder from './pages/WorkflowBuilder'
import CampaignGoalDetail from './pages/CampaignGoalDetail'
import ComingSoon from './pages/ComingSoon'
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
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/help" element={<Help />} />
        <Route path="/products/ai-agent" element={<AIAgent />} />
        <Route path="/products/rag-client" element={<RAGClient />} />
        <Route path="/products/crm-integration" element={<CRMIntegration />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/workflow-builder" element={<WorkflowBuilder />} />
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calls-dashboard" element={<CallsDashboard />} />
            <Route path="/calls" element={<CallsLog />} />
            <Route path="/calls/:callId" element={<CallDetail />} />
            <Route path="/calls/:callId/sentiment" element={<CallSentiment />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/new" element={<ContactNew />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/contacts/import" element={<ContactImport />} />
            <Route path="/contacts/group" element={<ContactGroups />} />
            <Route path="/contacts/group/:groupId" element={<GroupDetail />} />
            <Route path="/campaigns" element={<ComingSoon />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/crm-integration" element={<CRMIntegrationPage />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/ragclient" element={<RAG />} />
            <Route path="/voice-training" element={<VoiceTraining />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/emails" element={<EmailList />} />
            <Route path="/emails/create" element={<EmailCreate />} />
            <Route path="/emails/:id" element={<EmailDetail />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/whatsapp/conversation/:id" element={<WhatsAppConversation />} />
            <Route path="/telegram" element={<Telegram />} />
            <Route path="/telegram/contacts" element={<TelegramContacts />} />
            <Route path="/telegram/contacts/new" element={<TelegramContactNew />} />
            <Route path="/telegram/campaigns" element={<TelegramCampaign />} />
            <Route path="/convention-activities" element={<ConventionActivities />} />
            <Route path="/campaign-goals/:goalId" element={<CampaignGoalDetail />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App 