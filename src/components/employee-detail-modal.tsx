"use client"

import { useState, useEffect } from "react"
import { X, User, MapPin, Edit, Trash2, Upload, Power, PowerOff, Building2, UserCog, Target, Calculator, Phone, Mail, Calendar, IdCard, Users, Clock, AlertCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Alert, AlertDescription } from "./ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Separator } from "./ui/separator"
import { employeeAPI, Employee, EmployeeStatus, KPIDataResponse, UpdateKPIRequest, MaritalStatus } from "../lib/api/employee"
import { departmentAPI, Department } from "../lib/api/department"
import { positionAPI, Position } from "../lib/api/position"
import { attendanceAPI } from "../lib/api/attendance"
import { getImageUrl } from "../lib/utils/image"

interface EmployeeDetailModalProps {
    employee: Employee
    isOpen: boolean
    onClose: () => void
    onEdit?: (employee: Employee) => void
    onDelete?: (id: number) => void
    onActivate?: (id: number) => void
    onDeactivate?: (id: number) => void
    onPromote?: (employee: Employee) => void
    onEmployeeUpdated?: (updatedEmployee: Employee) => void
}

const clampValue = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

const normalizeKPIFormValues = (data?: Partial<UpdateKPIRequest>): UpdateKPIRequest => ({
    salesTarget: Math.max(0, data?.salesTarget ?? 0),
    currentSales: Math.max(0, data?.currentSales ?? 0),
    attendanceRate: clampValue(data?.attendanceRate ?? 0, 0, 100),
    customerSatisfactionScore: clampValue(data?.customerSatisfactionScore ?? 0, 0, 5)
})

