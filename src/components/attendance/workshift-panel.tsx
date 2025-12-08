"use client"

import { WorkShiftResponse } from "../../lib/api/attendance"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"

interface WorkShiftPanelProps {
  shifts: WorkShiftResponse[]
}

export function WorkShiftPanel({ shifts }: WorkShiftPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách ca làm việc</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên ca</TableHead>
              <TableHead>Giờ bắt đầu</TableHead>
              <TableHead>Giờ kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell className="font-medium">{shift.name}</TableCell>
                <TableCell>{shift.startTime}</TableCell>
                <TableCell>{shift.endTime}</TableCell>
                <TableCell>
                  <Badge variant={shift.active ? "default" : "secondary"}>
                    {shift.active ? "Đang sử dụng" : "Tạm ngưng"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Không có ca làm việc nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

