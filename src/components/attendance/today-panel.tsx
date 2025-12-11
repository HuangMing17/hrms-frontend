"use client"

import { AttendanceRecord, AttendanceStatus, Department } from "../../lib/api/attendance"
import { Employee } from "../../lib/api/employee"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { LogIn, LogOut, RefreshCw } from "lucide-react"

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: "Có mặt",
  [AttendanceStatus.LATE]: "Muộn",
  [AttendanceStatus.ABSENT]: "Vắng mặt",
  [AttendanceStatus.HALF_DAY]: "Nửa ngày",
  [AttendanceStatus.EARLY_DEPARTURE]: "Về sớm",
  [AttendanceStatus.OVERTIME]: "Tăng ca",
}

interface TodayPanelProps {
  departments: Department[]
  selectedDepartment: string
  onDepartmentChange: (value: string) => void
  summary: { present: number; late: number; absent: number }
  records: AttendanceRecord[]
  onRefresh: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  currentEmployee: Employee | null
  loading: boolean
}

export function TodayPanel({
  departments,
  selectedDepartment,
  onDepartmentChange,
  summary,
  records,
  onRefresh,
  onCheckIn,
  onCheckOut,
  currentEmployee,
  loading,
}: TodayPanelProps) {
  const renderStatus = (status: AttendanceStatus) => {
    const color =
      status === AttendanceStatus.PRESENT
        ? "bg-green-100 text-green-800"
        : status === AttendanceStatus.ABSENT
          ? "bg-red-100 text-red-800"
          : status === AttendanceStatus.LATE
            ? "bg-yellow-100 text-yellow-800"
            : "bg-purple-100 text-purple-800"
    return <Badge className={color}>{STATUS_LABELS[status]}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-56">
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
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
        {currentEmployee && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCheckIn} disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              Check-in
            </Button>
            <Button variant="outline" onClick={onCheckOut} disabled={loading}>
              <LogOut className="mr-2 h-4 w-4" />
              Check-out
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <CardHeader>
            <CardTitle>Có mặt</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.present}</CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle>Đi muộn</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.late}</CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <CardHeader>
            <CardTitle>Vắng mặt</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.absent}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chấm công</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && records.length === 0 ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, skeletonIdx) => (
                  <TableRow
                    key={`skeleton-${skeletonIdx}`}
                    className="animate-pulse"
                    style={{
                      animationDelay: `${skeletonIdx * 100}ms`,
                    }}
                  >
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Chưa có bản ghi
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => (
                  <TableRow
                    key={record.id}
                    className="animate-fade-in-up hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    style={{
                      animationDelay: `${index * 40}ms`,
                    }}
                  >
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell>{record.attendanceDate}</TableCell>
                    <TableCell>{record.checkInTime ?? "-"}</TableCell>
                    <TableCell>{record.checkOutTime ?? "-"}</TableCell>
                    <TableCell>{renderStatus(record.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