export function EmployeeDetailModal({
    employee: initialEmployee,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    onPromote,
    onEmployeeUpdated
}: EmployeeDetailModalProps) {
    const [employee, setEmployee] = useState<Employee>(initialEmployee)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [department, setDepartment] = useState<Department | null>(null)
    const [position, setPosition] = useState<Position | null>(null)
    const [manager, setManager] = useState<Employee | null>(null)
    const [workShift, setWorkShift] = useState<any | null>(null)

    // KPI states
    const [kpiData, setKpiData] = useState<KPIDataResponse | null>(null)
    const [isKPIFormOpen, setIsKPIFormOpen] = useState(false)
    const [kpiFormData, setKpiFormData] = useState<UpdateKPIRequest>(normalizeKPIFormValues())

    // Upload states
    const [isUploadAvatarOpen, setIsUploadAvatarOpen] = useState(false)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    // Update employee when prop changes
    useEffect(() => {
        setEmployee(initialEmployee)
    }, [initialEmployee])

    // Load data when modal opens or employee changes
    useEffect(() => {
        if (isOpen && employee) {
            loadAllData()
        }
    }, [isOpen, employee.id])

    const loadAllData = async () => {
        await Promise.all([
            loadDepartment(),
            loadPosition(),
            loadManager(),
            loadWorkShift(),
            loadKPI()
        ])
    }

    const refreshEmployee = async () => {
        try {
            const updated = await employeeAPI.getEmployeeById(employee.id)
            setEmployee(updated)
            if (onEmployeeUpdated) {
                onEmployeeUpdated(updated)
            }
            await loadAllData()
        } catch (err: any) {
            console.error('Error refreshing employee:', err)
        }
    }

    const loadDepartment = async () => {
        if (employee.departmentId) {
            try {
                const dept = await departmentAPI.getDepartmentById(employee.departmentId)
                setDepartment(dept)
            } catch (err: any) {
                console.error('Error loading department:', err)
                // Fallback: Tạo department object từ employee.departmentName nếu API call fail
                if (employee.departmentName) {
                    setDepartment({
                        id: employee.departmentId,
                        name: employee.departmentName,
                        code: '',
                        active: true,
                        createdAt: '',
                        updatedAt: ''
                    })
                }
            }
        } else if (employee.departmentName) {
            // Nếu không có departmentId nhưng có departmentName, tạo object từ departmentName
            setDepartment({
                id: 0,
                name: employee.departmentName,
                code: '',
                active: true,
                createdAt: '',
                updatedAt: ''
            })
        }
    }

    const loadPosition = async () => {
        if (employee.positionId) {
            try {
                const pos = await positionAPI.getPositionById(employee.positionId)
                setPosition(pos)
            } catch (err: any) {
                console.error('Error loading position:', err)
                // Fallback: Tạo position object từ employee.positionTitle nếu API call fail
                if (employee.positionTitle) {
                    setPosition({
                        id: employee.positionId,
                        title: employee.positionTitle,
                        code: employee.positionCode || '',
                        description: '',
                        level: '',
                        baseSalary: 0,
                        departmentId: employee.departmentId || 0,
                        active: true,
                        createdAt: '',
                        updatedAt: ''
                    })
                }
            }
        } else if (employee.positionTitle) {
            // Nếu không có positionId nhưng có positionTitle, tạo object từ positionTitle
            setPosition({
                id: 0,
                title: employee.positionTitle,
                code: employee.positionCode || '',
                description: '',
                level: '',
                baseSalary: 0,
                departmentId: employee.departmentId || 0,
                active: true,
                createdAt: '',
                updatedAt: ''
            })
        }
    }

    const loadManager = async () => {
        if (employee.managerId) {
            try {
                const mgr = await employeeAPI.getEmployeeById(employee.managerId)
                setManager(mgr)
            } catch (err: any) {
                console.error('Error loading manager:', err)
            }
        } else {
            setManager(null)
        }
    }

    const loadWorkShift = async () => {
        if (employee.workShiftId) {
            try {
                const shifts = await attendanceAPI.getWorkShifts()
                const shift = shifts.find(s => s.id === employee.workShiftId)
                if (shift) {
                    setWorkShift(shift)
                }
            } catch (err: any) {
                console.error('Error loading work shift:', err)
            }
        } else {
            setWorkShift(null)
        }
    }

    const handleEdit = () => {
        if (onEdit) {
            onEdit(employee)
        }
    }

    const handleDelete = () => {
        if (onDelete && confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.fullName}"?`)) {
            onDelete(employee.id)
        }
    }

    const handleActivate = async () => {
        if (onActivate) {
            await onActivate(employee.id)
            await refreshEmployee()
        }
    }

    const handleDeactivate = async () => {
        if (onDeactivate && confirm(`Bạn có chắc chắn muốn vô hiệu hóa nhân viên "${employee.fullName}"?`)) {
            await onDeactivate(employee.id)
            await refreshEmployee()
        }
    }

    const handleUploadAvatar = async () => {
        if (!avatarFile) {
            setError("Vui lòng chọn file ảnh")
            return
        }

        setLoading(true)
        setError(null)
        try {
            await employeeAPI.uploadAvatar(employee.id, avatarFile)
            setIsUploadAvatarOpen(false)
            setAvatarFile(null)
            await refreshEmployee()
        } catch (err: any) {
            setError(err.message || "Không thể upload avatar")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAvatar = async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa avatar?")) {
            return
        }

        setLoading(true)
        setError(null)
        try {
            await employeeAPI.deleteAvatar(employee.id)
            await refreshEmployee()
        } catch (err: any) {
            setError(err.message || "Không thể xóa avatar")
        } finally {
            setLoading(false)
        }
    }

    // KPI Functions
    const loadKPI = async () => {
        try {
            const data = await employeeAPI.getKPI(employee.id)
            setKpiData(data)
            setKpiFormData(normalizeKPIFormValues({
                salesTarget: data.salesTarget,
                currentSales: data.currentSales,
                attendanceRate: data.attendanceRate,
                customerSatisfactionScore: data.customerSatisfactionScore
            }))
        } catch (err: any) {
            // KPI có thể chưa được tạo, không hiển thị lỗi
            if (err.response?.status !== 404) {
                console.error('Error loading KPI:', err)
            }
        }
    }

    const handleUpdateKPI = async () => {
        setLoading(true)
        setError(null)
        try {
            const normalizedData = normalizeKPIFormValues(kpiFormData)
            const updated = await employeeAPI.updateKPI(employee.id, normalizedData)
            setKpiData(updated)
            setIsKPIFormOpen(false)
            setKpiFormData(normalizedData)
        } catch (err: any) {
            setError(err.message || "Không thể cập nhật KPI")
        } finally {
            setLoading(false)
        }
    }

    const handleCalculateKPI = async () => {
        setLoading(true)
        setError(null)
        try {
            await employeeAPI.calculateKPI(employee.id)
            await loadKPI() // Reload to get full data
        } catch (err: any) {
            setError(err.message || "Không thể tính lại KPI")
        } finally {
            setLoading(false)
        }
    }

    const getSafeNumber = (value?: number | null) =>
        typeof value === "number" && !Number.isNaN(value) ? value : null

    const formatNumberDisplay = (value?: number | null, digits = 2) =>
        getSafeNumber(value)?.toFixed(digits) ?? "--"

    const formatPercentageDisplay = (value?: number | null, digits = 2) => {
        const safeValue = getSafeNumber(value)
        return safeValue === null ? "--" : `${safeValue.toFixed(digits)}%`
    }

    const hasSystemAccount = Boolean(employee.userId)

    const getKPIColor = (rating?: number | null) => {
        const safeRating = getSafeNumber(rating) ?? 0
        if (safeRating >= 90) return 'text-green-600 dark:text-green-400'
        if (safeRating >= 70) return 'text-yellow-600 dark:text-yellow-400'
        if (safeRating >= 50) return 'text-orange-600 dark:text-orange-400'
        return 'text-red-600 dark:text-red-400'
    }

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getStatusBadge = (status: EmployeeStatus) => {
        const colors = {
            [EmployeeStatus.ACTIVE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            [EmployeeStatus.INACTIVE]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            [EmployeeStatus.TERMINATED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            [EmployeeStatus.ON_LEAVE]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            [EmployeeStatus.PROBATION]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }
        const labels = {
            [EmployeeStatus.ACTIVE]: "Đang làm việc",
            [EmployeeStatus.INACTIVE]: "Tạm dừng",
            [EmployeeStatus.TERMINATED]: "Đã nghỉ việc",
            [EmployeeStatus.ON_LEAVE]: "Nghỉ phép",
            [EmployeeStatus.PROBATION]: "Thử việc"
        }
        return (
            <Badge className={colors[status] || colors[EmployeeStatus.ACTIVE]}>
                {labels[status] || status}
            </Badge>
        )
    }

    const getMaritalStatusLabel = (status?: MaritalStatus) => {
        const labels = {
            [MaritalStatus.SINGLE]: 'Độc thân',
            [MaritalStatus.MARRIED]: 'Đã kết hôn',
            [MaritalStatus.DIVORCED]: 'Ly dị',
            [MaritalStatus.WIDOWED]: 'Góa',
            [MaritalStatus.SEPARATED]: 'Ly thân'
        }
        return status ? labels[status] : '--'
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 border-4 border-white dark:border-gray-700 shadow-lg">
                            <AvatarImage src={getImageUrl(employee.avatarUrl)} alt={employee.fullName} />
                            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                                {employee.firstName[0]}{employee.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold text-gradient">{employee.fullName}</h2>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{employee.employeeCode}</p>
                            <div className="mt-1">{getStatusBadge(employee.status)}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {employee.status === EmployeeStatus.ACTIVE && onDeactivate && (
                            <Button variant="outline" size="sm" onClick={handleDeactivate}>
                                <PowerOff className="h-4 w-4 mr-1" />
                                Vô hiệu hóa
                            </Button>
                        )}
                        {employee.status !== EmployeeStatus.ACTIVE && onActivate && (
                            <Button variant="outline" size="sm" onClick={handleActivate}>
                                <Power className="h-4 w-4 mr-1" />
                                Kích hoạt
                            </Button>
                        )}
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={handleEdit}>
                                <Edit className="h-4 w-4 mr-1" />
                                Chỉnh sửa
                            </Button>
                        )}
                        {onPromote && employee.status !== EmployeeStatus.TERMINATED && (
                            <Button variant="outline" size="sm" onClick={() => onPromote(employee)}>
                                <UserCog className="h-4 w-4 mr-1" />
                                {hasSystemAccount ? "Thăng chức" : "Thăng chức & cấp quyền"}
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Single Unified Card */}
                    <Card className="border-gradient shadow-vibrant">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Left Column - Avatar & Basic Info */}
                                <div className="lg:col-span-1 space-y-4">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col items-center space-y-3">
                                        <Avatar className="h-32 w-32 border-4 border-gradient shadow-lg">
                                            <AvatarImage src={getImageUrl(employee.avatarUrl)} alt={employee.fullName} />
                                            <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                                                {employee.firstName[0]}{employee.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex gap-2">
                                            <Dialog open={isUploadAvatarOpen} onOpenChange={setIsUploadAvatarOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Upload className="h-4 w-4 mr-1" />
                                                        Upload
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Upload Avatar</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="avatar">Chọn ảnh (Max 5MB)</Label>
                                                            <Input
                                                                id="avatar"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end space-x-2">
                                                            <Button variant="outline" onClick={() => setIsUploadAvatarOpen(false)}>
                                                                Hủy
                                                            </Button>
                                                            <Button onClick={handleUploadAvatar} disabled={loading || !avatarFile}>
                                                                {loading ? "Đang upload..." : "Upload"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            {employee.avatarUrl && (
                                                <Button variant="outline" size="sm" onClick={handleDeleteAvatar}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* System Account Status */}
                                    <div className="pt-4 border-t">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Quyền truy cập hệ thống</label>
                                        <div className="flex items-center gap-2">
                                            <Badge className={hasSystemAccount ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}>
                                                {hasSystemAccount ? "Đã có tài khoản" : "Chưa có tài khoản"}
                                            </Badge>
                                            {!hasSystemAccount && onPromote && employee.status !== EmployeeStatus.TERMINATED && (
                                                <Button variant="outline" size="sm" onClick={() => onPromote(employee)}>
                                                    <UserCog className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Columns - All Information */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Personal Information */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Thông tin cá nhân
                                            </h3>
                                            <div className="space-y-2.5 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Email:</span>
                                                        <p className="font-medium truncate">{employee.email}</p>
                                                    </div>
                                                </div>
                                                {employee.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">SĐT:</span>
                                                            <p className="font-medium">{employee.phone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {employee.birthDate && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Ngày sinh:</span>
                                                            <p className="font-medium">{new Date(employee.birthDate).toLocaleDateString('vi-VN')}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {employee.gender && (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Giới tính:</span>
                                                            <p className="font-medium">{employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {employee.maritalStatus && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Tình trạng hôn nhân:</span>
                                                            <p className="font-medium">{getMaritalStatusLabel(employee.maritalStatus)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {employee.nationalId && (
                                                    <div className="flex items-center gap-2">
                                                        <IdCard className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">CMND/CCCD:</span>
                                                            <p className="font-medium">{employee.nationalId}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {employee.address && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Địa chỉ:</span>
                                                            <p className="font-medium text-xs">{employee.address}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Work Information */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Thông tin công việc
                                            </h3>
                                            <div className="space-y-2.5 text-sm">
                                                {(department || employee.departmentName) && (
                                                    <div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Phòng ban:</span>
                                                        <p className="font-medium">{department?.name || employee.departmentName || 'N/A'}</p>
                                                    </div>
                                                )}
                                                {(position || employee.positionTitle) && (
                                                    <div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Chức vụ:</span>
                                                        <p className="font-medium">{position?.title || employee.positionTitle || 'N/A'}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Ngày vào làm:</span>
                                                    <p className="font-medium">{new Date(employee.hireDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                {employee.terminationDate && (
                                                    <div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Ngày nghỉ việc:</span>
                                                        <p className="font-medium text-red-600 dark:text-red-400">{new Date(employee.terminationDate).toLocaleDateString('vi-VN')}</p>
                                                    </div>
                                                )}
                                                {manager && (
                                                    <div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Quản lý trực tiếp:</span>
                                                        <p className="font-medium">{manager.fullName} ({manager.employeeCode})</p>
                                                    </div>
                                                )}
                                                {workShift && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Ca làm việc:</span>
                                                            <p className="font-medium">{workShift.name} ({workShift.startTime} - {workShift.endTime})</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    {(employee.emergencyContact || employee.emergencyPhone) && (
                                        <div className="pt-4 border-t">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                                                <AlertCircle className="h-4 w-4" />
                                                Liên hệ khẩn cấp
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {employee.emergencyContact && (
                                                    <div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Tên người liên hệ:</span>
                                                        <p className="font-medium">{employee.emergencyContact}</p>
                                                    </div>
                                                )}
                                                {employee.emergencyPhone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                                                            <p className="font-medium">{employee.emergencyPhone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Compact KPI */}
                                <div className="lg:col-span-1">
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gradient p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                KPI
                                            </h3>
                                            <div className="flex gap-1">
                                                <Dialog open={isKPIFormOpen} onOpenChange={setIsKPIFormOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-7 px-2">
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Cập nhật KPI</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <Label htmlFor="salesTarget">Mục tiêu doanh số (VND) *</Label>
                                                                <Input
                                                                    id="salesTarget"
                                                                    type="number"
                                                                    value={kpiFormData.salesTarget}
                                                                    onChange={(e) => setKpiFormData({ ...kpiFormData, salesTarget: parseFloat(e.target.value) || 0 })}
                                                                    min="0"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="currentSales">Doanh số hiện tại (VND)</Label>
                                                                <Input
                                                                    id="currentSales"
                                                                    type="number"
                                                                    value={kpiFormData.currentSales}
                                                                    onChange={(e) => setKpiFormData({ ...kpiFormData, currentSales: parseFloat(e.target.value) || 0 })}
                                                                    min="0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="attendanceRate">Tỷ lệ chấm công (%)</Label>
                                                                <Input
                                                                    id="attendanceRate"
                                                                    type="number"
                                                                    value={kpiFormData.attendanceRate}
                                                                    onChange={(e) => setKpiFormData({ ...kpiFormData, attendanceRate: parseFloat(e.target.value) || 0 })}
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="customerSatisfactionScore">Điểm hài lòng khách hàng (1-5)</Label>
                                                                <Input
                                                                    id="customerSatisfactionScore"
                                                                    type="number"
                                                                    value={kpiFormData.customerSatisfactionScore}
                                                                    onChange={(e) => setKpiFormData({ ...kpiFormData, customerSatisfactionScore: parseFloat(e.target.value) || 0 })}
                                                                    min="0"
                                                                    max="5"
                                                                    step="0.1"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end space-x-2">
                                                                <Button variant="outline" onClick={() => setIsKPIFormOpen(false)}>
                                                                    Hủy
                                                                </Button>
                                                                <Button onClick={handleUpdateKPI} disabled={loading}>
                                                                    {loading ? "Đang cập nhật..." : "Cập nhật KPI"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleCalculateKPI} disabled={loading}>
                                                    <Calculator className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {kpiData ? (
                                            <div className="space-y-3">
                                                <div className="text-center">
                                                    <div className={`text-3xl font-bold ${getKPIColor(kpiData.kpiRating)}`}>
                                                        {formatNumberDisplay(kpiData.kpiRating)}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Điểm KPI</p>
                                                </div>
                                                <Separator />
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Doanh số:</span>
                                                        <span className="font-medium">{formatPercentageDisplay(kpiData.salesAchievement)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Chấm công:</span>
                                                        <span className="font-medium">{formatPercentageDisplay(kpiData.attendanceRate)}</span>
                                                    </div>
                                                    {kpiData.customerSatisfactionScore !== undefined && kpiData.customerSatisfactionScore !== null && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Hài lòng KH:</span>
                                                            <span className="font-medium">{formatNumberDisplay(kpiData.customerSatisfactionScore, 2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <Target className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                <p className="text-xs text-gray-500">Chưa có KPI</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
