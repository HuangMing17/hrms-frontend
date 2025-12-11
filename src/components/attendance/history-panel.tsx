"use client"

import { AttendanceRecord } from "../../lib/api/attendance"
import { Employee } from "../../lib/api/employee"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"

interface HistoryPanelProps {
    records: AttendanceRecord[]
    startDate: string
    endDate: string
    onStartDateChange: (value: string) => void
    onEndDateChange: (value: string) => void
    employees: Employee[]
    selectedEmployeeId: number | "all"
    onEmployeeChange: (value: number | "all") => void
    onSearch: () => void
}

export function HistoryPanel({
    records,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    employees,
    selectedEmployeeId,
    onEmployeeChange,
    onSearch,
}: HistoryPanelProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <div>
                    <Label>Từ ngày</Label>
                    <Input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
                </div>
                <div>
                    <Label>Đến ngày</Label>
                    <Input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
                </div>
                <div>
                    <Label>Nhân viên</Label>
                    <Select
                        value={selectedEmployeeId === "all" ? "all" : selectedEmployeeId.toString()}
                        onValueChange={(value) => onEmployeeChange(value === "all" ? "all" : Number(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn nhân viên" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.fullName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                    <Button className="w-full" onClick={onSearch}>
                        Tra cứu
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử chấm công</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ngày</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ghi chú</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        Không có dữ liệu
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
                                        <TableCell>{record.attendanceDate}</TableCell>
                                        <TableCell>{record.checkInTime ?? "-"}</TableCell>
                                        <TableCell>{record.checkOutTime ?? "-"}</TableCell>
                                        <TableCell>{record.status}</TableCell>
                                        <TableCell>{record.notes ?? "-"}</TableCell>
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

