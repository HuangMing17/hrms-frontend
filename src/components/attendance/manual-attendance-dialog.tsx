"use client"

import { Employee } from "../../lib/api/employee"
import { AttendanceStatus, ManualAttendanceRequest } from "../../lib/api/attendance"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"

interface ManualAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  form: ManualAttendanceRequest
  onChange: (next: ManualAttendanceRequest) => void
  onSubmit: () => void
  loading: boolean
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: "Có mặt",
  [AttendanceStatus.LATE]: "Muộn",
  [AttendanceStatus.ABSENT]: "Vắng mặt",
  [AttendanceStatus.HALF_DAY]: "Nửa ngày",
  [AttendanceStatus.EARLY_DEPARTURE]: "Về sớm",
  [AttendanceStatus.OVERTIME]: "Tăng ca",
}

export function ManualAttendanceDialog({
  open,
  onOpenChange,
  employees,
  form,
  onChange,
  onSubmit,
  loading,
}: ManualAttendanceDialogProps) {
  const handleFieldChange = <K extends keyof ManualAttendanceRequest>(key: K, value: ManualAttendanceRequest[K]) => {
    onChange({ ...form, [key]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tạo bản ghi chấm công</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nhân viên *</Label>
              <Select
                value={form.employeeId ? form.employeeId.toString() : ""}
                onValueChange={(value) => handleFieldChange("employeeId", Number(value))}
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
              <Label>Ngày *</Label>
              <Input
                type="date"
                value={form.attendanceDate}
                onChange={(e) => handleFieldChange("attendanceDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Giờ vào</Label>
              <Input
                type="time"
                value={form.checkInTime ?? ""}
                onChange={(e) => handleFieldChange("checkInTime", e.target.value || undefined)}
              />
            </div>
            <div>
              <Label>Giờ ra</Label>
              <Input
                type="time"
                value={form.checkOutTime ?? ""}
                onChange={(e) => handleFieldChange("checkOutTime", e.target.value || undefined)}
              />
            </div>
          </div>
          <div>
            <Label>Trạng thái *</Label>
            <Select value={form.status} onValueChange={(value) => handleFieldChange("status", value as AttendanceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AttendanceStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => handleFieldChange("notes", e.target.value || undefined)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={onSubmit} disabled={loading || !form.employeeId}>
              {loading ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

