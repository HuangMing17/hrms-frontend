// Component để hiển thị response từ Department API
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { LoadingPage } from "./ui/loading"
import { departmentAPI, Department } from "../lib/api/department"

export function DepartmentResponseDisplay() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadDepartments = async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await departmentAPI.getDepartments(true)
            setDepartments(data)
        } catch (err: any) {
            setError(err.message || "Không thể tải danh sách phòng ban")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDepartments()
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Department API Response</h3>
                <Button onClick={loadDepartments} disabled={loading}>
                    {loading ? "Đang tải..." : "Refresh"}
                </Button>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-red-600">❌ {error}</p>
                    </CardContent>
                </Card>
            )}

            {loading && departments.length === 0 && !error && (
                <LoadingPage message="Đang tải danh sách phòng ban..." />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map((dept) => (
                    <Card key={dept.id} className="border">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{dept.name}</span>
                                <Badge variant={dept.active ? "default" : "secondary"}>
                                    {dept.active ? "Active" : "Inactive"}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm">
                                <strong>ID:</strong> {dept.id}
                            </div>
                            <div className="text-sm">
                                <strong>Code:</strong> {dept.code}
                            </div>
                            <div className="text-sm">
                                <strong>Description:</strong> {dept.description || "N/A"}
                            </div>
                            <div className="text-sm">
                                <strong>Manager:</strong> {dept.manager ? JSON.stringify(dept.manager) : "null"}
                            </div>
                            <div className="text-sm">
                                <strong>Parent Department:</strong> {dept.parentDepartment ? JSON.stringify(dept.parentDepartment) : "null"}
                            </div>
                            <div className="text-sm">
                                <strong>Sub Departments:</strong> {dept.subDepartments ? JSON.stringify(dept.subDepartments) : "null"}
                            </div>
                            <div className="text-sm">
                                <strong>Employees:</strong> {dept.employees ? JSON.stringify(dept.employees) : "null"}
                            </div>
                            <div className="text-sm">
                                <strong>Created At:</strong> {new Date(dept.createdAt).toLocaleString('vi-VN')}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {departments.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Không có phòng ban nào</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
