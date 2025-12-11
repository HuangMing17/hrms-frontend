import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNowStrict, subDays } from "date-fns"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from "recharts"
import { Users, UserCheck, Clock, Wallet, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { LoadingPage } from "./ui/loading"
import { attendanceAPI, AttendanceRecord, AttendanceStatus } from "../lib/api/attendance"
import { leaveAPI, LeaveRequest, LeaveStatus } from "../lib/api/leave"
import { payrollAPI, PayrollSummaryResponse } from "../lib/api/payroll"
import { employeeAPI } from "../lib/api/employee"
import { notificationAPI, NotificationResponse } from "../lib/api/notification"

const ATTENDANCE_RANGE_OPTIONS = [
  { value: "7", label: "7 ngày" },
  { value: "14", label: "14 ngày" },
  { value: "30", label: "30 ngày" },
]

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  [LeaveStatus.APPROVED]: "#22c55e",
  [LeaveStatus.PENDING]: "#f97316",
  [LeaveStatus.REJECTED]: "#ef4444",
  [LeaveStatus.CANCELLED]: "#94a3b8",
  [LeaveStatus.WITHDRAWN]: "#a78bfa",
}

const PRESENT_STATUSES = new Set<AttendanceStatus>([
  AttendanceStatus.PRESENT,
  AttendanceStatus.OVERTIME,
  AttendanceStatus.HALF_DAY,
])

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
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

