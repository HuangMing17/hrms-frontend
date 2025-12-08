import { useState, useMemo } from "react"

export interface WeekRange {
    startDate: Date
    endDate: Date
    weekNumber: number
    year: number
}

/**
 * Hook để quản lý navigation giữa các tuần
 */
export function useWeekNavigation(initialDate?: Date) {
    const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date())

    const currentWeek = useMemo<WeekRange>(() => {
        const date = new Date(currentDate)
        // Lấy thứ 2 của tuần (Monday = 1)
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        const monday = new Date(date.setDate(diff))
        monday.setHours(0, 0, 0, 0)

        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        sunday.setHours(23, 59, 59, 999)

        // Tính số tuần trong năm
        const startOfYear = new Date(monday.getFullYear(), 0, 1)
        const pastDaysOfYear = (monday.getTime() - startOfYear.getTime()) / 86400000
        const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)

        return {
            startDate: monday,
            endDate: sunday,
            weekNumber,
            year: monday.getFullYear(),
        }
    }, [currentDate])

    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeek.startDate)
        newDate.setDate(newDate.getDate() - 7)
        setCurrentDate(newDate)
    }

    const goToNextWeek = () => {
        const newDate = new Date(currentWeek.startDate)
        newDate.setDate(newDate.getDate() + 7)
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const goToWeek = (date: Date) => {
        setCurrentDate(new Date(date))
    }

    const formatWeekRange = (week: WeekRange): string => {
        const formatDate = (d: Date) => {
            const day = String(d.getDate()).padStart(2, "0")
            const month = String(d.getMonth() + 1).padStart(2, "0")
            return `${day}/${month}`
        }
        return `Tuần ${week.weekNumber} (${formatDate(week.startDate)} - ${formatDate(week.endDate)})`
    }

    const getDaysOfWeek = (): Date[] => {
        const days: Date[] = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeek.startDate)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
        return days
    }

    return {
        currentWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToToday,
        goToWeek,
        formatWeekRange,
        getDaysOfWeek,
    }
}

