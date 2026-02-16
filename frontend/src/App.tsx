import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RegisterCompany from './pages/auth/RegisterCompany'
import AcceptInvite from './pages/auth/AcceptInvite'
import AcceptColleagueLink from './pages/auth/AcceptColleagueLink'
import Onboarding from './pages/auth/Onboarding'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import GoogleCallback from './pages/auth/GoogleCallback'
import GoogleCalendarCallback from './pages/auth/GoogleCalendarCallback'
import GoogleSuccess from './pages/auth/GoogleSuccess'
import SupplementProfile from './pages/auth/SupplementProfile'
import OAuthDone from './pages/auth/OAuthDone'
import WelcomeTour from './pages/auth/WelcomeTour'
import Home from './pages/Home'
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
import Terms from './pages/Terms'
import AIAgent from './pages/products/AIAgent'
import RAGClient from './pages/products/RAGClient'
import CRMIntegration from './pages/products/CRMIntegration'
import CRMIntegrationPage from './pages/CRMIntegration'
import EmailList from './pages/emails/EmailList'
import EmailCreate from './pages/emails/EmailCreate'
import EmailDetail from './pages/emails/EmailDetail'
import EmailLogin from './pages/EmailLogin'
import WhatsApp from './pages/WhatsApp'
import WhatsAppConversation from './pages/WhatsAppConversation'
import WhatsAppLogin from './pages/WhatsAppLogin'
import TelegramLogin from './pages/TelegramLogin'
import Telegram from './pages/Telegram'
import TelegramContacts from './pages/telegram/TelegramContacts'
import TelegramContactNew from './pages/telegram/TelegramContactNew'
import TelegramCampaign from './pages/telegram/TelegramCampaign'
import LatestMail from './pages/LatestMail'
import ConventionActivities from './pages/ConventionActivities'
import Deals from './pages/Deals'
import Renewals from './pages/Renewals'
import CSM from './pages/CSM'
import Upsell from './pages/Upsell'
import MarketingData from './pages/MarketingData'
import WorkflowBuilder from './pages/WorkflowBuilder'
import CampaignGoalDetail from './pages/CampaignGoalDetail'
import AISalesCopilotPage from './pages/AISalesCopilotPage'
import AISalesCopilotDetailPage from './pages/AISalesCopilotDetailPage'
import RAGSalesCoach from './pages/RAGSalesCoach'
import ComingSoon from './pages/ComingSoon'
import LoadingSpinner from './components/ui/LoadingSpinner'
import CRMIntegrationsList from './pages/CRMIntegrationsList'
import HubSpotIntegration from './pages/HubSpotIntegration'
import Meetings from './pages/Meetings'
import GmailPage from './pages/GmailPage'
import AtlasLayout from './pages/AtlasLayout'
import AtlasCalendarPage from './pages/AtlasCalendarPage'
import AtlasMain from './pages/AtlasMain'
import AtlasPlaybookTemplates from './pages/AtlasPlaybookTemplates'

const ALLOWED_WHEN_PROFILE_INCOMPLETE = ['/supplement-profile', '/auth/welcome', '/auth/oauth-done', '/login']

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const pathname = location.pathname

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
        <Route path="/auth/oauth-done" element={<OAuthDone />} />
        <Route path="/auth/welcome" element={<WelcomeTour />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/accept-invite/:inviteToken" element={<AcceptInvite />} />
        <Route path="/accept-colleague-link/:linkToken" element={<AcceptColleagueLink />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/auth/google/calendar/callback" element={<GoogleCalendarCallback />} />
        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/help" element={<Help />} />
        <Route path="/products/ai-agent" element={<AIAgent />} />
        <Route path="/products/rag-client" element={<RAGClient />} />
        <Route path="/products/crm-integration" element={<CRMIntegration />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    )
  }

  // Global guard: if user has not completed required info (terms + gdpr), redirect to supplement-profile from any page
  const profileIncomplete = user && (user.terms_accepted === false || user.gdpr_consent === false)
  const isAllowedWhenIncomplete = ALLOWED_WHEN_PROFILE_INCOMPLETE.some((p) => pathname === p)
  if (profileIncomplete && !isAllowedWhenIncomplete) {
    return <Navigate to="/supplement-profile" replace />
  }

  return (
    <Routes>
      <Route path="/auth/oauth-done" element={<OAuthDone />} />
      <Route path="/auth/welcome" element={<WelcomeTour />} />
      <Route path="/login" element={<Login />} />
      <Route path="/supplement-profile" element={<SupplementProfile />} />
      <Route path="/workflow-builder" element={<WorkflowBuilder />} />
      <Route path="/workflows" element={<WorkflowBuilder />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/auth/google/calendar/callback" element={<GoogleCalendarCallback />} />
      {/* Atlas uses its own full-page layout (no global Layout); calendar has its own URL */}
      <Route path="/atlas" element={<AtlasLayout />}>
        <Route index element={<Navigate to="/atlas/calendar" replace />} />
        <Route path="calendar" element={<AtlasCalendarPage />} />
        <Route path="calls" element={<AtlasMain />} />
        <Route path="insights" element={<AtlasMain />} />
        <Route path="todo" element={<AtlasMain />} />
        <Route path="qna" element={<AtlasMain />} />
        <Route path="playbooks" element={<AtlasPlaybookTemplates />} />
        <Route path="knowledge" element={<AtlasMain />} />
        <Route path="record" element={<AtlasMain />} />
      </Route>
      {/* Profile page uses AtlasLayout sidebar */}
      <Route path="/profile" element={<AtlasLayout />}>
        <Route index element={<Profile />} />
      </Route>
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/atlas/calendar" replace />} />
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
            <Route path="/crm-integrations" element={<CRMIntegrationsList />} />
            <Route path="/crm-integrations/hubspot" element={<HubSpotIntegration />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/ragclient" element={<RAG />} />
            <Route path="/rag-sales-coach" element={<RAGSalesCoach />} />
            <Route path="/voice-training" element={<VoiceTraining />} />
            <Route path="/emails" element={<EmailList />} />
            <Route path="/emails/create" element={<EmailCreate />} />
            <Route path="/emails/:id" element={<EmailDetail />} />
            <Route path="/email-login" element={<EmailLogin />} />
            <Route path="/latest-mail" element={<LatestMail />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/whatsapp/conversation/:id" element={<WhatsAppConversation />} />
            <Route path="/whatsapp-login" element={<WhatsAppLogin />} />
            <Route path="/telegram" element={<Telegram />} />
            <Route path="/telegram-login" element={<TelegramLogin />} />
            <Route path="/telegram/contacts" element={<TelegramContacts />} />
            <Route path="/telegram/contacts/new" element={<TelegramContactNew />} />
            <Route path="/telegram/campaigns" element={<TelegramCampaign />} />
            <Route path="/convention-activities" element={<ConventionActivities />} />
            <Route path="/campaign-goals/:goalId" element={<CampaignGoalDetail />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/csm" element={<CSM />} />
            <Route path="/upsell" element={<Upsell />} />
            <Route path="/marketing-data" element={<MarketingData />} />
            <Route path="/ai-sales-copilot" element={<AISalesCopilotPage />} />
            <Route path="/ai-sales-copilot/:prospectId/:actionId" element={<AISalesCopilotDetailPage />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/gmail" element={<GmailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App 