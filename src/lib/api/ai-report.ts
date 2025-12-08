import api from "../axios"
import { LeaveStatus } from "./leave"
import { WorkScheduleStatus } from "./attendance"

export interface AIReportFilters {
  startDate: string
  endDate: string
  departmentId?: number
}

export interface EmployeeAttendanceAggregate {
  employeeId: number
  employeeName: string
  employeeCode?: string
  presentDays: number
  lateDays: number
  absentDays: number
  totalRecords: number
}

export interface LeaveStatusSummary {
  status: LeaveStatus
  count: number
  totalDays: number
}

export interface LeaveSummary {
  totalRequests: number
  byStatus: LeaveStatusSummary[]
}

export interface WorkScheduleStatusSummary {
  status: WorkScheduleStatus
  count: number
}

export interface WorkScheduleSummary {
  totalSchedules: number
  totalEmployees: number
  byStatus: WorkScheduleStatusSummary[]
}

export interface AIReportContext {
  filters: AIReportFilters
  generatedAt: string
  attendance?: {
    totalRecords: number
    totalEmployees: number
    aggregates: EmployeeAttendanceAggregate[]
  }
  payrollSummary?: any
  leaveSummary?: LeaveSummary
  workScheduleSummary?: WorkScheduleSummary
}

export const aiReportAPI = {
  async generateReport(context: AIReportContext): Promise<string> {
    const response = await api.post("/api/ai-reports/generate", context)
    // backend có thể trả về { data: { reportText } } hoặc { reportText }
    return (
      response.data?.data?.reportText ||
      response.data?.reportText ||
      response.data?.data ||
      ""
    )
  },

  async sendReportEmail(payload: {
    reportText: string
    filters: AIReportFilters
    recipientEmail: string
  }): Promise<void> {
    await api.post("/api/ai-reports/send-email", payload)
  },
}