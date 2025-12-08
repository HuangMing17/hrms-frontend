"use client"

import { useEffect, useMemo, useState } from "react"
import { AttendanceRecord, AttendanceStatus, attendanceAPI } from "../../lib/api/attendance"
import { Employee } from "../../lib/api/employee"
import { Department } from "../../lib/api/department"
import { AttendanceCell } from "./AttendanceCell"
import { AttendanceDetailDialog } from "./AttendanceDetailDialog"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card } from "../ui/card"
import { LoadingPage } from "../ui/loading"
import { Search } from "lucide-react"

interface WeeklyAttendanceGridProps {
    startDate: Date
    endDate: Date
    employees: Employee[]
    departments: Department[]
    selectedDepartmentId: string
    onDepartmentChange: (departmentId: string) => void
}

export function WeeklyAttendanceGrid({
    startDate,
    endDate,
    employees,
    departments,
    selectedDepartmentId,
    onDepartmentChange,
}: WeeklyAttendanceGridProps) {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("")
    const [selectedDate, setSelectedDate] = useState<string>("")

    // Tính toán các ngày trong tuần
    const daysOfWeek = useMemo(() => {
        const days: Date[] = []
        const start = new Date(startDate)
        for (let i = 0; i < 7; i++) {
            const day = new Date(start)
            day.setDate(start.getDate() + i)
            days.push(day)
        }
        return days
    }, [startDate])

    // Format date để query API
    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    // Lọc nhân viên theo phòng ban và search
    const filteredEmployees = useMemo(() => {
        let filtered = employees

        // Lọc theo phòng ban
        if (selectedDepartmentId !== "all") {
            filtered = filtered.filter((emp) => emp.departmentId === Number(selectedDepartmentId))
        }

        // Lọc theo search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (emp) =>
                    emp.fullName.toLowerCase().includes(query) ||
                    emp.employeeCode?.toLowerCase().includes(query) ||
                    emp.email?.toLowerCase().includes(query)
            )
        }

        return filtered
    }, [employees, selectedDepartmentId, searchQuery])

    // Load attendance data
    useEffect(() => {
        const loadAttendance = async () => {
            setLoading(true)
            setError(null)
            try {
                const startDateStr = formatDateForAPI(startDate)
                const endDateStr = formatDateForAPI(endDate)

                const params = {
                    startDate: startDateStr,
                    endDate: endDateStr,
                    departmentId: selectedDepartmentId !== "all" ? Number(selectedDepartmentId) : undefined,
                    page: 0,
                    size: 1000, // Lấy tất cả records trong tuần
                }

                const { content } = await attendanceAPI.getAttendanceReport(params)
                setAttendanceRecords(content)
            } catch (err: any) {
                console.error("Error loading attendance:", err)
                setError(err?.response?.data?.message || err.message || "Không thể tải dữ liệu chấm công")
            } finally {
                setLoading(false)
            }
        }

        loadAttendance()
    }, [startDate, endDate, selectedDepartmentId])

    // Tìm record cho nhân viên và ngày cụ thể
    const getRecordForEmployeeAndDate = (employeeId: number, date: Date): AttendanceRecord | null => {
        const dateStr = formatDateForAPI(date)
        return (
            attendanceRecords.find(
                (record) => record.employeeId === employeeId && record.attendanceDate === dateStr
            ) || null
        )
    }

    // Format ngày hiển thị
    const formatDayHeader = (date: Date): string => {
        const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
        const day = dayNames[date.getDay()]
        const dayNum = date.getDate()
        return `${day}\n${dayNum}`
    }

    const handleCellClick = (employee: Employee, date: Date) => {
        const record = getRecordForEmployeeAndDate(employee.id, date)
        if (record) {
            setSelectedRecord(record)
            setSelectedEmployeeName("")
            setSelectedDate("")
        } else {
            setSelectedRecord(null)
            setSelectedEmployeeName(employee.fullName)
            setSelectedDate(formatDateForAPI(date))
        }
        setDialogOpen(true)
    }

    if (loading && attendanceRecords.length === 0) {
        return <LoadingPage message="Đang tải dữ liệu chấm công..." />
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Tìm kiếm nhân viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedDepartmentId} onValueChange={onDepartmentChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Chọn phòng ban" />
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

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
                    {error}
                </div>
            )}

            {/* Grid */}
            <div className="border border-gradient rounded-lg overflow-hidden shadow-vibrant">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                                    <th className="sticky left-0 z-10 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-gradient p-3 text-left font-semibold min-w-[200px]">
                                        Nhân viên
                                    </th>
                                    {daysOfWeek.map((date, idx) => (
                                        <th
                                            key={idx}
                                            className="border border-gradient p-3 text-center font-semibold min-w-[120px]"
                                        >
                                            <div className="whitespace-pre-line text-sm">
                                                {formatDayHeader(date)}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="border border-gradient p-8 text-center text-muted-foreground"
                                        >
                                            {searchQuery ? "Không tìm thấy nhân viên" : "Không có nhân viên"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 border border-gradient p-3 font-medium">
                                                <div>
                                                    <div className="font-semibold">{employee.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {employee.employeeCode || employee.email}
                                                    </div>
                                                    {employee.departmentName && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {employee.departmentName}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {daysOfWeek.map((date, idx) => {
                                                const record = getRecordForEmployeeAndDate(employee.id, date)
                                                return (
                                                    <td
                                                        key={idx}
                                                        className="border border-gradient p-1"
                                                        onClick={() => handleCellClick(employee, date)}
                                                    >
                                                        <AttendanceCell record={record} />
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AttendanceDetailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                record={selectedRecord}
                employeeName={selectedEmployeeName}
                date={selectedDate}
            />
        </div>
    )
}

