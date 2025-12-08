"use client"

import { AttendanceSummaryResponse } from "../../lib/api/attendance"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Calendar as CalendarIcon } from "lucide-react"

interface SummaryPanelProps {
  summary: AttendanceSummaryResponse | null
  month: number
  year: number
  onMonthChange: (value: number) => void
  onYearChange: (value: number) => void
  onRefresh: () => void
}

export function SummaryPanel({ summary, month, year, onMonthChange, onYearChange, onRefresh }: SummaryPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Tháng</Label>
          <Input type="number" min={1} max={12} value={month} onChange={(e) => onMonthChange(Number(e.target.value))} />
        </div>
        <div>
          <Label>Năm</Label>
          <Input type="number" min={2020} value={year} onChange={(e) => onYearChange(Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={onRefresh}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Xem thống kê
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Số ngày làm việc</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{summary.presentDays}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đi muộn</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{summary.lateDays}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vắng mặt</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{summary.absentDays}</CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">Chưa có dữ liệu</p>
      )}
    </div>
  )
}

