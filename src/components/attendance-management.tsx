"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, Calendar, TrendingUp, CheckCircle, XCircle, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Textarea } from "./ui/textarea"
import {
    attendanceAPI,
    AttendanceRecord,
    AttendanceReportParams,
    AttendanceStatus,
    ManualAttendanceRequest,
    WorkShiftResponse,
    WorkScheduleRequest,
    WorkScheduleResponse,
    WorkScheduleStatus,
} from "../lib/api/attendance"
import { employeeAPI, Employee } from "../lib/api/employee"
import { departmentAPI, Department } from "../lib/api/department"
import { useAuth } from "../contexts/AuthContext"
import { ManualAttendanceDialog } from "./attendance/manual-attendance-dialog"
import { WeekSelector } from "./attendance/WeekSelector"
import { WeeklyAttendanceGrid } from "./attendance/WeeklyAttendanceGrid"
import { useWeekNavigation } from "../hooks/useWeekNavigation"
import { WorkScheduleCalendar } from "./attendance/WorkScheduleCalendar"

const PAGE_SIZE = 20

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "Có mặt",
    [AttendanceStatus.LATE]: "Muộn",
    [AttendanceStatus.ABSENT]: "Vắng mặt",
    [AttendanceStatus.HALF_DAY]: "Nửa ngày",
    [AttendanceStatus.EARLY_DEPARTURE]: "Về sớm",
    [AttendanceStatus.OVERTIME]: "Tăng ca",
}

const WORK_SCHEDULE_STATUS: WorkScheduleStatus[] = ["SCHEDULED", "COMPLETED", "ABSENT", "CANCELLED"]

interface ReportStat {
    label: string
    present: number
    late: number
    absent: number
}

