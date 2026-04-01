import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getAtlasOnboardingState,
  markFirstModalDone,
  markSectionVisited,
  pathToSectionId,
  type AtlasSectionId,
} from '../lib/atlasOnboarding'
import AtlasWelcomeModal from '../components/AtlasWelcomeModal'
import AtlasSectionGuide from '../components/AtlasSectionGuide'
import { AtlasSidebar } from '../components/mockflow-atlas/Sidebar'

export default function AtlasLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const userId = user?.id ?? user?._id
  const onboarding = getAtlasOnboardingState(userId)
  const showWelcomeFromState = !!(location.state as { showWelcome?: boolean })?.showWelcome
  const showFirstModal = showWelcomeFromState || !onboarding.firstModalDone
  const currentSection = pathToSectionId(location.pathname)

  const [showFirstModalOpen, setShowFirstModalOpen] = useState(showFirstModal)
  const [sectionGuideSection, setSectionGuideSection] = useState<AtlasSectionId | null>(null)

  // Auth guard: redirect to login if token expired or user not authenticated
  useEffect(() => {
    if (loading) return // Wait for auth check to complete
    const token = localStorage.getItem('token')
    if (!token || !user) {
      console.warn('🔒 [Atlas] Token expired or user not authenticated — redirecting to login')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (showFirstModal && !onboarding.firstModalDone) {
      setShowFirstModalOpen(true)
    }
  }, [showFirstModal, onboarding.firstModalDone])

  useEffect(() => {
    if (!userId || !onboarding.firstModalDone) return
    if (!currentSection) return
    if (onboarding.sectionsVisited.includes(currentSection)) return
    setSectionGuideSection(currentSection)
  }, [userId, onboarding.firstModalDone, currentSection, onboarding.sectionsVisited])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // If no user after loading, don't render (redirect will happen via useEffect above)
  if (!user) {
    return null
  }

  const handleFirstModalClose = () => {
    markFirstModalDone(userId)
    setShowFirstModalOpen(false)
    navigate(location.pathname, { replace: true, state: {} })
  }

  const handleSectionGuideClose = () => {
    if (sectionGuideSection) {
      markSectionVisited(userId, sectionGuideSection)
      setSectionGuideSection(null)
    }
  }

  const welcomeRole = user?.role === 'company_admin' ? 'sales_manager' : user?.workspace_role === 'owner' ? 'sales_manager' : 'sales_employee'

  return (
    <div className="flex h-screen overflow-hidden">
      <AtlasSidebar />

      <div className="flex-1 overflow-hidden min-w-0 pb-16 lg:pb-0">
        <Outlet />
      </div>

      {showFirstModalOpen && (
        <AtlasWelcomeModal
          onClose={handleFirstModalClose}
          userName={user?.first_name}
          role={welcomeRole}
        />
      )}
      {sectionGuideSection && (
        <AtlasSectionGuide
          sectionId={sectionGuideSection}
          onClose={handleSectionGuideClose}
        />
      )}
    </div>
  )
}
