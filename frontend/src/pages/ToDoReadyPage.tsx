// NEW: action-ready-main UI hard-copy with real backend API integration
import { useQuery } from '@tanstack/react-query'
import { ActionsProvider } from '../components/atlas/todo/ActionsContext'
import { LanguageProvider } from '../components/atlas/todo/LanguageContext'
import ActionReadyHeader from '../components/atlas/todo/ActionReadyHeader'
import ActionFilterSidebar from '../components/atlas/todo/ActionFilterSidebar'
import ActionReadyContent from '../components/atlas/todo/ActionReadyContent'
import DashboardTopBar from '../components/atlas/todo/DashboardTopBar'
import GmailConnectPrompt from '../components/atlas/GmailConnectPrompt'
import { gmailAPI } from '../lib/api'

export default function ToDoReadyPage() {
  const { data: gmailStatus, isLoading: gmailLoading, refetch: refetchGmail } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => gmailAPI.getStatus().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const gmailConnected =
    gmailStatus?.configured &&
    gmailStatus?.has_access_token &&
    !gmailStatus?.needs_reauthorization

  return (
    <LanguageProvider>
      <ActionsProvider>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Gmail connect banner — shown above the top bar when not connected */}
          {gmailStatus && !gmailConnected && (
            <GmailConnectPrompt
              status={gmailStatus}
              loading={gmailLoading}
              onReauthorize={() => {
                gmailAPI.getReauthorizeUrl().then((r) => {
                  window.location.href = r.data.auth_url
                })
              }}
              onRefresh={() => refetchGmail()}
            />
          )}
          <DashboardTopBar />
          <ActionReadyHeader />
          <div className="flex flex-1 overflow-hidden">
            <ActionFilterSidebar />
            <ActionReadyContent />
          </div>
        </div>
      </ActionsProvider>
    </LanguageProvider>
  )
}
