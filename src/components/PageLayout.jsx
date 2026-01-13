import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './PageLayout.css'

function PageLayout({ children, activePage, className = '' }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

  return (
    <div className={`page-layout ${className}`}>
      <Header />
      <div className="page-body">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
          activePage={activePage}
        />
        <main className={`page-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default PageLayout
