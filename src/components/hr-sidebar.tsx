"use client"

import {
  Home, Users, Calendar, FileText, BarChart3, Settings, LogOut,
  Building2, Clock, Plane, DollarSign, ClipboardList,
  Shield, UserCog, Briefcase
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "./ui/sidebar"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const mainMenuItems = [
  {
    title: "Tổng quan",
    key: "dashboard",
    icon: Home,
  },
  {
    title: "Giám sát và bảo mật",
    key: "audit",
    icon: Shield,
  },
  {
    title: "Báo cáo AI",
    key: "ai-report",
    icon: FileText,
  },
  {
    title: "Quản lý nhân viên",
    key: "employees",
    icon: Users,
  },
  {
    title: "Phòng ban & Chức vụ",
    key: "departments",
    icon: Building2,
  },
  {
    title: "Chấm công",
    key: "attendance",
    icon: Clock,
  },
  {
    title: "Nghỉ phép",
    key: "leave",
    icon: Plane,
  },
  {
    title: "Quản lý lương",
    key: "payroll",
    icon: DollarSign,
  },
]

const bottomMenuItems = [
  {
    title: "Báo cáo & Thống kê",
    key: "reports",
    icon: BarChart3,
  },
  {
    title: "Cài đặt",
    key: "settings",
    icon: Settings,
  },
  {
    title: "Đăng xuất",
    key: "logout",
    icon: LogOut,
  },
]

export function HRSidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="h-full bg-gradient-to-b from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-rose-gradient p-4">
        <h2 className="text-lg font-semibold text-white">GODCosmetics</h2>
        <p className="text-xs text-pink-100">Quản lý nhân sự</p>
      </div>

      {/* Main Menu Items */}
      <div className="p-4 flex-1">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Quản lý chính</h3>
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === item.key
                  ? 'bg-rose-gradient text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Menu Items - Fixed at bottom */}
      <div className="p-4 border-t border-pink-200 dark:border-pink-800">
        <div className="space-y-1">
          {bottomMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === item.key
                ? 'bg-rose-gradient text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
