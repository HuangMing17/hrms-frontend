"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import { format, subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { LoadingPage } from "./ui/loading"
import { Activity, BellRing, Calendar, RefreshCw, TrendingUp, Wallet } from "lucide-react"
import { attendanceAPI, AttendanceRecord, AttendanceStatus } from "../lib/api/attendance"
import { leaveAPI, LeaveRequest, LeaveStatus } from "../lib/api/leave"
import { payrollAPI, PayrollSummaryResponse } from "../lib/api/payroll"
import { employeeAPI, Employee } from "../lib/api/employee"

const ATTENDANCE_RANGE_OPTIONS = [
  { value: "7", label: "7 ngày" },
  { value: "14", label: "14 ngày" },
  { value: "30", label: "30 ngày" },
]

const SHIFT_COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#10b981", "#6366f1"]
const LEAVE_TYPE_COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#facc15", "#34d399", "#fb923c"]
const LEAVE_STATUS_META = [
  { status: LeaveStatus.APPROVED, label: "Đã duyệt", color: "#22c55e" },
  { status: LeaveStatus.REJECTED, label: "Từ chối", color: "#ef4444" },
  { status: LeaveStatus.PENDING, label: "Chờ duyệt", color: "#f97316" },
  { status: LeaveStatus.CANCELLED, label: "Đã hủy", color: "#94a3b8" },
]

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
})