export function HRDashboard() {
  const [attendanceRange, setAttendanceRange] = useState("7")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummaryResponse | null>(null)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setLoading(true)
      setError(null)
      try {
        const today = new Date()
        const endDate = format(today, "yyyy-MM-dd")
        const startDate = format(subDays(today, Number(attendanceRange) - 1), "yyyy-MM-dd")

        const [attendanceRes, leaveRes, payrollRes, employeesRes] = await Promise.all([
          attendanceAPI.getAttendanceReport({ startDate, endDate, page: 0, size: 1000 }),
          leaveAPI.getAllLeaveRequests({ page: 0, size: 300 }),
          payrollAPI.getPayrollSummary(today.getMonth() + 1, today.getFullYear()),
          employeeAPI.getAllEmployees(0, 1),
        ])

        let latestNotifications: NotificationResponse[] = []
        try {
          const notificationRes = await notificationAPI.search(undefined, undefined, 0, 5)
          latestNotifications = notificationRes.content || []
        } catch (notificationError) {
          console.warn("Không thể tải thông báo, bỏ qua cho lần này.", notificationError)
        }

        if (!isMounted) return

        setAttendanceRecords(attendanceRes.content || [])
        setLeaveRequests(leaveRes.content || [])
        setPayrollSummary(payrollRes)
        setTotalEmployees(employeesRes?.totalElements ?? employeesRes?.employees?.length ?? 0)
        setNotifications(latestNotifications)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
        if (isMounted) {
          setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [attendanceRange])

  const attendanceInsights = useMemo(() => {
    const todayLabel = format(new Date(), "yyyy-MM-dd")
    const todaysRecords = attendanceRecords.filter((record) => record.attendanceDate === todayLabel)
    const presentCount = todaysRecords.filter((record) => PRESENT_STATUSES.has(record.status)).length
    const lateCount = todaysRecords.filter((record) => record.status === AttendanceStatus.LATE).length
    const todayRate = todaysRecords.length ? (presentCount / todaysRecords.length) * 100 : 0

    const dailyMap = new Map<
      string,
      {
        workHours: number
        lateCount: number
        total: number
      }
    >()

    attendanceRecords.forEach((record) => {
      const label = format(new Date(record.attendanceDate), "dd/MM")
      const current = dailyMap.get(label) || { workHours: 0, lateCount: 0, total: 0 }
      current.workHours += parseHours(record.workHours)
      current.total += 1
      if (record.status === AttendanceStatus.LATE) {
        current.lateCount += 1
      }
      dailyMap.set(label, current)
    })

    const series = Array.from(dailyMap.entries())
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

    return {
      presentCount,
      lateCount,
      todayRate,
      chartData: series,
    }
  }, [attendanceRecords])

  const leaveSummary = useMemo(() => {
    const today = new Date()
    const statusCounts: Record<LeaveStatus, number> = {
      [LeaveStatus.APPROVED]: 0,
      [LeaveStatus.PENDING]: 0,
      [LeaveStatus.REJECTED]: 0,
      [LeaveStatus.CANCELLED]: 0,
      [LeaveStatus.WITHDRAWN]: 0,
    }

    let activeLeaves = 0

    leaveRequests.forEach((request) => {
      if (statusCounts[request.status as LeaveStatus] !== undefined) {
        statusCounts[request.status as LeaveStatus] += 1
      }

      const start = new Date(request.startDate)
      const end = new Date(request.endDate)
      const isActive = request.status === LeaveStatus.APPROVED && start <= today && end >= today
      if (isActive) {
        activeLeaves += 1
      }
    })

    const statusChartData = (Object.keys(statusCounts) as LeaveStatus[])
      .filter((status) => status !== LeaveStatus.WITHDRAWN)
      .map((status) => ({
        status,
        label:
          status === LeaveStatus.APPROVED
            ? "Đã duyệt"
            : status === LeaveStatus.PENDING
              ? "Chờ duyệt"
              : status === LeaveStatus.REJECTED
                ? "Từ chối"
                : "Khác",
        value: statusCounts[status],
        color: LEAVE_STATUS_COLORS[status],
      }))

    return {
      activeLeaves,
      pendingLeaves: statusCounts[LeaveStatus.PENDING],
      statusChartData,
    }
  }, [leaveRequests])

  const payrollTotals = useMemo(() => {
    if (!payrollSummary) {
      return {
        netPay: 0,
        allowances: 0,
        overtime: 0,
        employees: 0,
      }
    }

    return {
      netPay: payrollSummary.totalNetPay || 0,
      allowances: payrollSummary.totalAllowances || 0,
      overtime: payrollSummary.totalOvertimePay || 0,
      employees: payrollSummary.totalEmployees || payrollSummary.payrolls?.length || 0,
    }
  }, [payrollSummary])

  const statCards = [
    {
      title: "Tổng nhân viên",
      value: totalEmployees.toString(),
      description: "Đang hoạt động",
      icon: Users,
      gradient: "bg-rose-gradient",
    },
    {
      title: "Có mặt hôm nay",
      value: attendanceInsights.presentCount.toString(),
      description: `${attendanceInsights.todayRate.toFixed(1)}% chấm công`,
      icon: UserCheck,
      gradient: "bg-purple-gradient",
    },
    {
      title: "Đang nghỉ phép",
      value: leaveSummary.activeLeaves.toString(),
      description: `${leaveSummary.pendingLeaves} đơn chờ duyệt`,
      icon: Clock,
      gradient: "bg-coral-gradient",
    },
    {
      title: "Chi phí lương tháng",
      value: currencyFormatter.format(payrollTotals.netPay),
      description: `${payrollTotals.employees} nhân viên`,
      icon: Wallet,
      gradient: "bg-beauty-gradient",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-gradient">Tổng quan hoạt động</h2>
        <p className="text-muted-foreground">
          Dữ liệu thời gian thực từ Attendance, Leave, Payroll và Notification Service.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingPage message="Đang tải dữ liệu tổng quan..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.title} className="shadow-vibrant hover-glow border-gradient">
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="shadow-vibrant xl:col-span-2">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-gradient">Chấm công & đi muộn</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Theo dõi giờ công và tỉ lệ đi muộn {attendanceRange} ngày gần nhất.
                  </p>
                </div>
                <Select value={attendanceRange} onValueChange={setAttendanceRange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Khoảng ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {attendanceInsights.chartData.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng này</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={attendanceInsights.chartData}>
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
                <CardTitle className="text-gradient">Trạng thái nghỉ phép</CardTitle>
                <p className="text-sm text-muted-foreground">Phân bố đơn nghỉ trong hệ thống Leave Service.</p>
              </CardHeader>
              <CardContent>
                {leaveSummary.statusChartData.every((item) => item.value === 0) ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu nghỉ phép</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={leaveSummary.statusChartData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {leaveSummary.statusChartData.map((entry) => (
                          <Cell key={entry.status} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Đơn duyệt:</span> {leaveSummary.statusChartData.find((item) =>
                      item.label.includes("duyệt")
                    )?.value || 0}
                  </p>
                  <p>
                    <span className="font-medium">Chờ duyệt:</span> {leaveSummary.pendingLeaves}
                  </p>
                  <p>
                    <span className="font-medium">Đang nghỉ:</span> {leaveSummary.activeLeaves}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="shadow-vibrant">
              <CardHeader>
                <CardTitle className="text-gradient">Tổng quan lương tháng hiện tại</CardTitle>
                <p className="text-sm text-muted-foreground">Số liệu lấy từ Payroll Service.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-white/50 px-4 py-3 dark:bg-gray-900/40">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng chi phí (Net)</p>
                    <p className="text-xl font-semibold">{currencyFormatter.format(payrollTotals.netPay)}</p>
                  </div>
                  <div className="rounded-full bg-beauty-gradient/20 p-3">
                    <Wallet className="h-5 w-5 text-pink-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-muted-foreground">Phụ cấp</p>
                    <p className="text-lg font-medium">{currencyFormatter.format(payrollTotals.allowances)}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-muted-foreground">Tăng ca</p>
                    <p className="text-lg font-medium">{currencyFormatter.format(payrollTotals.overtime)}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-muted-foreground">Nhân sự nhận lương</p>
                    <p className="text-lg font-medium">{payrollTotals.employees}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-muted-foreground">Kỳ lương</p>
                    <p className="text-lg font-medium">
                      Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-vibrant">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gradient">Thông báo gần đây</CardTitle>
                  <p className="text-sm text-muted-foreground">Tổng hợp từ Notification Service.</p>
                </div>
                <div className="rounded-full bg-rose-gradient/20 p-2">
                  <Bell className="h-4 w-4 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Chưa có thông báo nào</div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => {
                      // Validate createdAt trước khi format
                      let timeAgo = "Vừa xong"
                      if (notification.createdAt) {
                        try {
                          const createdAtDate = new Date(notification.createdAt)
                          // Kiểm tra xem Date có hợp lệ không
                          if (!isNaN(createdAtDate.getTime())) {
                            timeAgo = formatDistanceToNowStrict(createdAtDate, { addSuffix: true })
                          }
                        } catch (error) {
                          console.warn("Invalid createdAt for notification:", notification.id, notification.createdAt)
                        }
                      }
                      
                      return (
                        <div key={notification.id} className="rounded-lg border border-border/60 p-3">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {timeAgo}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
