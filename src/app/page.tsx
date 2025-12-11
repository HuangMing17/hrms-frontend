"use client"

import { useState, useEffect } from "react"
import { HRSidebar } from "../components/hr-sidebar"
import { HRHeader } from "../components/hr-header"
import { HRDashboard } from "../components/hr-dashboard"
import { EmployeeManagement } from "../components/employee-management"
import { DepartmentManagement } from "../components/department-management"
import { AttendanceManagement } from "../components/attendance-management"
import { LeaveManagement } from "../components/leave-management"
import { PayrollManagement } from "../components/payroll-management"
import { AuditManagement } from "../components/audit-management"
import { ReportsAnalytics } from "../components/reports-analytics"
import { AIReportPage } from "../components/ai-report"
import { LoginPage } from "../components/login-page"
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { AnimatedPageTransition } from "../components/ui/animated-page"

function AppContent() {
  const { isAuthenticated, logout, user } = useAuth()
  const [activeView, setActiveView] = useState("dashboard")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // Đánh dấu đã mount trên client

    // Chỉ chạy SAU KHI đã mount để tránh hydration mismatch
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')

      // Chỉ dùng lựa chọn của người dùng, không tự động theo trình duyệt
      if (savedTheme === 'dark') {
        setIsDarkMode(true)
        document.documentElement.classList.add('dark')
      } else if (savedTheme === 'light') {
        setIsDarkMode(false)
        document.documentElement.classList.remove('dark')
      }
      // Nếu không có savedTheme → giữ mặc định (light mode)
    }
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)

    if (typeof window !== 'undefined') {
      if (newDarkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setActiveView("dashboard")
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Chờ mount xong mới render để tránh hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show login page as homepage if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setActiveView("dashboard")} />
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="p-6">
            <HRDashboard />
          </div>
        )
      case "employees":
        return (
          <div className="p-6">
            <EmployeeManagement />
          </div>
        )
      case "departments":
        return (
          <div className="p-6">
            <DepartmentManagement />
          </div>
        )
      case "attendance":
        return (
          <div className="p-6">
            <AttendanceManagement />
          </div>
        )
      case "leave":
        return (
          <div className="p-6">
            <LeaveManagement />
          </div>
        )
      case "payroll":
        return (
          <div className="p-6">
            <PayrollManagement />
          </div>
        )
      case "audit":
        return (
          <div className="p-6">
            <AuditManagement />
          </div>
        )
      case "ai-report":
        return (
          <div className="p-6">
            <AIReportPage />
          </div>
        )
      case "reports":
        return (
          <div className="p-6">
            <ReportsAnalytics />
          </div>
        )
      case "settings":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Cài đặt hệ thống</h2>
            <p className="text-muted-foreground">Module cài đặt đang phát triển...</p>
          </div>
        )
      default:
        return (
          <div className="p-6">
            <HRDashboard />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg z-10">
          <HRSidebar activeView={activeView} onViewChange={(view) => {
            if (view === "logout") {
              handleLogout()
            } else {
              setActiveView(view)
            }
          }} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <HRHeader isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
          <main className="flex-1 overflow-auto bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
            <AnimatedPageTransition activeView={activeView}>
              {renderContent()}
            </AnimatedPageTransition>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
