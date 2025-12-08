"use client"

import { AttendanceRecord, AttendanceStatus } from "../../lib/api/attendance"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"

interface AttendanceCellProps {
    record: AttendanceRecord | null
    onClick?: () => void
    className?: string
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700",
    [AttendanceStatus.LATE]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700",
    [AttendanceStatus.ABSENT]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700",
    [AttendanceStatus.HALF_DAY]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
    [AttendanceStatus.EARLY_DEPARTURE]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
    [AttendanceStatus.OVERTIME]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700",
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "Có mặt",
    [AttendanceStatus.LATE]: "Muộn",
    [AttendanceStatus.ABSENT]: "Vắng",
    [AttendanceStatus.HALF_DAY]: "Nửa ngày",
    [AttendanceStatus.EARLY_DEPARTURE]: "Về sớm",
    [AttendanceStatus.OVERTIME]: "Tăng ca",
}

export function AttendanceCell({ record, onClick, className }: AttendanceCellProps) {
    if (!record) {
        return (
            <div
                className={cn(
                    "h-16 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                    className
                )}
                onClick={onClick}
            >
                <span className="text-xs text-muted-foreground">-</span>
            </div>
        )
    }

    const statusColor = STATUS_COLORS[record.status] || STATUS_COLORS[AttendanceStatus.ABSENT]
    const statusLabel = STATUS_LABELS[record.status] || "Không xác định"

    return (
        <div
            className={cn(
                "h-16 flex flex-col items-center justify-center border rounded-md cursor-pointer hover:opacity-80 transition-opacity p-1",
                statusColor,
                className
            )}
            onClick={onClick}
            title={`${statusLabel} - ${record.checkInTime || "Chưa check-in"} / ${record.checkOutTime || "Chưa check-out"}`}
        >
            <Badge variant="outline" className={cn("text-xs border-current", statusColor)}>
                {statusLabel}
            </Badge>
            {record.checkInTime && (
                <span className="text-[10px] mt-0.5 opacity-75">
                    {record.checkInTime.substring(0, 5)}
                </span>
            )}
        </div>
    )
}

