"use client"

import { useState, useEffect } from "react"
import { X, Users, Building2, Calendar, User, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Alert, AlertDescription } from "./ui/alert"
import { LoadingSpinner } from "./ui/loading"
import { departmentAPI, Department } from "../lib/api/department"
import { employeeAPI, Employee } from "../lib/api/employee"

interface DepartmentDetailModalProps {
    department: Department
    isOpen: boolean
    onClose: () => void
    onEdit?: (department: Department) => void
    onDelete?: (id: number) => void
}

export function DepartmentDetailModal({
    department,
    isOpen,
    onClose,
    onEdit,
    onDelete
}: DepartmentDetailModalProps) {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [employeeCount, setEmployeeCount] = useState(0)

    // Load employees when modal opens
    useEffect(() => {
        if (isOpen && department) {
            loadEmployees()
        }
    }, [isOpen, department])

    const loadEmployees = async () => {
        setLoading(true)
        setError(null)

        try {
            // Sử dụng API getEmployeesByDepartment nếu có, nếu không thì lấy tất cả và lọc
            try {
                const result = await employeeAPI.getEmployeesByDepartment(department.id, 0, 1000)
                setEmployees(result.employees || [])
                setEmployeeCount(result.totalElements || 0)
            } catch (apiErr: any) {
                // Fallback: lấy tất cả nhân viên và lọc theo departmentId
                console.warn('getEmployeesByDepartment failed, using fallback:', apiErr)
                const result = await employeeAPI.getAllEmployees(0, 1000)
                const departmentEmployees = result.employees?.filter(emp => emp.departmentId === department.id) || []
                setEmployees(departmentEmployees)
                setEmployeeCount(departmentEmployees.length)
            }
        } catch (err: any) {
            console.error('Error loading employees:', err)
            setError(err?.response?.data?.message || err.message || "Không thể tải danh sách nhân viên")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = () => {
        if (onEdit) {
            onEdit(department)
        }
    }

    const handleDelete = () => {
        if (onDelete && confirm(`Bạn có chắc chắn muốn xóa phòng ban "${department.name}"?`)) {
            onDelete(department.id)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-gradient">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gradient">{department.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400">Chi tiết phòng ban</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={handleEdit}>
                                <Edit className="h-4 w-4 mr-1" />
                                Chỉnh sửa
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
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Department Info */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Building2 className="h-5 w-5" />
                                        <span>Thông tin phòng ban</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mã phòng ban</label>
                                        <Badge variant="outline" className="ml-2">{department.code}</Badge>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</label>
                                        <Badge
                                            variant={department.active ? "default" : "secondary"}
                                            className="ml-2"
                                        >
                                            {department.active ? "Hoạt động" : "Tạm dừng"}
                                        </Badge>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ngày tạo</label>
                                        <p className="text-sm mt-1">{new Date(department.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>

                                    {department.description && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mô tả</label>
                                            <p className="text-sm mt-1">{department.description}</p>
                                        </div>
                                    )}

                                    {department.manager && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Trưởng phòng</label>
                                            <p className="text-sm mt-1">{department.manager.name || `ID: ${department.manager.id}`}</p>
                                        </div>
                                    )}

                                    {department.parentDepartment && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phòng ban cha</label>
                                            <p className="text-sm mt-1">{department.parentDepartment.name}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Statistics */}
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="h-5 w-5" />
                                        <span>Thống kê</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Tổng nhân viên:</span>
                                        <span className="font-semibold">{employeeCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Đang hoạt động:</span>
                                        <span className="font-semibold">{employees.filter(emp => emp.status === 'ACTIVE').length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Nghỉ phép:</span>
                                        <span className="font-semibold">{employees.filter(emp => emp.status === 'ON_LEAVE').length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Tạm dừng:</span>
                                        <span className="font-semibold">{employees.filter(emp => emp.status !== 'ACTIVE' && emp.status !== 'ON_LEAVE').length}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Employees List */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="h-5 w-5" />
                                        <span>Danh sách nhân viên</span>
                                        <Badge variant="outline">{employeeCount} người</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {error && (
                                        <Alert variant="destructive" className="mb-4">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    {loading ? (
                                        <LoadingSpinner size="md" className="py-8" text="Đang tải danh sách nhân viên..." />
                                    ) : employees.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-500">Phòng ban chưa có nhân viên</p>
                                            <p className="text-sm text-gray-400 mt-2">Nhân viên sẽ được hiển thị ở đây khi được thêm vào phòng ban</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nhân viên</TableHead>
                                                        <TableHead>Mã NV</TableHead>
                                                        <TableHead>Chức vụ</TableHead>
                                                        <TableHead>Trạng thái</TableHead>
                                                        <TableHead>Liên hệ</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {employees.map((employee) => (
                                                        <TableRow key={employee.id}>
                                                            <TableCell>
                                                                <div className="flex items-center space-x-3">
                                                                    <Avatar>
                                                                        <AvatarFallback>
                                                                            {employee.firstName?.[0] || ''}{employee.lastName?.[0] || ''}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-medium">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{employee.employeeCode || 'N/A'}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm">{employee.positionTitle || 'N/A'}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={employee.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                                    {employee.status === 'ACTIVE' ? 'Hoạt động' : employee.status === 'ON_LEAVE' ? 'Nghỉ phép' : 'Tạm dừng'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    {employee.email && (
                                                                        <div className="flex items-center space-x-1 text-sm">
                                                                            <Mail className="h-3 w-3" />
                                                                            <span>{employee.email}</span>
                                                                        </div>
                                                                    )}
                                                                    {employee.phone && (
                                                                        <div className="flex items-center space-x-1 text-sm">
                                                                            <Phone className="h-3 w-3" />
                                                                            <span>{employee.phone}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
