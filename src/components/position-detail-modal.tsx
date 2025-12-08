"use client"

import { useState, useEffect } from "react"
import { X, Users, UserCog, Calendar, User, Phone, Mail, MapPin, Edit, Trash2, DollarSign } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Alert, AlertDescription } from "./ui/alert"
import { positionAPI, Position } from "../lib/api/position"
import { departmentAPI, Department } from "../lib/api/department"

interface PositionDetailModalProps {
    position: Position
    isOpen: boolean
    onClose: () => void
    onEdit?: (position: Position) => void
    onDelete?: (id: number) => void
}

export function PositionDetailModal({
    position,
    isOpen,
    onClose,
    onEdit,
    onDelete
}: PositionDetailModalProps) {
    const [department, setDepartment] = useState<Department | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [employeeCount, setEmployeeCount] = useState(0)

    // Load department info when modal opens
    useEffect(() => {
        if (isOpen && position) {
            loadDepartmentInfo()
            loadEmployeeCount()
        }
    }, [isOpen, position])

    const loadDepartmentInfo = async () => {
        try {
            const dept = await departmentAPI.getDepartmentById(position.departmentId)
            setDepartment(dept)
        } catch (err: any) {
            console.error('Error loading department:', err)
        }
    }

    const loadEmployeeCount = async () => {
        try {
            // TODO: Implement getPositionEmployeeCount API method
            const count = 0 // Temporary placeholder
            setEmployeeCount(count)
        } catch (err: any) {
            console.error('Error loading employee count:', err)
        }
    }

    const handleEdit = () => {
        if (onEdit) {
            onEdit(position)
        }
    }

    const handleDelete = () => {
        if (onDelete && confirm(`Bạn có chắc chắn muốn xóa chức vụ "${position.title}"?`)) {
            onDelete(position.id)
        }
    }

    const getLevelBadge = (level: string) => {
        const colors = {
            "INTERN": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            "STAFF": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            "SENIOR_STAFF": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            "SUPERVISOR": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            "ASSISTANT_MANAGER": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            "MANAGER": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            "DIRECTOR": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }
        return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-beauty-gradient">
                            <UserCog className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gradient">{position.title}</h2>
                            <p className="text-gray-600 dark:text-gray-400">Chi tiết chức vụ</p>
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
                        {/* Position Info */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <UserCog className="h-5 w-5" />
                                        <span>Thông tin chức vụ</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mã chức vụ</label>
                                        <Badge variant="outline" className="ml-2">{position.code}</Badge>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cấp độ</label>
                                        <Badge className={`ml-2 ${getLevelBadge(position.level)}`}>
                                            {position.level}
                                        </Badge>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</label>
                                        <Badge
                                            variant={position.active ? "default" : "secondary"}
                                            className="ml-2"
                                        >
                                            {position.active ? "Hoạt động" : "Tạm dừng"}
                                        </Badge>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ngày tạo</label>
                                        <p className="text-sm mt-1">{new Date(position.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>

                                    {position.description && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mô tả</label>
                                            <p className="text-sm mt-1">{position.description}</p>
                                        </div>
                                    )}

                                    {position.baseSalary && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Lương cơ bản</label>
                                            <p className="text-sm mt-1 font-semibold text-green-600">
                                                {position.baseSalary.toLocaleString()} VNĐ
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Department Info */}
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <MapPin className="h-5 w-5" />
                                        <span>Phòng ban</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {department ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Tên phòng ban:</span>
                                                <span className="font-semibold">{department.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Mã phòng ban:</span>
                                                <Badge variant="outline">{department.code}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Trạng thái:</span>
                                                <Badge variant={department.active ? "default" : "secondary"}>
                                                    {department.active ? "Hoạt động" : "Tạm dừng"}
                                                </Badge>
                                            </div>
                                            {department.manager && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Trưởng phòng:</span>
                                                    <span className="text-sm">{department.manager.name || `ID: ${department.manager.id}`}</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500">Đang tải thông tin phòng ban...</p>
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
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Nhân viên hiện tại:</span>
                                        <span className="font-semibold">{employeeCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Trạng thái:</span>
                                        <span className="text-sm">{position.active ? "Đang tuyển" : "Tạm dừng"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Position Details */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <DollarSign className="h-5 w-5" />
                                        <span>Thông tin chi tiết</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {error && (
                                        <Alert variant="destructive" className="mb-4">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-4">
                                        {/* Salary Information */}
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <h4 className="font-semibold mb-2 flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                Thông tin lương
                                            </h4>
                                            {position.baseSalary ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Lương cơ bản:</span>
                                                        <span className="font-semibold text-green-600">
                                                            {position.baseSalary.toLocaleString()} VNĐ/tháng
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Lương năm:</span>
                                                        <span className="font-semibold text-green-600">
                                                            {(position.baseSalary * 12).toLocaleString()} VNĐ/năm
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Chưa cập nhật thông tin lương</p>
                                            )}
                                        </div>

                                        {/* Requirements & Responsibilities */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Yêu cầu công việc</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {"Chưa cập nhật yêu cầu công việc"}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Trách nhiệm</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {"Chưa cập nhật trách nhiệm"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Thông tin bổ sung</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Ngày tạo:</span>
                                                    <p className="font-medium">{new Date(position.createdAt).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                {position.updatedAt && (
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Cập nhật lần cuối:</span>
                                                        <p className="font-medium">{new Date(position.updatedAt).toLocaleDateString('vi-VN')}</p>
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
            </div>
        </div>
    )
}
