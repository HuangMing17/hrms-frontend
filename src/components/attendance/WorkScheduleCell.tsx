"use client"

import { format, isSameDay, isToday } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "../ui/utils"
import { WorkScheduleResponse, WorkScheduleStatus } from "../../lib/api/attendance"

interface WorkScheduleCellProps {
    date: Date
    schedules: WorkScheduleResponse[]
    isCurrentMonth: boolean
    onClick?: () => void
}

const STATUS_COLORS: Record<WorkScheduleStatus, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300",
    ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300",
}

export function WorkScheduleCell({ date, schedules, isCurrentMonth, onClick }: WorkScheduleCellProps) {
    const isCurrentDay = isToday(date)
    const hasSchedule = schedules.length > 0

    return (
        <div
            className={cn(
                "min-h-[80px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors",
                !isCurrentMonth && "bg-gray-50 dark:bg-gray-900/30 opacity-50",
                isCurrentDay && "ring-2 ring-purple-500 ring-offset-1"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "text-xs font-medium mb-1",
                isCurrentDay && "text-purple-600 dark:text-purple-400 font-bold"
            )}>
                {format(date, "d")}
            </div>
            <div className="space-y-1">
                {schedules.length > 0 ? (
                    schedules.slice(0, 2).map((schedule) => (
                        <div
                            key={schedule.id}
                            className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded border truncate",
                                STATUS_COLORS[schedule.status]
                            )}
                            title={`${schedule.workShiftName} - ${schedule.employeeName}`}
                        >
                            <div className="font-semibold truncate">{schedule.workShiftName}</div>
                            {schedules.length === 1 && schedule.employeeName && (
                                <div className="text-[9px] opacity-75 truncate">{schedule.employeeName}</div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-[10px] text-muted-foreground opacity-50">Trống</div>
                )}
                {schedules.length > 2 && (
                    <div className="text-[10px] text-muted-foreground font-medium">
                        +{schedules.length - 2} khác
                    </div>
                )}
            </div>
        </div>
    )
}