const parseHours = (value?: string | null) => {
  if (!value) return 0
  if (value.includes(":")) {
    const [hours, minutes] = value.split(":").map((segment) => Number(segment))
    if (!Number.isNaN(hours)) {
      return hours + (!Number.isNaN(minutes) ? minutes / 60 : 0)
    }
  }
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function ReportsAnalytics() {
  const now = new Date()
  const [attendanceRange, setAttendanceRange] = useState("30")
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [refreshKey, setRefreshKey] = useState(0)

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummaryResponse | null>(null)
  const [employeeMap, setEmployeeMap] = useState<Record<number, string>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const days = Number(attendanceRange)
        const endDate = format(now, "yyyy-MM-dd")
        const startDate = format(subDays(now, days - 1), "yyyy-MM-dd")

        const [attendanceRes, leaveRes, payrollRes, employeesRes] = await Promise.all([
          attendanceAPI.getAttendanceReport({ startDate, endDate, page: 0, size: 500 }),
          leaveAPI.getAllLeaveRequests({ page: 0, size: 200 }),
          payrollAPI.getPayrollSummary(selectedMonth, selectedYear),
          employeeAPI.getAllEmployees(0, 500),
        ])

        if (!isMounted) return

        setAttendanceRecords(attendanceRes.content || [])
        setLeaveRequests(leaveRes.content || [])
        setPayrollSummary(payrollRes)

        const employees = employeesRes?.employees ?? []
        const lookup: Record<number, string> = {}
        employees.forEach((employee: Employee) => {
          lookup[employee.id] = employee.departmentName || "Chưa có phòng ban"
        })
        setEmployeeMap(lookup)
      } catch (err) {
        console.error("Failed to load analytics data", err)
        if (isMounted) {
          setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [attendanceRange, selectedMonth, selectedYear, refreshKey])

  const attendanceInsights = useMemo(() => {
    const dailyMap = new Map<
      string,
      {
        workHours: number
        lateCount: number
        total: number
      }
    >()
    const shiftMap = new Map<string, number>()
    let totalHours = 0
    let lateRecords = 0

    attendanceRecords.forEach((record) => {
      const hours = parseHours(record.workHours)
      totalHours += hours
      const dateLabel = format(new Date(record.attendanceDate), "dd/MM")
      const current = dailyMap.get(dateLabel) || { workHours: 0, lateCount: 0, total: 0 }
      current.workHours += hours
      current.total += 1
      if (record.status === AttendanceStatus.LATE) {
        current.lateCount += 1
        lateRecords += 1
      }
      dailyMap.set(dateLabel, current)

      const shift = record.workShiftName || "Chưa phân ca"
      shiftMap.set(shift, (shiftMap.get(shift) || 0) + 1)
    })

    const dailyPoints = Array.from(dailyMap.entries())
      .sort(
        (a, b) =>
          new Date(a[0].split("/").reverse().join("-")).getTime() -
          new Date(b[0].split("/").reverse().join("-")).getTime()
      )
      .map(([label, value]) => ({
        label,
        workHours: Number(value.workHours.toFixed(2)),
        lateRate: value.total ? Number(((value.lateCount / value.total) * 100).toFixed(1)) : 0,
      }))

    const shiftDistribution = Array.from(shiftMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: SHIFT_COLORS[index % SHIFT_COLORS.length],
    }))

    return {
      totalHours,
      totalRecords: attendanceRecords.length,
      lateRate: attendanceRecords.length ? (lateRecords / attendanceRecords.length) * 100 : 0,
      dailyPoints,
      shiftDistribution,
    }
  }, [attendanceRecords])

  const leaveInsights = useMemo(() => {
    const typeMap = new Map<string, number>()
    const statusCounts: Record<LeaveStatus, number> = {
      [LeaveStatus.APPROVED]: 0,
      [LeaveStatus.REJECTED]: 0,
      [LeaveStatus.PENDING]: 0,
      [LeaveStatus.CANCELLED]: 0,
      [LeaveStatus.WITHDRAWN]: 0,
    }

    leaveRequests.forEach((request) => {
      const typeName = request.leaveTypeName || `Loại #${request.leaveTypeId}`
      typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1)

      if (statusCounts[request.status as LeaveStatus] !== undefined) {
        statusCounts[request.status as LeaveStatus] += 1
      }
    })

    const leaveTypeData = Array.from(typeMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: LEAVE_TYPE_COLORS[index % LEAVE_TYPE_COLORS.length],
    }))

    const leaveStatusData = LEAVE_STATUS_META.map((meta) => ({
      name: meta.label,
      value: statusCounts[meta.status] || 0,
      color: meta.color,
    }))

    const approved = statusCounts[LeaveStatus.APPROVED] || 0
    const total = leaveRequests.length || 1

    return {
      totalRequests: leaveRequests.length,
      approvedRate: (approved / total) * 100,
      leaveTypeData,
      leaveStatusData,
    }
  }, [leaveRequests])

  const payrollInsights = useMemo(() => {
    if (!payrollSummary) {
      return {
        totalNetPay: 0,
        totalOvertime: 0,
        totalEmployees: 0,
        departmentData: [],
      }
    }

    const departmentMap = new Map<
      string,
      {
        baseSalary: number
        allowances: number
        overtime: number
        deductions: number
      }
    >()

    payrollSummary.payrolls?.forEach((payroll) => {
      const department = employeeMap[payroll.employeeId] || "Chưa có phòng ban"
      const entry = departmentMap.get(department) || {
        baseSalary: 0,
        allowances: 0,
        overtime: 0,
        deductions: 0,
      }
      entry.baseSalary += payroll.baseSalary || 0
      entry.allowances += payroll.totalAllowances || 0
      entry.overtime += payroll.overtimePay || 0
      entry.deductions += payroll.totalDeductions || 0
      departmentMap.set(department, entry)
    })

    const departmentData = Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      baseSalary: Math.round(data.baseSalary),
      allowances: Math.round(data.allowances),
      overtime: Math.round(data.overtime),
      deductions: Math.round(data.deductions),
    }))

    return {
      totalNetPay: payrollSummary.totalNetPay || 0,
      totalOvertime: payrollSummary.totalOvertimePay || 0,
      totalEmployees: payrollSummary.totalEmployees || payrollSummary.payrolls?.length || 0,
      departmentData,
    }
  }, [payrollSummary, employeeMap])

  const summaryCards = [
    {
      title: "Tổng giờ công",
      value: `${numberFormatter.format(attendanceInsights.totalHours)} giờ`,
      description: `Tỉ lệ đi muộn ${attendanceInsights.lateRate.toFixed(1)}%`,
      icon: Calendar,
      gradient: "bg-rose-gradient",
    },
    {
      title: "Đơn nghỉ phép",
      value: leaveInsights.totalRequests.toString(),
      description: `Tỉ lệ duyệt ${leaveInsights.approvedRate.toFixed(1)}%`,
      icon: BellRing,
      gradient: "bg-purple-gradient",
    },
    {
      title: "Chi phí lương (net)",
      value: currencyFormatter.format(payrollInsights.totalNetPay),
      description: `${payrollInsights.totalEmployees} nhân viên`,
      icon: Wallet,
      gradient: "bg-beauty-gradient",
    },
    {
      title: "Lương tăng ca",
      value: currencyFormatter.format(payrollInsights.totalOvertime),
      description: "Bao gồm phụ cấp & OT",
      icon: Activity,
      gradient: "bg-coral-gradient",
    },
  ]

  const yearOptions = Array.from({ length: 4 }, (_, index) => (now.getFullYear() - index).toString())

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-gradient">Báo cáo & thống kê</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Tổng hợp dữ liệu thời gian thực từ Attendance, Leave và Payroll Service để hỗ trợ HR & Manager ra quyết
            định.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={attendanceRange} onValueChange={setAttendanceRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <SelectItem key={month} value={String(month)}>
                  Tháng {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingPage message="Đang tải dữ liệu báo cáo..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.title} className="hover-glow border-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`rounded-lg p-2 ${card.gradient}`}>
                    <card.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{card.value}</div>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="attendance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
              <TabsTrigger value="attendance">Chấm công</TabsTrigger>
              <TabsTrigger value="leave">Nghỉ phép</TabsTrigger>
              <TabsTrigger value="payroll">Lương thưởng</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="shadow-vibrant">
                  <CardHeader>
                    <CardTitle className="text-gradient">Tổng giờ công & tỉ lệ đi muộn</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Dữ liệu {attendanceRange} ngày gần nhất dựa trên Attendance Service
                    </p>
                  </CardHeader>
                  <CardContent>
                    {attendanceInsights.dailyPoints.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu chấm công</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart data={attendanceInsights.dailyPoints}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="workHours" name="Giờ công" fill="#ec4899" radius={[4, 4, 0, 0]} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="lateRate"
                            name="Tỉ lệ đi muộn"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-vibrant">
                  <CardHeader>
                    <CardTitle className="text-gradient">Phân bố ca làm việc</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Thể hiện số lượt chấm công theo từng ca để tối ưu phân bổ nhân sự.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {attendanceInsights.shiftDistribution.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu ca làm việc</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={attendanceInsights.shiftDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                          >
                            {attendanceInsights.shiftDistribution.map((entry, index) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leave" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="shadow-vibrant">
                  <CardHeader>
                    <CardTitle className="text-gradient">Đơn nghỉ phép theo loại</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Thông tin lấy từ Leave Service, hỗ trợ hoạch định chính sách phúc lợi.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {leaveInsights.leaveTypeData.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu nghỉ phép</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={leaveInsights.leaveTypeData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            label
                          >
                            {leaveInsights.leaveTypeData.map((entry, index) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-vibrant">
                  <CardHeader>
                    <CardTitle className="text-gradient">Tỉ lệ duyệt nghỉ</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Theo dõi trạng thái duyệt / từ chối để cân đối quy trình phê duyệt.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {leaveInsights.leaveStatusData.every((item) => item.value === 0) ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu trạng thái</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={leaveInsights.leaveStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                          >
                            {leaveInsights.leaveStatusData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payroll" className="space-y-6">
              <Card className="shadow-vibrant">
                <CardHeader>
                  <CardTitle className="text-gradient">Chi phí lương theo phòng ban</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tổng hợp từ Payroll Service cho tháng {selectedMonth}/{selectedYear}.
                  </p>
                </CardHeader>
                <CardContent>
                  {payrollInsights.departmentData.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Chưa có bảng lương trong kỳ</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={payrollInsights.departmentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="department" />
                        <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                        <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                        <Legend />
                        <Bar dataKey="baseSalary" name="Lương cơ bản" stackId="a" fill="#ec4899" />
                        <Bar dataKey="allowances" name="Phụ cấp" stackId="a" fill="#8b5cf6" />
                        <Bar dataKey="overtime" name="Tăng ca" stackId="a" fill="#06b6d4" />
                        <Bar dataKey="deductions" name="Khấu trừ" stackId="a" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