export function AttendanceManagement() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState("weekly")
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("all")

    // Week navigation
    const { currentWeek, goToPreviousWeek, goToNextWeek, goToToday, formatWeekRange } = useWeekNavigation()
    const [weekStartDate, setWeekStartDate] = useState<Date>(currentWeek.startDate)
    const [weekEndDate, setWeekEndDate] = useState<Date>(currentWeek.endDate)

    // Update week dates when currentWeek changes
    useEffect(() => {
        setWeekStartDate(currentWeek.startDate)
        setWeekEndDate(currentWeek.endDate)
    }, [currentWeek])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [departments, setDepartments] = useState<Department[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])

    const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
    const [workShifts, setWorkShifts] = useState<WorkShiftResponse[]>([])
    const [reportStats, setReportStats] = useState<ReportStat[]>([])
    const [schedules, setSchedules] = useState<WorkScheduleResponse[]>([])
    const [schedulePage, setSchedulePage] = useState(0)
    const [scheduleTotalPages, setScheduleTotalPages] = useState(0)

    const [scheduleFilters, setScheduleFilters] = useState({
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        departmentId: "all",
        employeeId: "all",
    })

    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<WorkScheduleResponse | null>(null)
    const [scheduleForm, setScheduleForm] = useState<WorkScheduleRequest>({
        scheduleDate: new Date().toISOString().split("T")[0],
        status: "SCHEDULED",
    })

    const [manualDialogOpen, setManualDialogOpen] = useState(false)
    const [manualForm, setManualForm] = useState<ManualAttendanceRequest>({
        employeeId: 0,
        attendanceDate: new Date().toISOString().split("T")[0],
        status: AttendanceStatus.PRESENT,
    })

    const todaySummary = useMemo(() => {
        const present = todayRecords.filter((item) => item.status === AttendanceStatus.PRESENT).length
        const late = todayRecords.filter((item) => item.status === AttendanceStatus.LATE).length
        const absent = todayRecords.filter((item) => item.status === AttendanceStatus.ABSENT).length
        return { present, late, absent }
    }, [todayRecords])

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    departmentAPI.getDepartments(),
                    employeeAPI.getAllEmployees(0, 500),
                ])
                setDepartments(deptRes)
                setEmployees(empRes.employees ?? [])
            } catch (err: any) {
                console.error("Unable to load departments/employees", err)
                setError(err?.response?.data?.message || err.message || "Không thể tải dữ liệu phòng ban/nhân viên")
            }

            await Promise.all([loadTodayAttendance("all"), loadWorkShifts(), loadReportStats()])
            // Load schedules for current month
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            await loadSchedules(
                monthStart.toISOString().split("T")[0],
                monthEnd.toISOString().split("T")[0]
            )
        }
        bootstrap()
    }, [])

    const loadTodayAttendance = async (departmentId: string) => {
        setLoading(true)
        setError(null)
        try {
            const today = new Date().toISOString().split("T")[0]
            const params: AttendanceReportParams = {
                startDate: today,
                endDate: today,
                page: 0,
                size: PAGE_SIZE,
                departmentId: departmentId !== "all" ? Number(departmentId) : undefined,
            }
            const { content } = await attendanceAPI.getAttendanceReport(params)
            setTodayRecords(content)
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể tải dữ liệu hôm nay")
        } finally {
            setLoading(false)
        }
    }

    const loadWorkShifts = async () => {
        try {
            const data = await attendanceAPI.getWorkShifts()
            setWorkShifts(data)
        } catch (err) {
            console.error("loadWorkShifts", err)
        }
    }

    const loadReportStats = async () => {
        try {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
            const { content } = await attendanceAPI.getAttendanceReport({
                startDate: start,
                endDate: end,
                page: 0,
                size: 200,
            })

            const bucket: ReportStat = { label: `${now.getMonth() + 1}/${now.getFullYear()}`, present: 0, late: 0, absent: 0 }
            content.forEach((record) => {
                if (record.status === AttendanceStatus.PRESENT) bucket.present += 1
                else if (record.status === AttendanceStatus.LATE || record.status === AttendanceStatus.HALF_DAY) bucket.late += 1
                else bucket.absent += 1
            })
            const total = bucket.present + bucket.late + bucket.absent || 1
            setReportStats([
                {
                    label: bucket.label,
                    present: Math.round((bucket.present / total) * 100),
                    late: Math.round((bucket.late / total) * 100),
                    absent: Math.round((bucket.absent / total) * 100),
                },
            ])
        } catch (err) {
            console.error("loadReportStats", err)
        }
    }

    const loadSchedules = async (startDate?: string, endDate?: string, departmentId?: number, employeeId?: number) => {
        setLoading(true)
        setError(null)
        try {
            const { content, totalPages } = await attendanceAPI.getWorkSchedules({
                startDate: startDate || scheduleFilters.startDate,
                endDate: endDate || scheduleFilters.endDate,
                departmentId: departmentId !== undefined ? departmentId : (scheduleFilters.departmentId !== "all" ? Number(scheduleFilters.departmentId) : undefined),
                employeeId: employeeId !== undefined ? employeeId : (scheduleFilters.employeeId !== "all" ? Number(scheduleFilters.employeeId) : undefined),
                page: 0,
                size: 1000, // Load all for calendar view
            })
            setSchedules(content)
            setSchedulePage(0)
            setScheduleTotalPages(totalPages)
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể tải lịch làm việc")
        } finally {
            setLoading(false)
        }
    }

    const handleDepartmentChange = (value: string) => {
        setSelectedDepartmentId(value)
        loadTodayAttendance(value)
    }

    const handleManualSubmit = async () => {
        if (!manualForm.employeeId) {
            setError("Vui lòng chọn nhân viên")
            return
        }
        setLoading(true)
        setError(null)
        try {
            await attendanceAPI.createManualAttendance(manualForm)
            setManualDialogOpen(false)
            setManualForm({
                employeeId: 0,
                attendanceDate: new Date().toISOString().split("T")[0],
                status: AttendanceStatus.PRESENT,
            })
            await loadTodayAttendance(selectedDepartmentId)
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể tạo bản ghi")
        } finally {
            setLoading(false)
        }
    }

    const openScheduleDialog = (schedule?: WorkScheduleResponse) => {
        if (schedule) {
            setEditingSchedule(schedule)
            setScheduleForm({
                employeeId: schedule.employeeId,
                workShiftId: schedule.workShiftId,
                scheduleDate: schedule.scheduleDate,
                status: schedule.status,
                notes: schedule.notes,
            })
        } else {
            setEditingSchedule(null)
            setScheduleForm({
                employeeId: undefined,
                workShiftId: undefined,
                scheduleDate: new Date().toISOString().split("T")[0],
                status: "SCHEDULED",
                notes: "",
            })
        }
        setScheduleDialogOpen(true)
    }

    const handleSaveSchedule = async () => {
        if (!scheduleForm.employeeId || !scheduleForm.workShiftId || !scheduleForm.scheduleDate) {
            setError("Vui lòng chọn nhân viên, ca và ngày")
            return
        }
        setLoading(true)
        setError(null)
        try {
            if (editingSchedule) {
                await attendanceAPI.updateWorkSchedule(editingSchedule.id, scheduleForm)
            } else {
                await attendanceAPI.createWorkSchedule(scheduleForm)
            }
            setScheduleDialogOpen(false)
            await loadSchedules()
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể lưu lịch làm việc")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteSchedule = async (schedule: WorkScheduleResponse) => {
        if (!confirm("Bạn có chắc chắn muốn xóa lịch làm việc này?")) return
        setLoading(true)
        setError(null)
        try {
            await attendanceAPI.deleteWorkSchedule(schedule.id)
            await loadSchedules()
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể xóa lịch làm việc")
        } finally {
            setLoading(false)
        }
    }

    // New handlers for calendar component
    const handleScheduleCreate = async (scheduleData: any) => {
        setLoading(true)
        setError(null)
        try {
            await attendanceAPI.createWorkSchedule(scheduleData)
            // Reload schedules for current month
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            await loadSchedules(
                monthStart.toISOString().split("T")[0],
                monthEnd.toISOString().split("T")[0]
            )
        } catch (err: any) {
            // Extract detailed error message from validation errors
            let errorMessage = "Không thể tạo lịch làm việc"
            if (err?.response?.data) {
                const data = err.response.data
                if (data.error?.validationErrors) {
                    // Format validation errors
                    const validationErrors = data.error.validationErrors
                    const errorMessages = Object.entries(validationErrors)
                        .map(([field, messages]: [string, any]) => {
                            const fieldName = field === 'scheduleDate' ? 'Ngày' :
                                field === 'employeeId' ? 'Nhân viên' :
                                    field === 'workShiftId' ? 'Ca làm việc' : field
                            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
                        })
                    errorMessage = errorMessages.join('\n')
                } else if (data.message) {
                    errorMessage = data.message
                } else if (data.error?.message) {
                    errorMessage = data.error.message
                }
            } else if (err.message) {
                errorMessage = err.message
            }
            setError(errorMessage)
            console.error("Error creating work schedule:", err?.response?.data || err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleScheduleUpdate = async (id: number, scheduleData: any) => {
        setLoading(true)
        setError(null)
        try {
            await attendanceAPI.updateWorkSchedule(id, scheduleData)
            // Reload schedules for current month
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            await loadSchedules(
                monthStart.toISOString().split("T")[0],
                monthEnd.toISOString().split("T")[0]
            )
        } catch (err: any) {
            // Extract detailed error message from validation errors
            let errorMessage = "Không thể cập nhật lịch làm việc"
            if (err?.response?.data) {
                const data = err.response.data
                if (data.error?.validationErrors) {
                    const validationErrors = data.error.validationErrors
                    const errorMessages = Object.entries(validationErrors)
                        .map(([field, messages]: [string, any]) => {
                            const fieldName = field === 'scheduleDate' ? 'Ngày' :
                                field === 'employeeId' ? 'Nhân viên' :
                                    field === 'workShiftId' ? 'Ca làm việc' : field
                            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
                        })
                    errorMessage = errorMessages.join('\n')
                } else if (data.message) {
                    errorMessage = data.message
                } else if (data.error?.message) {
                    errorMessage = data.error.message
                }
            } else if (err.message) {
                errorMessage = err.message
            }
            setError(errorMessage)
            console.error("Error updating work schedule:", err?.response?.data || err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleScheduleDelete = async (id: number) => {
        setLoading(true)
        setError(null)
        try {
            await attendanceAPI.deleteWorkSchedule(id)
            // Reload schedules for current month
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            await loadSchedules(
                monthStart.toISOString().split("T")[0],
                monthEnd.toISOString().split("T")[0]
            )
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể xóa lịch làm việc")
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleExportReport = async () => {
        try {
            const today = new Date().toISOString().split("T")[0]
            const blob = await attendanceAPI.exportAttendanceReport(
                {
                    startDate: today,
                    endDate: today,
                    departmentId: selectedDepartmentId !== "all" ? Number(selectedDepartmentId) : undefined,
                },
                "csv",
            )
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `attendance-report-${today}.csv`
            a.style.display = "none"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            // Kiểm tra element vẫn là child của body trước khi remove
            if (a.parentNode === document.body) {
                document.body.removeChild(a)
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Không thể xuất báo cáo")
        }
    }

    const getStatusBadge = (status: AttendanceStatus) => {
        const color =
            status === AttendanceStatus.PRESENT
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : status === AttendanceStatus.ABSENT
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : status === AttendanceStatus.LATE
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        return <Badge className={color}>{STATUS_LABELS[status]}</Badge>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gradient">Quản lý chấm công</h2>
                    <p className="text-sm text-muted-foreground">Theo dõi giờ làm việc và chấm công nhân viên</p>
                </div>
                <Button
                    className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                    onClick={() => setManualDialogOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Chấm công thủ công
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Có mặt hôm nay</CardTitle>
                        <div className="p-2 rounded-full bg-rose-gradient">
                            <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todaySummary.present}</div>
                        <p className="text-xs text-muted-foreground">Nhân viên đã check-in</p>
                    </CardContent>
                </Card>
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đi muộn</CardTitle>
                        <div className="p-2 rounded-full bg-coral-gradient">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">{todaySummary.late}</div>
                        <p className="text-xs text-muted-foreground">Nhân viên check-in sau giờ</p>
                    </CardContent>
                </Card>
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vắng mặt</CardTitle>
                        <div className="p-2 rounded-full bg-purple-gradient">
                            <XCircle className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">{todaySummary.absent}</div>
                        <p className="text-xs text-muted-foreground">Không có bản ghi chấm công</p>
                    </CardContent>
                </Card>
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Làm thêm giờ</CardTitle>
                        <div className="p-2 rounded-full bg-beauty-gradient">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">
                            {todayRecords.filter((r) => r.overtimeHours && r.overtimeHours !== "PT0S").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Nhân viên làm OT hôm nay</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
                    <TabsTrigger value="weekly">Theo tuần</TabsTrigger>
                    <TabsTrigger value="today">Hôm nay</TabsTrigger>
                    <TabsTrigger value="schedule">Lịch làm việc</TabsTrigger>
                    <TabsTrigger value="shifts">Ca làm việc</TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Chấm công theo tuần</h3>
                        <WeekSelector
                            currentWeek={currentWeek}
                            onPrevious={() => {
                                goToPreviousWeek()
                            }}
                            onNext={() => {
                                goToNextWeek()
                            }}
                            onToday={() => {
                                goToToday()
                            }}
                            formatWeekRange={formatWeekRange}
                        />
                    </div>
                    <WeeklyAttendanceGrid
                        startDate={weekStartDate}
                        endDate={weekEndDate}
                        employees={employees}
                        departments={departments}
                        selectedDepartmentId={selectedDepartmentId}
                        onDepartmentChange={setSelectedDepartmentId}
                    />
                </TabsContent>

                <TabsContent value="today" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Chấm công hôm nay</h3>
                        <div className="flex gap-2">
                            <Select value={selectedDepartmentId} onValueChange={handleDepartmentChange}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Chọn phòng ban" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleExportReport} disabled={loading}>
                                Xuất báo cáo
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border border-gradient shadow-vibrant">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                                    <TableHead>Nhân viên</TableHead>
                                    <TableHead>Phòng ban</TableHead>
                                    <TableHead>Check-in</TableHead>
                                    <TableHead>Check-out</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Làm thêm</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todayRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.employeeName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{record.departmentName ?? "-"}</Badge>
                                        </TableCell>
                                        <TableCell>{record.checkInTime ?? "-"}</TableCell>
                                        <TableCell>{record.checkOutTime ?? "-"}</TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                        <TableCell>
                                            {record.overtimeHours && record.overtimeHours !== "PT0S" && (
                                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {record.overtimeHours.replace("PT", "").toLowerCase()}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {todayRecords.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            Không có dữ liệu
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <WorkScheduleCalendar
                        schedules={schedules}
                        employees={employees}
                        departments={departments}
                        workShifts={workShifts}
                        loading={loading}
                        onScheduleCreate={handleScheduleCreate}
                        onScheduleUpdate={handleScheduleUpdate}
                        onScheduleDelete={handleScheduleDelete}
                    />
                </TabsContent>

                <TabsContent value="shifts" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Quản lý ca làm việc</h3>
                    </div>

                    {workShifts.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">Chưa có ca làm việc nào</CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-vibrant hover-glow border-gradient">
                            <CardHeader>
                                <CardTitle>Danh sách ca</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {workShifts.map((shift) => (
                                        <div key={shift.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-base">{shift.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {shift.startTime} - {shift.endTime} • Nghỉ: {shift.breakDuration ?? "0"}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3 md:items-center">
                                                <Badge variant={shift.active ? "default" : "secondary"}>
                                                    {shift.active ? "Đang sử dụng" : "Tạm ngưng"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <h3 className="text-lg font-semibold">Báo cáo chấm công</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="shadow-vibrant hover-glow border-gradient">
                            <CardHeader>
                                <CardTitle>Thống kê theo tháng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {reportStats.map((stat) => (
                                    <div key={stat.label} className="flex items-center justify-between">
                                        <span className="font-medium">{stat.label}</span>
                                        <div className="flex gap-2">
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {stat.present}%
                                            </Badge>
                                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                {stat.late}%
                                            </Badge>
                                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{stat.absent}%</Badge>
                                        </div>
                                    </div>
                                ))}
                                {reportStats.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu báo cáo</p>}
                            </CardContent>
                        </Card>

                        <Card className="shadow-vibrant hover-glow border-gradient">
                            <CardHeader>
                                <CardTitle>Tùy chọn báo cáo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Loại báo cáo</Label>
                                    <Select defaultValue="daily">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại báo cáo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Báo cáo ngày</SelectItem>
                                            <SelectItem value="weekly">Báo cáo tuần</SelectItem>
                                            <SelectItem value="monthly">Báo cáo tháng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phòng ban</Label>
                                    <Select defaultValue="all">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn phòng ban" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled>
                                    Tạo báo cáo (đang phát triển)
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <ManualAttendanceDialog
                open={manualDialogOpen}
                onOpenChange={setManualDialogOpen}
                employees={employees}
                form={manualForm}
                onChange={setManualForm}
                onSubmit={handleManualSubmit}
                loading={loading}
            />

            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{editingSchedule ? "Cập nhật lịch làm việc" : "Tạo lịch làm việc"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Nhân viên *</Label>
                                <Select
                                    value={scheduleForm.employeeId ? scheduleForm.employeeId.toString() : ""}
                                    onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, employeeId: Number(value) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn nhân viên" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Ca làm *</Label>
                                <Select
                                    value={scheduleForm.workShiftId ? scheduleForm.workShiftId.toString() : ""}
                                    onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, workShiftId: Number(value) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ca làm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workShifts.map((shift) => (
                                            <SelectItem key={shift.id} value={shift.id.toString()}>
                                                {shift.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Ngày *</Label>
                                <Input
                                    type="date"
                                    value={scheduleForm.scheduleDate ?? ""}
                                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Trạng thái</Label>
                                <Select
                                    value={scheduleForm.status ?? "SCHEDULED"}
                                    onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, status: value as WorkScheduleStatus }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WORK_SCHEDULE_STATUS.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Ghi chú</Label>
                            <Textarea
                                value={scheduleForm.notes ?? ""}
                                onChange={(e) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleSaveSchedule} disabled={loading}>
                                {loading ? "Đang lưu..." : editingSchedule ? "Cập nhật" : "Tạo lịch"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
