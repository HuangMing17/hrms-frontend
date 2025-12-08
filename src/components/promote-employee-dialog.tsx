"use client"

import { useEffect, useMemo, useState } from "react"
import { Employee, PromoteEmployeeRequest, PromoteEmployeeResponse, employeeAPI } from "../lib/api/employee"
import { Department } from "../lib/api/department"
import { Position } from "../lib/api/position"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Switch } from "./ui/switch"
import { Button } from "./ui/button"
import { Alert, AlertDescription } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"

const ROLE_OPTIONS = [
    { value: "MANAGER", label: "Manager" },
    { value: "HR", label: "HR" },
    { value: "ADMIN", label: "Admin" }
]

interface PromoteEmployeeDialogProps {
    employee: Employee | null
    open: boolean
    onOpenChange: (open: boolean) => void
    departments: Department[]
    positions: Position[]
    employees: Employee[]
    onSuccess: (response: PromoteEmployeeResponse) => void
}

export function PromoteEmployeeDialog({
    employee,
    open,
    onOpenChange,
    departments,
    positions,
    employees,
    onSuccess
}: PromoteEmployeeDialogProps) {
    const [formState, setFormState] = useState({
        newPositionId: "",
        newDepartmentId: "",
        newManagerId: "",
        provisionSystemAccount: true,
        roles: ["MANAGER"] as string[]
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<PromoteEmployeeResponse | null>(null)

    useEffect(() => {
        if (employee && open) {
            setFormState({
                newPositionId: employee.positionId ? String(employee.positionId) : "",
                newDepartmentId: employee.departmentId ? String(employee.departmentId) : "",
                newManagerId: employee.managerId ? String(employee.managerId) : "",
                provisionSystemAccount: true,
                roles: ["MANAGER"]
            })
            setResult(null)
            setError(null)
        }
    }, [employee, open])

    const managerOptions = useMemo(() => {
        return employees
            .filter(e => e.id !== employee?.id)
            .map(e => ({
                value: e.id.toString(),
                label: `${e.fullName} (${e.employeeCode})`
            }))
    }, [employees, employee])

    const toggleRole = (role: string) => {
        setFormState(prev => {
            const exists = prev.roles.includes(role)
            if (exists) {
                return { ...prev, roles: prev.roles.filter(r => r !== role) }
            }
            return { ...prev, roles: [...prev.roles, role] }
        })
    }

    const handleSubmit = async () => {
        if (!employee) return
        if (!formState.newPositionId) {
            setError("Vui lòng chọn chức vụ mới")
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            // Validate và chuẩn bị payload
            const newPositionIdNum = Number(formState.newPositionId)
            if (isNaN(newPositionIdNum) || newPositionIdNum <= 0) {
                setError("Vui lòng chọn chức vụ mới hợp lệ")
                setSubmitting(false)
                return
            }

            // Xử lý newDepartmentId
            let newDepartmentId: number | undefined = undefined
            if (formState.newDepartmentId && formState.newDepartmentId !== "__none__" && formState.newDepartmentId !== "") {
                const deptIdNum = Number(formState.newDepartmentId)
                if (!isNaN(deptIdNum) && deptIdNum > 0) {
                    newDepartmentId = deptIdNum
                }
            }

            // Xử lý newManagerId
            let newManagerId: number | undefined = undefined
            if (formState.newManagerId && formState.newManagerId !== "__none__" && formState.newManagerId !== "") {
                const managerIdNum = Number(formState.newManagerId)
                if (!isNaN(managerIdNum) && managerIdNum > 0) {
                    newManagerId = managerIdNum
                }
            }

            const payload: PromoteEmployeeRequest = {
                newPositionId: newPositionIdNum,
                newDepartmentId: newDepartmentId,
                newManagerId: newManagerId,
                provisionSystemAccount: formState.provisionSystemAccount ?? true,
                roles: formState.provisionSystemAccount && formState.roles.length > 0
                    ? formState.roles
                    : undefined
            }

            console.log("Promote payload:", payload) // Debug log

            const response = await employeeAPI.promoteEmployee(employee.id, payload)
            setResult(response)
            onSuccess(response)
        } catch (err: unknown) {
            let message = "Không thể thăng chức nhân viên"
            if (typeof err === "object" && err !== null) {
                const maybeAxiosError = err as {
                    response?: {
                        data?: {
                            message?: string
                            error?: {
                                message?: string
                                details?: string
                            }
                        }
                    },
                    message?: string
                }
                // Lấy message từ nhiều nguồn có thể
                message = maybeAxiosError.response?.data?.message
                    || maybeAxiosError.response?.data?.error?.message
                    || maybeAxiosError.response?.data?.error?.details
                    || maybeAxiosError.message
                    || message
            }
            setError(message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = (value: boolean) => {
        if (!value) {
            setResult(null)
            setError(null)
        }
        onOpenChange(value)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thăng chức & Cấp quyền truy cập</DialogTitle>
                </DialogHeader>
                {!employee ? (
                    <p className="text-sm text-muted-foreground">Chọn một nhân viên để bắt đầu</p>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-md border p-3 bg-muted/30 text-sm">
                            <div className="font-semibold">{employee.fullName}</div>
                            <div className="text-muted-foreground text-xs mt-1">
                                Mã NV: {employee.employeeCode} · Phòng ban hiện tại: {employee.departmentName || "—"}
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Chức vụ mới *</Label>
                                    <Select
                                        value={formState.newPositionId}
                                        onValueChange={(value) => setFormState(prev => ({ ...prev, newPositionId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn chức vụ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positions.map(position => (
                                                <SelectItem key={position.id} value={position.id.toString()}>
                                                    {position.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Phòng ban mới</Label>
                                    <Select
                                        value={formState.newDepartmentId || "__none__"}
                                        onValueChange={(value) => setFormState(prev => ({ ...prev, newDepartmentId: value === "__none__" ? "" : value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Giữ nguyên phòng ban" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">-- Giữ nguyên --</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Quản lý trực tiếp</Label>
                                <Select
                                    value={formState.newManagerId || "__none__"}
                                    onValueChange={(value) => setFormState(prev => ({ ...prev, newManagerId: value === "__none__" ? "" : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Không thay đổi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">-- Không gán --</SelectItem>
                                        {managerOptions.map(manager => (
                                            <SelectItem key={manager.value} value={manager.value}>
                                                {manager.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Tạo tài khoản truy cập hệ thống</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Nếu tắt, hệ thống chỉ cập nhật chức vụ/ phòng ban mà không cấp tài khoản
                                    </p>
                                </div>
                                <Switch
                                    checked={formState.provisionSystemAccount}
                                    onCheckedChange={(checked) => setFormState(prev => ({ ...prev, provisionSystemAccount: checked }))}
                                />
                            </div>

                            {formState.provisionSystemAccount && (
                                <div>
                                    <Label className="text-sm font-medium">Quyền truy cập</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                        {ROLE_OPTIONS.map(role => (
                                            <label
                                                key={role.value}
                                                className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={formState.roles.includes(role.value)}
                                                    onCheckedChange={() => toggleRole(role.value)}
                                                />
                                                {role.label}
                                            </label>
                                        ))}
                                    </div>
                                    {formState.roles.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Vui lòng chọn ít nhất một quyền khi tạo tài khoản
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {result && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-green-800">
                                        {result.accountCreated ? "Đã tạo tài khoản đăng nhập" : "Đã cập nhật chức vụ"}
                                    </div>
                                    {result.accountCreated && result.assignedRoles && (
                                        <div className="flex flex-wrap gap-1">
                                            {result.assignedRoles.map(role => (
                                                <Badge key={role} variant="outline" className="border-green-600 text-green-700">
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {result.username && (
                                    <p className="text-sm text-green-800">
                                        Username: <span className="font-semibold">{result.username}</span>
                                    </p>
                                )}
                                {result.passwordResetLink && (
                                    <p className="text-sm">
                                        Reset link:{" "}
                                        <a
                                            href={result.passwordResetLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-green-700 underline break-all"
                                        >
                                            {result.passwordResetLink}
                                        </a>
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Vui lòng gửi thông tin trên cho nhân sự để họ đăng nhập lần đầu.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => handleClose(false)}>
                                Đóng
                            </Button>
                            <Button onClick={handleSubmit} disabled={submitting || (formState.provisionSystemAccount && formState.roles.length === 0)}>
                                {submitting ? "Đang xử lý..." : "Xác nhận thăng chức"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}


