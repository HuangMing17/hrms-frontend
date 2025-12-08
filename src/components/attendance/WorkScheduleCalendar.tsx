"use client"

import { useState, useMemo } from "react"
import { format, eachDayOfInterval, isSameDay, addDays, startOfWeek, endOfWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { WorkScheduleResponse, WorkScheduleStatus, WorkShiftResponse } from "../../lib/api/attendance"
import { Employee } from "../../lib/api/employee"
import { Department } from "../../lib/api/department"
import { WorkScheduleCell } from "./WorkScheduleCell"
import { WorkScheduleDialog } from "./WorkScheduleDialog"
import { cn } from "../ui/utils"

interface WorkScheduleCalendarProps {
    schedules: WorkScheduleResponse[]
    employees: Employee[]
    departments: Department[]
    workShifts: WorkShiftResponse[]
    loading?: boolean
    onScheduleClick?: (schedule: WorkScheduleResponse | null, date: Date, employeeId?: number) => void
    onScheduleCreate?: (schedule: Omit<WorkScheduleResponse, "id" | "createdAt" | "updatedAt">) => Promise<void>
    onScheduleUpdate?: (id: number, schedule: Partial<WorkScheduleResponse>) => Promise<void>
    onScheduleDelete?: (id: number) => Promise<void>
}

const STATUS_COLORS: Record<WorkScheduleStatus, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300",
    ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300",
}

const STATUS_LABELS: Record<WorkScheduleStatus, string> = {
    SCHEDULED: "Đã lên lịch",
    COMPLETED: "Hoàn thành",
    ABSENT: "Vắng mặt",
    CANCELLED: "Hủy",
}

