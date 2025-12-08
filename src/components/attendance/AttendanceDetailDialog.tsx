"use client"

import { AttendanceRecord, AttendanceStatus } from "../../lib/api/attendance"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "Có mặt",
    [AttendanceStatus.LATE]: "Muộn",
    [AttendanceStatus.ABSENT]: "Vắng mặt",
    [AttendanceStatus.HALF_DAY]: "Nửa ngày",
    [AttendanceStatus.EARLY_DEPARTURE]: "Về sớm",
    [AttendanceStatus.OVERTIME]: "Tăng ca",
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    [AttendanceStatus.LATE]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    [AttendanceStatus.ABSENT]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    [AttendanceStatus.HALF_DAY]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    [AttendanceStatus.EARLY_DEPARTURE]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    [AttendanceStatus.OVERTIME]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

interface AttendanceDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: AttendanceRecord | null
    employeeName?: string
    date?: string
}

export function AttendanceDetailDialog({
    open,
    onOpenChange,
    record,
    employeeName,
    date,
}: AttendanceDetailDialogProps) {
    if (!record && !employeeName) {
        return null
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-"
        const date = new Date(dateStr)
        return date.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chi tiết chấm công</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nhân viên</p>
                            <p className="text-base font-semibold">{record?.employeeName || employeeName || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mã nhân viên</p>
                            <p className="text-base">{record?.employeeCode || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Ngày</p>
                            <p className="text-base">{formatDate(record?.attendanceDate || date)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                            {record?.status ? (
                                <Badge className={STATUS_COLORS[record.status]}>
                                    {STATUS_LABELS[record.status]}
                                </Badge>
                            ) : (
                                <Badge variant="outline">Chưa chấm công</Badge>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Check-in</p>
                            <p className="text-base">{record?.checkInTime || "Chưa check-in"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Check-out</p>
                            <p className="text-base">{record?.checkOutTime || "Chưa check-out"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Giờ làm việc</p>
                            <p className="text-base">
                                {record?.workHours
                                    ? record.workHours.replace("PT", "").toLowerCase()
                                    : "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Làm thêm giờ</p>
                            <p className="text-base">
                                {record?.overtimeHours && record.overtimeHours !== "PT0S"
                                    ? record.overtimeHours.replace("PT", "").toLowerCase()
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    {record?.departmentName && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phòng ban</p>
                                <p className="text-base">{record.departmentName}</p>
                            </div>
                        </>
                    )}

                    {record?.notes && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
                                <p className="text-base">{record.notes}</p>
                            </div>
                        </>
                    )}

                    {record?.workShiftName && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ca làm việc</p>
                                <p className="text-base">{record.workShiftName}</p>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

