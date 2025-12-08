"use client"

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "../ui/button"
import { WeekRange } from "../../hooks/useWeekNavigation"

interface WeekSelectorProps {
    currentWeek: WeekRange
    onPrevious: () => void
    onNext: () => void
    onToday: () => void
    formatWeekRange: (week: WeekRange) => string
}

export function WeekSelector({ currentWeek, onPrevious, onNext, onToday, formatWeekRange }: WeekSelectorProps) {

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrevious}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-gradient">
                <Calendar className="h-4 w-4 text-gradient" />
                <span className="font-medium text-sm">{formatWeekRange(currentWeek)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onNext}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday}>
                Hôm nay
            </Button>
        </div>
    )
}

