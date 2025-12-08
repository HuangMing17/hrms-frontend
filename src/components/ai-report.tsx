"use client"

import { useMemo, useState } from "react"
import { Editor } from "@tinymce/tinymce-react"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { LoadingPage, LoadingInline } from "./ui/loading"
import { attendanceAPI, AttendanceRecord, WorkScheduleResponse, WorkScheduleStatus } from "../lib/api/attendance"
import { payrollAPI, PayrollSummaryResponse } from "../lib/api/payroll"
import { departmentAPI, Department } from "../lib/api/department"
import { leaveAPI, LeaveRequest, LeaveStatus } from "../lib/api/leave"
import { aiReportAPI, AIReportContext, AIReportFilters, LeaveSummary, WorkScheduleSummary } from "../lib/api/ai-report"

type RangeType = "week" | "month" | "custom"

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

  const [reportText, setReportText] = useState<string>("")
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

  const handleGenerateReport = async () => {
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
        // Lấy tất cả đơn nghỉ phép trong kỳ (tạm thời không filter theo phòng ban do API chưa trả về department)
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
      setReportText(aiText || "")
      setSuccessMessage("Đã tạo báo cáo bằng AI. Bạn có thể chỉnh sửa nội dung trước khi gửi.")
    } catch (err: any) {
      console.error("Error generating AI report:", err)
      setError(err?.response?.data?.message || err.message || "Không thể tạo báo cáo AI")
    } finally {
      setGenerating(false)
      setLoadingData(false)
    }
  }

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
          {loadingData && !reportText && (
            <LoadingPage message="Đang thu thập dữ liệu và tạo báo cáo bằng AI..." />
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Nội dung báo cáo (có thể chỉnh sửa trước khi gửi)
            </label>
            <Editor
              apiKey="z171bhrekb9d41scukzkr1q5t0cf9vuek9abbv549brnjuqj"
              value={reportText}
              onEditorChange={(content) => setReportText(content)}
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
        </CardContent>
      </Card>
    </div>
  )
}