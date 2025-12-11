"use client"

import { useMemo, useState, useEffect } from "react"
import { Editor } from "@tinymce/tinymce-react"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { LoadingPage, LoadingInline } from "./ui/loading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { attendanceAPI, AttendanceRecord, WorkScheduleResponse, WorkScheduleStatus, AttendanceSummaryResponse, WorkShiftResponse } from "../lib/api/attendance"
import { payrollAPI, PayrollSummaryResponse, PayrollPreviewResponse } from "../lib/api/payroll"
import { allowanceAPI, AllowanceResponse } from "../lib/api/allowance"
import { departmentAPI, Department } from "../lib/api/department"
import { leaveAPI, LeaveRequest, LeaveStatus, LeaveType, LeaveBalance } from "../lib/api/leave"
import { aiReportAPI, AIReportContext, AIReportFilters, LeaveSummary, WorkScheduleSummary } from "../lib/api/ai-report"

type RangeType = "week" | "month" | "custom"
type ReportType = "overview" | "attendance" | "payroll" | "leave" | "schedule"

function getCurrentWeekRange() {
  const today = new Date()
  const start = startOfWeek(today, { weekStartsOn: 1 })
  const end = endOfWeek(today, { weekStartsOn: 1 })
  return { start, end }
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function AIReportPage() {
  const [rangeType, setRangeType] = useState<RangeType>("week")
  const currentWeek = useMemo(() => getCurrentWeekRange(), [])
  const [startDate, setStartDate] = useState<string>(formatDate(currentWeek.start))
  const [endDate, setEndDate] = useState<string>(formatDate(currentWeek.end))
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all")

  const [reportType, setReportType] = useState<ReportType>("overview")
  const [reportText, setReportText] = useState<string>("")
  const [reportTexts, setReportTexts] = useState<{
    overview?: string
    attendance?: string
    payroll?: string
    leave?: string
    schedule?: string
  }>({})
  const [recipientEmail, setRecipientEmail] = useState<string>("")

  const [loadingData, setLoadingData] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useMemo(() => {
    const load = async () => {
      try {
        const data = await departmentAPI.getDepartments()
        setDepartments(data)
      } catch (err: any) {
        console.error("Error loading departments for AI report:", err)
      }
    }
    load()
  }, [])

  const handleRangeChange = (value: RangeType) => {
    setRangeType(value)
    const now = new Date()
    if (value === "week") {
      const range = getCurrentWeekRange()
      setStartDate(formatDate(range.start))
      setEndDate(formatDate(range.end))
    } else if (value === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(formatDate(first))
      setEndDate(formatDate(last))
    }
  }

  const buildFilters = (): AIReportFilters => {
    return {
      startDate,
      endDate,
      departmentId: selectedDepartmentId !== "all" ? Number(selectedDepartmentId) : undefined,
    }
  }

  const aggregateAttendance = (records: AttendanceRecord[]) => {
    const map = new Map<
      number,
      {
        employeeId: number
        employeeName: string
        employeeCode?: string
        presentDays: number
        lateDays: number
        absentDays: number
        totalRecords: number
      }
    >()

    for (const rec of records) {
      const agg =
        map.get(rec.employeeId) || {
          employeeId: rec.employeeId,
          employeeName: rec.employeeName,
          employeeCode: rec.employeeCode,
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          totalRecords: 0,
        }
      agg.totalRecords += 1
      if (rec.status === "PRESENT") agg.presentDays += 1
      if (rec.status === "LATE") agg.lateDays += 1
      if (rec.status === "ABSENT") agg.absentDays += 1
      map.set(rec.employeeId, agg)
    }

    return Array.from(map.values())
  }

  const aggregateLeave = (records: LeaveRequest[]): LeaveSummary => {
    const byStatusMap = new Map<LeaveStatus, { count: number; totalDays: number }>()

    records.forEach((lr) => {
      const key = lr.status
      const current = byStatusMap.get(key) || { count: 0, totalDays: 0 }
      current.count += 1
      current.totalDays += lr.totalDays || 0
      byStatusMap.set(key, current)
    })

    return {
      totalRequests: records.length,
      byStatus: Array.from(byStatusMap.entries()).map(([status, v]) => ({
        status,
        count: v.count,
        totalDays: v.totalDays,
      })),
    }
  }

  const aggregateWorkSchedules = (records: WorkScheduleResponse[]): WorkScheduleSummary => {
    const byStatusMap = new Map<WorkScheduleStatus, number>()
    const employeeSet = new Set<number>()

    records.forEach((ws) => {
      employeeSet.add(ws.employeeId)
      const key = ws.status
      const current = byStatusMap.get(key) || 0
      byStatusMap.set(key, current + 1)
    })

    return {
      totalSchedules: records.length,
      totalEmployees: employeeSet.size,
      byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })),
    }
  }

  // Báo cáo tổng hợp (giữ nguyên logic cũ)
  const handleGenerateOverviewReport = async () => {
    setError(null)
    setSuccessMessage(null)
    setGenerating(true)
    setLoadingData(true)

    try {
      const filters = buildFilters()

      const [attendanceResult, payrollSummary, leaveResult, scheduleResult]: [
        { content: AttendanceRecord[]; totalElements: number },
        PayrollSummaryResponse,
        { content: LeaveRequest[]; totalElements: number },
        { content: WorkScheduleResponse[]; totalElements: number }
      ] = await Promise.all([
        attendanceAPI.getAttendanceReport({
          startDate: filters.startDate,
          endDate: filters.endDate,
          departmentId: filters.departmentId,
          page: 0,
          size: 1000,
        } as any),
        payrollAPI.getPayrollSummary(
          new Date(filters.startDate).getMonth() + 1,
          new Date(filters.startDate).getFullYear(),
          filters.departmentId
        ),
        leaveAPI.getAllLeaveRequests({
          page: 0,
          size: 1000,
        }),
        attendanceAPI.getWorkSchedules({
          startDate: filters.startDate,
          endDate: filters.endDate,
          departmentId: filters.departmentId,
          page: 0,
          size: 1000,
        }),
      ])

      const attendanceAggregates = aggregateAttendance(attendanceResult.content)
      const leaveSummary = aggregateLeave(leaveResult.content)
      const workScheduleSummary = aggregateWorkSchedules(scheduleResult.content)

      const context: AIReportContext = {
        filters,
        generatedAt: new Date().toISOString(),
        reportType: "overview",
        attendance: {
          totalRecords: attendanceResult.totalElements,
          totalEmployees: attendanceAggregates.length,
          aggregates: attendanceAggregates,
        },
        payrollSummary,
        leaveSummary,
        workScheduleSummary,
      }

      const aiText = await aiReportAPI.generateReport(context)
      setReportTexts(prev => ({ ...prev, overview: aiText }))
      setReportText(aiText || "")
      setSuccessMessage("Đã tạo báo cáo tổng hợp bằng AI. Bạn có thể chỉnh sửa nội dung trước khi gửi.")
    } catch (err: any) {
      console.error("Error generating overview report:", err)
      setError(err?.response?.data?.message || err.message || "Không thể tạo báo cáo tổng hợp")
    } finally {
      setGenerating(false)
      setLoadingData(false)
    }
  }

  // Báo cáo chấm công chi tiết
  const handleGenerateAttendanceReport = async () => {
    setError(null)
    setSuccessMessage(null)
    setGenerating(true)
    setLoadingData(true)

    try {
      const filters = buildFilters()
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      const month = start.getMonth() + 1
      const year = start.getFullYear()

      // 1. Lấy báo cáo tổng hợp
      const reportResult = await attendanceAPI.getAttendanceReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        departmentId: filters.departmentId,
        page: 0,
        size: 1000,
      } as any)

      // 2. Lấy tất cả work shifts
      const workShifts = await attendanceAPI.getWorkShifts()

      // 3. Lấy work schedules trong khoảng thời gian
      const schedules = await attendanceAPI.getWorkSchedules({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: 0,
        size: 1000,
      })

      // 4. Lấy summary cho một số nhân viên (giới hạn để tránh quá nhiều request)
      const uniqueEmployeeIds = Array.from(new Set(reportResult.content.map(r => r.employeeId))).slice(0, 20)
      const employeeSummaries: (AttendanceSummaryResponse | null)[] = await Promise.all(
        uniqueEmployeeIds.map(async (employeeId) => {
          try {
            return await attendanceAPI.getEmployeeAttendanceSummary(employeeId, month, year)
          } catch {
            return null
          }
        })
      )

      // 5. Tính toán metrics chi tiết
      const attendanceAggregates = aggregateAttendance(reportResult.content)
      const byStatus = {
        PRESENT: reportResult.content.filter(r => r.status === 'PRESENT').length,
        LATE: reportResult.content.filter(r => r.status === 'LATE').length,
        ABSENT: reportResult.content.filter(r => r.status === 'ABSENT').length,
        OVERTIME: reportResult.content.filter(r => r.status === 'OVERTIME').length,
        HALF_DAY: reportResult.content.filter(r => r.status === 'HALF_DAY').length,
        EARLY_DEPARTURE: reportResult.content.filter(r => r.status === 'EARLY_DEPARTURE').length,
      }

      const topLateEmployees = reportResult.content
        .filter(r => r.status === 'LATE')
        .reduce((acc, r) => {
          acc[r.employeeId] = (acc[r.employeeId] || 0) + 1
          return acc
        }, {} as Record<number, number>)

      const context: AIReportContext = {
        filters,
        generatedAt: new Date().toISOString(),
        reportType: "attendance",
        attendance: {
          totalRecords: reportResult.totalElements,
          totalEmployees: attendanceAggregates.length,
          aggregates: attendanceAggregates,
          detailedMetrics: {
            byStatus,
            byWorkShift: workShifts.map(shift => ({
              shiftId: shift.id,
              shiftName: shift.name,
              count: reportResult.content.filter(r => r.workShiftId === shift.id).length,
            })),
            schedulesTotal: schedules.totalElements,
            schedulesByStatus: {
              SCHEDULED: schedules.content.filter(s => s.status === 'SCHEDULED').length,
              COMPLETED: schedules.content.filter(s => s.status === 'COMPLETED').length,
              ABSENT: schedules.content.filter(s => s.status === 'ABSENT').length,
              CANCELLED: schedules.content.filter(s => s.status === 'CANCELLED').length,
            },
            employeeSummaries: employeeSummaries.filter(s => s !== null) as AttendanceSummaryResponse[],
            topLateEmployees: Object.entries(topLateEmployees)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([employeeId, count]) => ({
                employeeId: Number(employeeId),
                count,
                employeeName: reportResult.content.find(r => r.employeeId === Number(employeeId))?.employeeName || "",
              })),
            perfectAttendanceEmployees: Array.from(
              new Set(
                reportResult.content
                  .filter(r => r.status === 'PRESENT' || r.status === 'OVERTIME')
                  .map(r => r.employeeId)
              )
            ).length,
          },
          workShifts,
          schedules: schedules.content,
        },
      }

      const aiText = await aiReportAPI.generateAttendanceReport(context)
      setReportTexts(prev => ({ ...prev, attendance: aiText }))
      setReportText(aiText || "")
      setSuccessMessage("Đã tạo báo cáo chấm công chi tiết bằng AI.")
    } catch (err: any) {
      console.error("Error generating attendance report:", err)
      setError(err?.response?.data?.message || err.message || "Không thể tạo báo cáo chấm công")
    } finally {
      setGenerating(false)
      setLoadingData(false)
    }
  }

  // Báo cáo lương chi tiết
  const handleGeneratePayrollReport = async () => {
    setError(null)
    setSuccessMessage(null)
    setGenerating(true)
    setLoadingData(true)

    try {
      const filters = buildFilters()
      const start = new Date(filters.startDate)
      const month = start.getMonth() + 1
      const year = start.getFullYear()

      // 1. Preview lương
      const preview = await payrollAPI.previewPayroll(month, year, filters.departmentId)

      // 2. Tổng hợp payroll
      const summary = await payrollAPI.getPayrollSummary(month, year, filters.departmentId)

      // 3. Báo cáo theo phòng ban (nếu có)
      let departmentReport = null
      if (filters.departmentId) {
        try {
          departmentReport = await payrollAPI.getDepartmentPayrollReport(
            filters.departmentId,
            month,
            year,
            0,
            1000
          )
        } catch {
          // Ignore if department report fails
        }
      }

      // 4. Lấy tất cả allowances
      const allowances = await allowanceAPI.getAllAllowances()

      // 5. Tính toán metrics chi tiết
      const detailedMetrics = {
        totalEmployees: summary.totalEmployees,
        totalBaseSalary: summary.totalBaseSalary,
        totalOvertimePay: summary.totalOvertimePay,
        totalAllowances: summary.totalAllowances,
        totalDeductions: summary.totalDeductions,
        totalGrossPay: summary.totalGrossPay,
        totalNetPay: summary.totalNetPay,
        averageNetPay: summary.totalEmployees > 0 
          ? summary.totalNetPay / summary.totalEmployees 
          : 0,
        byStatus: {
          DRAFT: summary.payrolls?.filter((p: any) => p.status === 'DRAFT').length || 0,
          PROCESSED: summary.payrolls?.filter((p: any) => p.status === 'PROCESSED').length || 0,
          PAID: summary.payrolls?.filter((p: any) => p.status === 'PAID').length || 0,
        },
        topEarners: (summary.payrolls || [])
          .sort((a: any, b: any) => b.netPay - a.netPay)
          .slice(0, 10)
          .map((p: any) => ({
            employeeId: p.employeeId,
            employeeName: p.employeeName,
            netPay: p.netPay,
          })),
        allowancesBreakdown: allowances.map(a => ({
          name: a.name,
          type: a.type,
          amount: a.amount,
          count: preview.filter((p: any) => 
            p.deductionDetails?.some((d: any) => d.name === a.name)
          ).length,
        })),
      }

      const context: AIReportContext = {
        filters,
        generatedAt: new Date().toISOString(),
        reportType: "payroll",
        payrollSummary: {
          payPeriodMonth: month,
          payPeriodYear: year,
          totalEmployees: summary.totalEmployees,
          totalBaseSalary: summary.totalBaseSalary,
          totalOvertimePay: summary.totalOvertimePay,
          totalAllowances: summary.totalAllowances,
          totalDeductions: summary.totalDeductions,
          totalGrossPay: summary.totalGrossPay,
          totalNetPay: summary.totalNetPay,
        },
        payrollDetails: {
          preview,
          departmentReport: departmentReport?.content || [],
          detailedMetrics,
          allowances,
        },
      }

      const aiText = await aiReportAPI.generatePayrollReport(context)
      setReportTexts(prev => ({ ...prev, payroll: aiText }))
      setReportText(aiText || "")
      setSuccessMessage("Đã tạo báo cáo lương chi tiết bằng AI.")
    } catch (err: any) {
      console.error("Error generating payroll report:", err)
      setError(err?.response?.data?.message || err.message || "Không thể tạo báo cáo lương")
    } finally {
      setGenerating(false)
      setLoadingData(false)
    }
  }

  // Báo cáo nghỉ phép chi tiết
  const handleGenerateLeaveReport = async () => {
    setError(null)
    setSuccessMessage(null)
    setGenerating(true)
    setLoadingData(true)

    try {
      const filters = buildFilters()

      // 1. Lấy tất cả đơn nghỉ phép
      const allRequests = await leaveAPI.getAllLeaveRequests({
        page: 0,
        size: 1000,
      })

      // 2. Lọc theo khoảng thời gian
      const filteredRequests = allRequests.content.filter(lr => {
        const startDate = new Date(lr.startDate)
        const endDate = new Date(lr.endDate)
        const filterStart = new Date(filters.startDate)
        const filterEnd = new Date(filters.endDate)
        return (startDate >= filterStart && startDate <= filterEnd) ||
               (endDate >= filterStart && endDate <= filterEnd) ||
               (startDate <= filterStart && endDate >= filterEnd)
      })

      // 3. Lấy tất cả leave types
      const leaveTypes = await leaveAPI.getAllLeaveTypes()

      // 4. Lấy số dư nghỉ phép của các nhân viên có đơn nghỉ
      const employeeIds = Array.from(new Set(filteredRequests.map(lr => lr.employeeId)))
      const leaveBalances: (LeaveBalance[] | null)[] = await Promise.all(
        employeeIds.slice(0, 50).map(async (employeeId) => {
          try {
            return await leaveAPI.getEmployeeLeaveBalance(employeeId)
          } catch {
            return null
          }
        })
      )

      // 5. Tính toán metrics chi tiết
      const detailedMetrics = {
        totalRequests: filteredRequests.length,
        byStatus: {
          PENDING: filteredRequests.filter(lr => lr.status === 'PENDING').length,
          APPROVED: filteredRequests.filter(lr => lr.status === 'APPROVED').length,
          REJECTED: filteredRequests.filter(lr => lr.status === 'REJECTED').length,
          CANCELLED: filteredRequests.filter(lr => lr.status === 'CANCELLED').length,
        },
        byLeaveType: leaveTypes.map(lt => ({
          leaveTypeId: lt.id,
          leaveTypeName: lt.name,
          count: filteredRequests.filter(lr => lr.leaveTypeId === lt.id).length,
          totalDays: filteredRequests
            .filter(lr => lr.leaveTypeId === lt.id)
            .reduce((sum, lr) => sum + lr.totalDays, 0),
        })),
        totalDays: filteredRequests.reduce((sum, lr) => sum + lr.totalDays, 0),
        averageDaysPerRequest: filteredRequests.length > 0
          ? filteredRequests.reduce((sum, lr) => sum + lr.totalDays, 0) / filteredRequests.length
          : 0,
        topRequesters: Object.entries(
          filteredRequests.reduce((acc, lr) => {
            acc[lr.employeeId] = (acc[lr.employeeId] || 0) + lr.totalDays
            return acc
          }, {} as Record<number, number>)
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([employeeId, totalDays]) => ({
            employeeId: Number(employeeId),
            totalDays,
            employeeName: filteredRequests.find(lr => lr.employeeId === Number(employeeId))?.employeeName || "",
          })),
        leaveBalances: leaveBalances.filter(b => b !== null).flat() as LeaveBalance[],
      }

      const leaveSummaryData = aggregateLeave(filteredRequests)
      const context: AIReportContext = {
        filters,
        generatedAt: new Date().toISOString(),
        reportType: "leave",
        leaveSummary: leaveSummaryData,
        leaveDetails: {
          requests: filteredRequests,
          leaveTypes,
          detailedMetrics,
        },
      }

      const aiText = await aiReportAPI.generateLeaveReport(context)
      setReportTexts(prev => ({ ...prev, leave: aiText }))
      setReportText(aiText || "")
      setSuccessMessage("Đã tạo báo cáo nghỉ phép chi tiết bằng AI.")
    } catch (err: any) {
      console.error("Error generating leave report:", err)
      setError(err?.response?.data?.message || err.message || "Không thể tạo báo cáo nghỉ phép")
    } finally {
      setGenerating(false)
      setLoadingData(false)
    }
  }

  // Báo cáo lịch làm việc chi tiết
  const handleGenerateScheduleReport = async () => {
    setError(null)
    setSuccessMessage(null)
    setGenerating(true)
    setLoadingData(true)

    try {
      const filters = buildFilters()

      // 1. Lấy tất cả work schedules
      const schedules = await attendanceAPI.getWorkSchedules({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: 0,
        size: 1000,
      })

      // 2. Lấy tất cả work shifts
      const workShifts = await attendanceAPI.getWorkShifts()

      // 3. Tính toán metrics chi tiết
      const detailedMetrics = {
        totalSchedules: schedules.totalElements,
        totalEmployees: new Set(schedules.content.map(s => s.employeeId)).size,
        byStatus: {
          SCHEDULED: schedules.content.filter(s => s.status === 'SCHEDULED').length,
          COMPLETED: schedules.content.filter(s => s.status === 'COMPLETED').length,
          ABSENT: schedules.content.filter(s => s.status === 'ABSENT').length,
          CANCELLED: schedules.content.filter(s => s.status === 'CANCELLED').length,
        },
        byWorkShift: workShifts.map(shift => ({
          shiftId: shift.id,
          shiftName: shift.name,
          count: schedules.content.filter(s => s.workShiftId === shift.id).length,
          completed: schedules.content.filter(s => 
            s.workShiftId === shift.id && s.status === 'COMPLETED'
          ).length,
          absent: schedules.content.filter(s => 
            s.workShiftId === shift.id && s.status === 'ABSENT'
          ).length,
        })),
        complianceRate: schedules.totalElements > 0
          ? (schedules.content.filter(s => s.status === 'COMPLETED').length / schedules.totalElements) * 100
          : 0,
        employeesWithHighAbsence: Object.entries(
          schedules.content
            .filter(s => s.status === 'ABSENT')
            .reduce((acc, s) => {
              acc[s.employeeId] = (acc[s.employeeId] || 0) + 1
              return acc
            }, {} as Record<number, number>)
        )
          .filter(([_, count]) => count >= 3)
          .map(([employeeId, count]) => ({ employeeId: Number(employeeId), count })),
      }

      const workScheduleSummaryData = aggregateWorkSchedules(schedules.content)
      const context: AIReportContext = {
        filters,
        generatedAt: new Date().toISOString(),
        reportType: "schedule",
        workScheduleSummary: workScheduleSummaryData,
        scheduleDetails: {
          schedules: schedules.content,
          workShifts,
          detailedMetrics,
        },
      }

      const aiText = await aiReportAPI.generateScheduleReport(context)
      setReportTexts(prev => ({ ...prev, schedule: aiText }))
      setReportText(aiText || "")
      setSuccessMessage("Đã tạo báo cáo lịch làm việc chi tiết bằng AI.")
    } catch (err: any) {
      console.error("Error generating schedule report:", err)
      setError(err?.response?.data?.message || err.message || "Không thể tạo báo cáo lịch làm việc")
    } finally {
      setGenerating(false)
      setLoadingData(false)
    }
  }

  // Hàm tổng hợp - gọi hàm generate tương ứng với reportType
  const handleGenerateReport = async () => {
    switch (reportType) {
      case 'attendance':
        await handleGenerateAttendanceReport()
        break
      case 'payroll':
        await handleGeneratePayrollReport()
        break
      case 'leave':
        await handleGenerateLeaveReport()
        break
      case 'schedule':
        await handleGenerateScheduleReport()
        break
      case 'overview':
      default:
        await handleGenerateOverviewReport()
        break
    }
  }

  // Cập nhật reportText khi reportType thay đổi
  useEffect(() => {
    const savedText = reportTexts[reportType]
    if (savedText) {
      setReportText(savedText)
    } else {
      setReportText("")
    }
  }, [reportType, reportTexts])

  const handleSendEmail = async () => {
    setError(null)
    setSuccessMessage(null)

    if (!recipientEmail) {
      setError("Vui lòng nhập email nhận báo cáo")
      return
    }
    if (!reportText.trim()) {
      setError("Chưa có nội dung báo cáo để gửi")
      return
    }

    setSending(true)
    try {
      const filters = buildFilters()
      await aiReportAPI.sendReportEmail({
        reportText,
        filters,
        recipientEmail,
      })
      setSuccessMessage("Đã gửi báo cáo tới email.")
    } catch (err: any) {
      console.error("Error sending AI report email:", err)
      setError(err?.response?.data?.message || err.message || "Không thể gửi email báo cáo")
    } finally {
      setSending(false)
    }
  }

  const rangeLabel = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${format(start, "dd/MM", { locale: vi })} - ${format(end, "dd/MM/yyyy", { locale: vi })}`
  }, [startDate, endDate])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Viết báo cáo với AI</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tự động tổng hợp dữ liệu chấm công và lương theo tuần/tháng, sinh báo cáo tổng quan cho HR/Manager.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="border-gradient shadow-vibrant">
        <CardHeader>
          <CardTitle>Phạm vi dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Khoảng thời gian:</span>
              <Select value={rangeType} onValueChange={(val) => handleRangeChange(val as RangeType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Tuần hiện tại</SelectItem>
                  <SelectItem value="month">Tháng hiện tại</SelectItem>
                  <SelectItem value="custom">Tuỳ chỉnh (từ - đến)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Từ</span>
              <Input
                type="date"
                className="w-[160px]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={rangeType !== "custom"}
              />
              <span className="text-sm text-muted-foreground">đến</span>
              <Input
                type="date"
                className="w-[160px]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={rangeType !== "custom"}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Phạm vi:</span>
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Toàn công ty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toàn công ty</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Khoảng thời gian đang chọn: <span className="font-medium">{rangeLabel}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-gradient shadow-vibrant">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Báo cáo AI</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
              >
                {generating && <LoadingInline size="sm" />}
                <span>{generating ? "Đang tạo báo cáo..." : "Tạo báo cáo với AI"}</span>
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="Email nhận báo cáo (.docx)"
                  className="w-[260px]"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <Button onClick={handleSendEmail} disabled={sending || !reportText.trim()}>
                  {sending && <LoadingInline size="sm" />}
                  <span>{sending ? "Đang gửi..." : "Gửi báo cáo"}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="overview">Tổng hợp</TabsTrigger>
              <TabsTrigger value="attendance">Chấm công</TabsTrigger>
              <TabsTrigger value="payroll">Lương</TabsTrigger>
              <TabsTrigger value="leave">Nghỉ phép</TabsTrigger>
              <TabsTrigger value="schedule">Lịch làm việc</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              {loadingData && !reportText && (
                <LoadingPage message="Đang thu thập dữ liệu và tạo báo cáo tổng hợp bằng AI..." />
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung báo cáo tổng hợp (có thể chỉnh sửa trước khi gửi)
                </label>
                <Editor
                  apiKey="z171bhrekb9d41scukzkr1q5t0cf9vuek9abbv549brnjuqj"
                  value={reportText}
                  onEditorChange={(content) => {
                    setReportText(content)
                    setReportTexts(prev => ({ ...prev, overview: content }))
                  }}
                  init={{
                    height: 480,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "table",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic underline | alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat",
                    language: "vi",
                    content_style:
                      "body { font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; }",
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              {loadingData && !reportText && (
                <LoadingPage message="Đang thu thập dữ liệu chấm công và tạo báo cáo chi tiết bằng AI..." />
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung báo cáo chấm công chi tiết (có thể chỉnh sửa trước khi gửi)
                </label>
                <Editor
                  apiKey="z171bhrekb9d41scukzkr1q5t0cf9vuek9abbv549brnjuqj"
                  value={reportText}
                  onEditorChange={(content) => {
                    setReportText(content)
                    setReportTexts(prev => ({ ...prev, attendance: content }))
                  }}
                  init={{
                    height: 480,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "table",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic underline | alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat",
                    language: "vi",
                    content_style:
                      "body { font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; }",
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="payroll" className="mt-4">
              {loadingData && !reportText && (
                <LoadingPage message="Đang thu thập dữ liệu lương và tạo báo cáo chi tiết bằng AI..." />
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung báo cáo lương chi tiết (có thể chỉnh sửa trước khi gửi)
                </label>
                <Editor
                  apiKey="z171bhrekb9d41scukzkr1q5t0cf9vuek9abbv549brnjuqj"
                  value={reportText}
                  onEditorChange={(content) => {
                    setReportText(content)
                    setReportTexts(prev => ({ ...prev, payroll: content }))
                  }}
                  init={{
                    height: 480,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "table",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic underline | alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat",
                    language: "vi",
                    content_style:
                      "body { font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; }",
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="leave" className="mt-4">
              {loadingData && !reportText && (
                <LoadingPage message="Đang thu thập dữ liệu nghỉ phép và tạo báo cáo chi tiết bằng AI..." />
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung báo cáo nghỉ phép chi tiết (có thể chỉnh sửa trước khi gửi)
                </label>
                <Editor
                  apiKey="z171bhrekb9d41scukzkr1q5t0cf9vuek9abbv549brnjuqj"
                  value={reportText}
                  onEditorChange={(content) => {
                    setReportText(content)
                    setReportTexts(prev => ({ ...prev, leave: content }))
                  }}
                  init={{
                    height: 480,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "table",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic underline | alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat",
                    language: "vi",
                    content_style:
                      "body { font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; }",
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              {loadingData && !reportText && (
                <LoadingPage message="Đang thu thập dữ liệu lịch làm việc và tạo báo cáo chi tiết bằng AI..." />
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung báo cáo lịch làm việc chi tiết (có thể chỉnh sửa trước khi gửi)
                </label>
                <Editor
                  apiKey="z171bhrekb9d41scukzkr1q5t0cf9vuek9abbv549brnjuqj"
                  value={reportText}
                  onEditorChange={(content) => {
                    setReportText(content)
                    setReportTexts(prev => ({ ...prev, schedule: content }))
                  }}
                  init={{
                    height: 480,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "table",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic underline | alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat",
                    language: "vi",
                    content_style:
                      "body { font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; }",
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}