export function WorkScheduleCalendar({
    schedules,
    employees,
    departments,
    workShifts,
    loading = false,
    onScheduleClick,
    onScheduleCreate,
    onScheduleUpdate,
    onScheduleDelete,
}: WorkScheduleCalendarProps) {
    // currentDate dùng để xác định tuần hiện tại (không còn dùng theo tháng)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all")
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all")
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedEmployeeForDate, setSelectedEmployeeForDate] = useState<number | undefined>(undefined)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<WorkScheduleResponse | null>(null)

    // Filter employees by department
    const filteredEmployees = useMemo(() => {
        if (selectedDepartmentId === "all") return employees
        return employees.filter(emp => emp.departmentId === Number(selectedDepartmentId))
    }, [employees, selectedDepartmentId])

    // Tính tuần hiện tại dựa trên currentDate (tuần bắt đầu từ Thứ 2, kết thúc Chủ Nhật)
    const currentWeek = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
        const end = endOfWeek(currentDate, { weekStartsOn: 1 }) // Sunday
        return { start, end }
    }, [currentDate])

    // Các ngày trong tuần hiện tại (7 ngày)
    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: currentWeek.start, end: currentWeek.end })
    }, [currentWeek])

    // Get schedules for selected filters
    const filteredSchedules = useMemo(() => {
        let filtered = schedules

        if (selectedDepartmentId !== "all") {
            filtered = filtered.filter(s => s.departmentId === Number(selectedDepartmentId))
        }

        if (selectedEmployeeId !== "all") {
            filtered = filtered.filter(s => s.employeeId === Number(selectedEmployeeId))
        }

        return filtered
    }, [schedules, selectedDepartmentId, selectedEmployeeId])

    // Get schedules for a specific date and employee
    // IMPORTANT: so khớp theo chuỗi yyyy-MM-dd để tránh lệch múi giờ
    const getSchedulesForDate = (date: Date, employeeId?: number) => {
        const targetDateStr = format(date, "yyyy-MM-dd")
        return filteredSchedules.filter(schedule => {
            const isSameDate = schedule.scheduleDate === targetDateStr
            if (employeeId) {
                return isSameDate && schedule.employeeId === employeeId
            }
            return isSameDate
        })
    }

    const handleDateClick = (date: Date, employeeId?: number) => {
        setSelectedDate(date)
        setSelectedEmployeeForDate(employeeId)
        const schedulesForDate = getSchedulesForDate(date, employeeId)

        if (schedulesForDate.length > 0 && employeeId) {
            // If clicking on a specific employee's cell, show their schedule
            setEditingSchedule(schedulesForDate[0])
            setIsDialogOpen(true)
        } else {
            // If clicking on a date without schedule, create new
            setEditingSchedule(null)
            setIsDialogOpen(true)
        }
    }

    // Điều hướng tuần: lùi / tiến 1 tuần hoặc về hôm nay
    const handlePreviousWeek = () => {
        setCurrentDate(prev => addDays(prev, -7))
    }

    const handleNextWeek = () => {
        setCurrentDate(prev => addDays(prev, 7))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const handleSaveSchedule = async (scheduleData: any) => {
        if (editingSchedule) {
            await onScheduleUpdate?.(editingSchedule.id, scheduleData)
        } else {
            await onScheduleCreate?.(scheduleData)
        }
        setIsDialogOpen(false)
        setEditingSchedule(null)
        setSelectedDate(null)
    }

    const handleDeleteSchedule = async (id: number) => {
        await onScheduleDelete?.(id)
        setIsDialogOpen(false)
        setEditingSchedule(null)
    }

    // Display mode: by employee or by date
    const [viewMode, setViewMode] = useState<"employee" | "date">("employee")

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <Card className="shadow-vibrant hover-glow border-gradient">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gradient" />
                            {/* Hiển thị khoảng thời gian của tuần hiện tại */}
                            {`Lịch làm việc tuần (${format(currentWeek.start, "dd/MM", { locale: vi })} - ${format(
                                currentWeek.end,
                                "dd/MM/yyyy",
                                { locale: vi }
                            )})`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleToday}>
                                Hôm nay
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleNextWeek}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Phòng ban" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Nhân viên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                                {filteredEmployees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                        {emp.fullName} ({emp.employeeCode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={viewMode} onValueChange={(value) => setViewMode(value as "employee" | "date")}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="employee">Theo nhân viên</SelectItem>
                                <SelectItem value="date">Theo ngày</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() => {
                                setSelectedDate(new Date())
                                setEditingSchedule(null)
                                setIsDialogOpen(true)
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm lịch
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar View theo TUẦN */}
            {viewMode === "employee" ? (
                // View by Employee (rows = employees, columns = 7 ngày trong tuần)
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <div className="min-w-full">
                                {/* Header: cột nhân viên + 7 cột ngày trong tuần */}
                                <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
                                    <div className="p-3 font-semibold border-r bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                                        Nhân viên
                                    </div>
                                    {calendarDays.map((day, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-3 text-center font-semibold border-r",
                                                "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20"
                                            )}
                                        >
                                            <div className="text-xs text-muted-foreground">
                                                {format(day, "EEE", { locale: vi })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Body: mỗi hàng là 1 nhân viên, 7 cột là các ngày trong tuần */}
                                <div className="divide-y">
                                    {filteredEmployees.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Không có nhân viên nào
                                        </div>
                                    ) : (
                                        filteredEmployees.map((employee) => (
                                            <div key={employee.id} className="grid grid-cols-8 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <div className="p-3 border-r font-medium sticky left-0 bg-background z-5">
                                                    <div className="font-semibold">{employee.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{employee.employeeCode}</div>
                                                </div>
                                                {calendarDays.map((day) => {
                                                    const schedulesForDay = getSchedulesForDate(day, employee.id)
                                                    return (
                                                        <WorkScheduleCell
                                                            key={`${employee.id}-${day.toISOString()}`}
                                                            date={day}
                                                            schedules={schedulesForDay}
                                                            // Tuần nên luôn hiển thị full màu (không cần mờ theo tháng)
                                                            isCurrentMonth={true}
                                                            onClick={() => handleDateClick(day, employee.id)}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                // View by Date (traditional calendar grid)
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 border-b">
                                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                                    <div
                                        key={day}
                                        className="p-3 text-center font-semibold bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-r last:border-r-0"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {calendarDays.map((day) => {
                                    const schedulesForDay = getSchedulesForDate(day)
                                    return (
                                        <WorkScheduleCell
                                            key={day.toISOString()}
                                            date={day}
                                            schedules={schedulesForDay}
                                            isCurrentMonth={isSameMonth(day, currentMonth)}
                                            onClick={() => handleDateClick(day)}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Legend */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium">Chú thích:</span>
                        {Object.entries(STATUS_LABELS).map(([status, label]) => (
                            <Badge
                                key={status}
                                variant="outline"
                                className={cn("border", STATUS_COLORS[status as WorkScheduleStatus])}
                            >
                                {label}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Dialog */}
            <WorkScheduleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                schedule={editingSchedule}
                employees={filteredEmployees}
                workShifts={workShifts}
                defaultDate={selectedDate || undefined}
                defaultEmployeeId={selectedEmployeeForDate}
                onSave={handleSaveSchedule}
                onDelete={editingSchedule ? () => handleDeleteSchedule(editingSchedule.id) : undefined}
                loading={loading}
            />
        </div>
    )
}

