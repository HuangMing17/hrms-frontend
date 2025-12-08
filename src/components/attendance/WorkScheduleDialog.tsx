"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { WorkScheduleResponse, WorkScheduleStatus, WorkShiftResponse } from "../../lib/api/attendance"
import { Employee } from "../../lib/api/employee"

interface WorkScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    schedule?: WorkScheduleResponse | null
    employees: Employee[]
    workShifts: WorkShiftResponse[]
    defaultDate?: Date
    defaultEmployeeId?: number
    onSave: (scheduleData: any) => Promise<void>
    onDelete?: () => Promise<void>
    loading?: boolean
}

const WORK_SCHEDULE_STATUS: WorkScheduleStatus[] = ["SCHEDULED", "COMPLETED", "ABSENT", "CANCELLED"]

const STATUS_LABELS: Record<WorkScheduleStatus, string> = {
    SCHEDULED: "Đã lên lịch",
    COMPLETED: "Hoàn thành",
    ABSENT: "Vắng mặt",
    CANCELLED: "Hủy",
}

export function WorkScheduleDialog({
    open,
    onOpenChange,
    schedule,
    employees,
    workShifts,
    defaultDate,
    defaultEmployeeId,
    onSave,
    onDelete,
    loading = false,
}: WorkScheduleDialogProps) {
    const [formData, setFormData] = useState({
        employeeId: schedule?.employeeId || defaultEmployeeId || undefined,
        workShiftId: schedule?.workShiftId || undefined,
        scheduleDate: schedule?.scheduleDate || (defaultDate ? format(defaultDate, "yyyy-MM-dd") : ""),
        status: (schedule?.status || "SCHEDULED") as WorkScheduleStatus,
        notes: schedule?.notes || "",
    })

    useEffect(() => {
        if (schedule) {
            setFormData({
                employeeId: schedule.employeeId,
                workShiftId: schedule.workShiftId,
                scheduleDate: schedule.scheduleDate,
                status: schedule.status,
                notes: schedule.notes || "",
            })
        } else if (defaultDate || defaultEmployeeId) {
            setFormData(prev => ({
                ...prev,
                employeeId: defaultEmployeeId || prev.employeeId,
                scheduleDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : prev.scheduleDate,
            }))
        }
    }, [schedule, defaultDate, defaultEmployeeId])

    const handleSave = async () => {
        if (!formData.employeeId || !formData.workShiftId || !formData.scheduleDate) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc")
            return
        }

        // Validate date is not in the past
        // Parse date string (YYYY-MM-DD) correctly - avoid timezone issues
        const dateParts = formData.scheduleDate.split('-')
        if (dateParts.length !== 3) {
            alert("Định dạng ngày không hợp lệ")
            return
        }
        const year = parseInt(dateParts[0], 10)
        const month = parseInt(dateParts[1], 10) - 1 // month is 0-indexed
        const day = parseInt(dateParts[2], 10)
        const selectedDate = new Date(year, month, day)
        selectedDate.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Compare dates - allow today and future dates
        // Only validate if date is clearly in the past (more than 1 day ago to account for timezone)
        const diffTime = selectedDate.getTime() - today.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
            alert("Ngày lịch làm việc phải là hôm nay hoặc trong tương lai")
            return
        }

        try {
            await onSave({
                employeeId: formData.employeeId,
                workShiftId: formData.workShiftId,
                scheduleDate: formData.scheduleDate,
                status: formData.status,
                notes: formData.notes || undefined, // Send undefined instead of empty string
            })
        } catch (error) {
            // Error is already handled by parent component
            console.error("Error saving schedule:", error)
        }
    }

    const handleDelete = async () => {
        if (confirm("Bạn có chắc chắn muốn xóa lịch làm việc này?")) {
            await onDelete?.()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{schedule ? "Cập nhật lịch làm việc" : "Tạo lịch làm việc"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Nhân viên *</Label>
                            <Select
                                value={formData.employeeId?.toString() || ""}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: Number(value) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhân viên" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.fullName} ({emp.employeeCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Ca làm việc *</Label>
                            <Select
                                value={formData.workShiftId?.toString() || ""}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, workShiftId: Number(value) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn ca làm việc" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workShifts.map((shift) => (
                                        <SelectItem key={shift.id} value={shift.id.toString()}>
                                            {shift.name} ({shift.startTime} - {shift.endTime})
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
                                value={formData.scheduleDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Trạng thái</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as WorkScheduleStatus }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WORK_SCHEDULE_STATUS.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {STATUS_LABELS[status]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Ghi chú</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            placeholder="Nhập ghi chú (tùy chọn)"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        {schedule && onDelete && (
                            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                Xóa
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? "Đang lưu..." : schedule ? "Cập nhật" : "Tạo lịch"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

