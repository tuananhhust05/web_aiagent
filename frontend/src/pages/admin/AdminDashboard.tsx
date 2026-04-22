import { useState } from 'react'
import AdminSidebar, { AdminPage } from '@/components/admin/AdminSidebar'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminRolesPage from './pages/AdminRolesPage'
import AdminLifecyclePage from './pages/AdminLifecyclePage'
import AdminMFAPage from './pages/AdminMFAPage'
import AdminAccessReviewPage from './pages/AdminAccessReviewPage'
import AdminAuditPage from './pages/AdminAuditPage'
import AdminISOCoveragePage from './pages/AdminISOCoveragePage'
import AdminReportsPage from './pages/AdminReportsPage'

const PAGE_TITLES: Record<AdminPage, string> = {
  dashboard: 'Dashboard',
  users: 'Users & Accounts',
  roles: 'Roles & Permissions',
  lifecycle: 'Lifecycle Management',
  mfa: 'MFA & Authentication Policy',
  access_review: 'Access Reviews',
  audit: 'Audit Logs',
  iso: 'ISO 27001 Coverage',
  reports: 'Reports & Evidence',
}

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <AdminDashboardPage />
      case 'users': return <AdminUsersPage />
      case 'roles': return <AdminRolesPage />
      case 'lifecycle': return <AdminLifecyclePage />
      case 'mfa': return <AdminMFAPage />
      case 'access_review': return <AdminAccessReviewPage />
      case 'audit': return <AdminAuditPage />
      case 'iso': return <AdminISOCoveragePage />
      case 'reports': return <AdminReportsPage />
      default: return <AdminDashboardPage />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">{PAGE_TITLES[activePage]}</h1>
          </div>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}