"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Edit, Trash2, Search, Power, PowerOff, UserCog, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Separator } from "./ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { getImageUrl } from "../lib/utils/image"
import { employeeAPI, Employee, EmployeeStatus, Gender, MaritalStatus, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeListResponse, PromoteEmployeeResponse } from "../lib/api/employee"
import { departmentAPI, Department } from "../lib/api/department"
import { positionAPI, Position } from "../lib/api/position"
import { attendanceAPI } from "../lib/api/attendance"
import { EmployeeDetailModal } from "./employee-detail-modal"
import { PromoteEmployeeDialog } from "./promote-employee-dialog"
import { CVParserDialog } from "./cv-parser-dialog"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination"
import { LoadingTable } from "./ui/loading"

// Status options
const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
    { value: EmployeeStatus.ACTIVE, label: 'Đang làm việc' },
    { value: EmployeeStatus.INACTIVE, label: 'Tạm dừng' },
    { value: EmployeeStatus.TERMINATED, label: 'Đã nghỉ việc' },
    { value: EmployeeStatus.ON_LEAVE, label: 'Nghỉ phép' },
    { value: EmployeeStatus.PROBATION, label: 'Thử việc' }
]

// Gender options
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
    { value: Gender.MALE, label: 'Nam' },
    { value: Gender.FEMALE, label: 'Nữ' },
    { value: Gender.OTHER, label: 'Khác' }
]

// Marital status options
const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
    { value: MaritalStatus.SINGLE, label: 'Độc thân' },
    { value: MaritalStatus.MARRIED, label: 'Đã kết hôn' },
    { value: MaritalStatus.DIVORCED, label: 'Ly dị' },
    { value: MaritalStatus.WIDOWED, label: 'Góa' },
    { value: MaritalStatus.SEPARATED, label: 'Ly thân' }
]

// Form data type - includes fields for both create and edit
interface EmployeeFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    birthDate: string
    nationalId: string
    gender: Gender
    maritalStatus: MaritalStatus
    hireDate: string
    terminationDate?: string  // Only for edit mode
    status: EmployeeStatus
    emergencyContact: string
    emergencyPhone: string
    departmentId?: number
    positionId?: number
    managerId?: number
    workShiftId?: number
    // CV/Resume fields (optional)
    educationLevel?: string
    educationMajor?: string
    educationSchool?: string
    educationGraduationYear?: number
    yearsOfExperience?: number
    previousExperience?: string // JSON string
    skills?: string // JSON array string
    languages?: string // JSON array string
    certifications?: string // JSON array string
    bio?: string
    linkedinUrl?: string
    portfolioUrl?: string
}

export function EmployeeManagement() {
    // Employee states
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchKeyword, setSearchKeyword] = useState("")

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [pageSize, setPageSize] = useState(20)

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [isCVParserOpen, setIsCVParserOpen] = useState(false)

    // Detail modal states
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
    const [promotingEmployee, setPromotingEmployee] = useState<Employee | null>(null)

    // Form states
    const [formData, setFormData] = useState<EmployeeFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        birthDate: "",
        nationalId: "",
        gender: Gender.MALE,
        maritalStatus: MaritalStatus.SINGLE,
        hireDate: new Date().toISOString().split('T')[0],
        status: EmployeeStatus.ACTIVE,
        emergencyContact: "",
        emergencyPhone: "",
        departmentId: undefined,
        positionId: undefined,
        managerId: undefined,
        workShiftId: undefined
    })

    // Department and Position for dropdowns
    const [departments, setDepartments] = useState<Department[]>([])
    const [positions, setPositions] = useState<Position[]>([]) // All positions
    const [filteredPositions, setFilteredPositions] = useState<Position[]>([]) // Filtered by department
    const [workShifts, setWorkShifts] = useState<any[]>([])

    // Load departments and positions
    useEffect(() => {
        loadDepartments()
        loadWorkShifts()
        loadPositions()
    }, [])

    // Load filtered positions when departmentId changes
    useEffect(() => {
        if (formData.departmentId) {
            loadPositionsByDepartment(formData.departmentId)
        } else {
            setFilteredPositions([])
        }
    }, [formData.departmentId])

    const loadDepartments = async () => {
        try {
            const data = await departmentAPI.getDepartments()
            setDepartments(data)
        } catch (err: any) {
            console.error('Error loading departments:', err)
        }
    }

    const loadPositions = async () => {
        try {
            const data = await positionAPI.getPositions()
            setPositions(data)
        } catch (err: any) {
            console.error('Error loading positions:', err)
        }
    }

    const loadPositionsByDepartment = async (departmentId: number) => {
        try {
            const data = await positionAPI.getPositionsByDepartment(departmentId)
            setFilteredPositions(data)
            // Clear positionId if current position is not in the filtered list
            if (formData.positionId) {
                const currentPosition = data.find(p => p.id === formData.positionId)
                if (!currentPosition) {
                    setFormData(prev => ({ ...prev, positionId: undefined }))
                }
            }
        } catch (err: any) {
            console.error('Error loading positions by department:', err)
            // Fallback: filter from all positions
            const filtered = positions.filter(p => p.departmentId === departmentId)
            setFilteredPositions(filtered)
        }
    }

    const loadWorkShifts = async () => {
        try {
            const data = await attendanceAPI.getWorkShifts()
            setWorkShifts(data)
        } catch (err: any) {
            console.error('Error loading work shifts:', err)
        }
    }

    // Load employees
    const loadEmployees = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await employeeAPI.getAllEmployees(currentPage, pageSize, 'createdAt', 'DESC')
            setEmployees(result.employees)
            setCurrentPage(result.currentPage)
            setTotalPages(result.totalPages)
            setTotalElements(result.totalElements)
            setPageSize(result.pageSize)
        } catch (err: any) {
            setError(err.message || "Không thể tải danh sách nhân viên")
        } finally {
            setLoading(false)
        }
    }

    // Search employees
    const searchEmployees = async () => {
        setLoading(true)
        setError(null)
        setCurrentPage(0)

        try {
            const result = await employeeAPI.searchEmployees(
                searchKeyword.trim() || undefined,
                currentPage,
                pageSize,
                'createdAt',
                'DESC'
            )
            setEmployees(result.employees)
            setCurrentPage(result.currentPage)
            setTotalPages(result.totalPages)
            setTotalElements(result.totalElements)
            setPageSize(result.pageSize)
        } catch (err: any) {
            setError(err.message || "Không thể tìm kiếm nhân viên")
        } finally {
            setLoading(false)
        }
    }

    // Handle CV parsed data
    const handleCVParseSuccess = (parsedData: CreateEmployeeRequest) => {
        // Fill form with parsed data
        setFormData(prev => ({
            ...prev,
            firstName: parsedData.firstName || "",
            lastName: parsedData.lastName || "",
            email: parsedData.email || "",
            phone: parsedData.phone || "",
            address: parsedData.address || "",
            birthDate: parsedData.birthDate || "",
            nationalId: parsedData.nationalId || "",
            gender: parsedData.gender || Gender.MALE,
            maritalStatus: parsedData.maritalStatus || MaritalStatus.SINGLE,
            hireDate: parsedData.hireDate || new Date().toISOString().split('T')[0],
            emergencyContact: "",
            emergencyPhone: "",
            // CV/Resume fields
            educationLevel: parsedData.educationLevel,
            educationMajor: parsedData.educationMajor,
            educationSchool: parsedData.educationSchool,
            educationGraduationYear: parsedData.educationGraduationYear,
            yearsOfExperience: parsedData.yearsOfExperience,
            previousExperience: parsedData.previousExperience,
            skills: parsedData.skills,
            languages: parsedData.languages,
            certifications: parsedData.certifications,
            bio: parsedData.bio,
            linkedinUrl: parsedData.linkedinUrl,
            portfolioUrl: parsedData.portfolioUrl,
            // Note: departmentId, positionId cần user chọn thủ công
        }))

        // Open create dialog
        setIsCreateDialogOpen(true)
    }

    // Create employee
    const handleCreateEmployee = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
            setError("Vui lòng nhập đầy đủ thông tin bắt buộc")
            return
        }
        
        if (!formData.departmentId) {
            setError("Vui lòng chọn phòng ban trước khi tạo nhân viên")
            return
        }

        setLoading(true)
        setError(null)

        const payload: CreateEmployeeRequest = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: sanitizeOptionalString(formData.phone),
            address: sanitizeOptionalString(formData.address),
            birthDate: sanitizeOptionalString(formData.birthDate),
            nationalId: sanitizeOptionalString(formData.nationalId),
            gender: formData.gender,
            maritalStatus: formData.maritalStatus,
            hireDate: formData.hireDate,
            status: formData.status,
            emergencyContact: sanitizeOptionalString(formData.emergencyContact),
            emergencyPhone: sanitizeOptionalString(formData.emergencyPhone),
            departmentId: formData.departmentId,
            positionId: formData.positionId,
            managerId: formData.managerId,
            workShiftId: formData.workShiftId,
            // CV/Resume fields
            educationLevel: formData.educationLevel,
            educationMajor: formData.educationMajor,
            educationSchool: formData.educationSchool,
            educationGraduationYear: formData.educationGraduationYear,
            yearsOfExperience: formData.yearsOfExperience,
            previousExperience: formData.previousExperience,
            skills: formData.skills,
            languages: formData.languages,
            certifications: formData.certifications,
            bio: formData.bio,
            linkedinUrl: formData.linkedinUrl,
            portfolioUrl: formData.portfolioUrl
        }

        try {
            await employeeAPI.createEmployee(payload)
            setIsCreateDialogOpen(false)
            resetForm()
            loadEmployees()
        } catch (err: any) {
            setError(err.message || "Không thể tạo nhân viên")
        } finally {
            setLoading(false)
        }
    }

    // Update employee
    const handleUpdateEmployee = async () => {
        if (!editingEmployee || !formData.firstName.trim() || !formData.lastName.trim()) {
            setError("Vui lòng nhập đầy đủ thông tin bắt buộc")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const updateData: UpdateEmployeeRequest = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: sanitizeOptionalString(formData.phone),
                address: sanitizeOptionalString(formData.address),
                birthDate: sanitizeOptionalString(formData.birthDate),
                nationalId: sanitizeOptionalString(formData.nationalId),
                gender: formData.gender,
                maritalStatus: formData.maritalStatus,
                hireDate: formData.hireDate,
                terminationDate: sanitizeOptionalString(formData.terminationDate),
                status: formData.status,
                emergencyContact: sanitizeOptionalString(formData.emergencyContact),
                emergencyPhone: sanitizeOptionalString(formData.emergencyPhone),
                departmentId: formData.departmentId,
                positionId: formData.positionId,
                // Luôn gửi managerId và workShiftId, kể cả khi null (để xóa)
                managerId: formData.managerId !== undefined ? formData.managerId : null,
                workShiftId: formData.workShiftId !== undefined ? formData.workShiftId : null
            }

            await employeeAPI.updateEmployee(editingEmployee.id, updateData)
            setIsEditDialogOpen(false)
            setEditingEmployee(null)
            resetForm()
            loadEmployees()
            // Refresh detail modal if open
            if (selectedEmployee && selectedEmployee.id === editingEmployee.id) {
                const updated = await employeeAPI.getEmployeeById(editingEmployee.id)
                setSelectedEmployee(updated)
            }
        } catch (err: any) {
            setError(err.message || "Không thể cập nhật nhân viên")
        } finally {
            setLoading(false)
        }
    }

    // Delete employee
    const handleDeleteEmployee = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await employeeAPI.deleteEmployee(id)
            loadEmployees()
        } catch (err: any) {
            setError(err.message || "Không thể xóa nhân viên")
        } finally {
            setLoading(false)
        }
    }

    // Activate employee
    const handleActivateEmployee = async (id: number) => {
        setLoading(true)
        setError(null)
        try {
            await employeeAPI.activateEmployee(id)
            loadEmployees()
        } catch (err: any) {
            setError(err.message || "Không thể kích hoạt nhân viên")
        } finally {
            setLoading(false)
        }
    }

    // Deactivate employee
    const handleDeactivateEmployee = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa nhân viên này?")) {
            return
        }
        setLoading(true)
        setError(null)
        try {
            await employeeAPI.deactivateEmployee(id)
            loadEmployees()
        } catch (err: any) {
            setError(err.message || "Không thể vô hiệu hóa nhân viên")
        } finally {
            setLoading(false)
        }
    }

    const sanitizeOptionalString = (value?: string | null) => {
        if (value === undefined || value === null) return undefined
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
    }

    /**
     * Convert skills/certifications từ format "Item1; Item2" sang JSON array string
     */
    const convertToJSONArray = (value?: string | null): string | undefined => {
        if (!value || !value.trim()) return undefined
        const items = value.split(';')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        if (items.length === 0) return undefined
        return JSON.stringify(items)
    }

    /**
     * Convert languages từ format "Ngôn ngữ: Mức độ; Ngôn ngữ2: Mức độ2" sang JSON array string
     * Ví dụ: "Tiếng Anh: Trung cấp; Tiếng Việt: Bản xứ" → [{"language": "Tiếng Anh", "level": "Trung cấp"}, ...]
     */
    const convertLanguagesToJSON = (value?: string | null): string | undefined => {
        if (!value || !value.trim()) return undefined
        const items = value.split(';')
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => {
                const parts = item.split(':').map(p => p.trim())
                if (parts.length >= 2) {
                    return { language: parts[0], level: parts[1] }
                } else {
                    return { language: parts[0], level: "Basic" } // Default level
                }
            })
        if (items.length === 0) return undefined
        return JSON.stringify(items)
    }

    /**
     * Convert JSON array string về format hiển thị "Item1; Item2"
     */
    const convertJSONArrayToDisplay = (jsonString?: string | null): string => {
        if (!jsonString || !jsonString.trim()) return ""
        try {
            const arr = JSON.parse(jsonString)
            if (Array.isArray(arr)) {
                return arr.join('; ')
            }
        } catch {
            // Nếu không parse được, trả về nguyên bản (có thể là format cũ)
            return jsonString
        }
        return ""
    }

    /**
     * Convert languages JSON về format hiển thị "Ngôn ngữ: Mức độ; ..."
     */
    const convertLanguagesToDisplay = (jsonString?: string | null): string => {
        if (!jsonString || !jsonString.trim()) return ""
        try {
            const arr = JSON.parse(jsonString)
            if (Array.isArray(arr)) {
                return arr.map((item: any) => {
                    if (typeof item === 'object' && item.language) {
                        return `${item.language}: ${item.level || 'Basic'}`
                    } else {
                        return String(item)
                    }
                }).join('; ')
            }
        } catch {
            return jsonString
        }
        return ""
    }

    // Reset form
    const resetForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            birthDate: "",
            nationalId: "",
            gender: Gender.MALE,
            maritalStatus: MaritalStatus.SINGLE,
            hireDate: new Date().toISOString().split('T')[0],
            terminationDate: "",
            status: EmployeeStatus.ACTIVE,
            emergencyContact: "",
            emergencyPhone: "",
            departmentId: undefined,
            positionId: undefined,
            managerId: undefined,
            workShiftId: undefined,
            // CV/Resume fields
            educationLevel: undefined,
            educationMajor: undefined,
            educationSchool: undefined,
            educationGraduationYear: undefined,
            yearsOfExperience: undefined,
            previousExperience: undefined,
            skills: undefined,
            languages: undefined,
            certifications: undefined,
            bio: undefined,
            linkedinUrl: undefined,
            portfolioUrl: undefined
        })
    }

    // Open edit dialog
    const openEditDialog = async (employee: Employee) => {
        setEditingEmployee(employee)
        const formData = {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone || "",
            address: employee.address || "",
            birthDate: employee.birthDate || "",
            nationalId: employee.nationalId || "",
            gender: employee.gender || Gender.MALE,
            maritalStatus: employee.maritalStatus || MaritalStatus.SINGLE,
            hireDate: employee.hireDate,
            terminationDate: employee.terminationDate || "",
            status: employee.status,
            emergencyContact: employee.emergencyContact || "",
            emergencyPhone: employee.emergencyPhone || "",
            departmentId: employee.departmentId,
            positionId: employee.positionId,
            managerId: employee.managerId,
            workShiftId: employee.workShiftId,
            // CV/Resume fields
            educationLevel: employee.educationLevel,
            educationMajor: employee.educationMajor,
            educationSchool: employee.educationSchool,
            educationGraduationYear: employee.educationGraduationYear,
            yearsOfExperience: employee.yearsOfExperience,
            previousExperience: employee.previousExperience,
            skills: employee.skills,
            languages: employee.languages,
            certifications: employee.certifications,
            bio: employee.bio,
            linkedinUrl: employee.linkedinUrl,
            portfolioUrl: employee.portfolioUrl
        }
        setFormData(formData)
        
        // Load positions for the employee's department if exists
        if (employee.departmentId) {
            await loadPositionsByDepartment(employee.departmentId)
        } else {
            setFilteredPositions([])
        }
        
        setIsEditDialogOpen(true)
    }

    // Open detail modal
    const openDetailModal = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsDetailModalOpen(true)
    }

    // Close detail modal
    const closeDetailModal = () => {
        setIsDetailModalOpen(false)
        setSelectedEmployee(null)
    }

    const openPromoteDialog = (employee: Employee) => {
        setPromotingEmployee(employee)
        setIsPromoteDialogOpen(true)
    }

    const handlePromotionSuccess = async (response: PromoteEmployeeResponse) => {
        await loadEmployees()
        if (selectedEmployee) {
            try {
                const targetId = response.employee.id ?? selectedEmployee.id
                const refreshed = await employeeAPI.getEmployeeById(targetId)
                setSelectedEmployee(refreshed)
            } catch (err) {
                console.error("Failed to refresh employee detail after promotion", err)
            }
        }
    }

    const renderSystemAccessBadge = (employee: Employee) => {
        const hasAccount = Boolean(employee.userId)
        return (
            <Badge className={hasAccount ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}>
                {hasAccount ? "Đã có" : "Chưa có"}
            </Badge>
        )
    }

    // Get status badge
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

    // Load employees on mount and when page changes
    useEffect(() => {
        if (searchKeyword.trim()) {
            searchEmployees()
        } else {
            loadEmployees()
        }
    }, [currentPage])

    // Search when keyword changes (with debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchKeyword.trim()) {
                searchEmployees()
            } else {
                loadEmployees()
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchKeyword])

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2 text-gradient">Quản Lý Nhân Viên</h2>
                <p className="text-muted-foreground">Quản lý thông tin và trạng thái nhân viên</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
                        <div className="p-2 rounded-full bg-purple-gradient">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">{totalElements}</div>
                        <p className="text-xs text-muted-foreground">Tổng số nhân viên</p>
                    </CardContent>
                </Card>

                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đang làm việc</CardTitle>
                        <div className="p-2 rounded-full bg-green-gradient">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">
                            {employees.filter(e => e.status === EmployeeStatus.ACTIVE).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Nhân viên hoạt động</p>
                    </CardContent>
                </Card>

                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nghỉ phép</CardTitle>
                        <div className="p-2 rounded-full bg-orange-gradient">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">
                            {employees.filter(e => e.status === EmployeeStatus.ON_LEAVE).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Nhân viên nghỉ phép</p>
                    </CardContent>
                </Card>

                <Card className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thử việc</CardTitle>
                        <div className="p-2 rounded-full bg-yellow-gradient">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient">
                            {employees.filter(e => e.status === EmployeeStatus.PROBATION).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Nhân viên thử việc</p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Danh sách nhân viên</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsCVParserOpen(true)}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Thêm nhân viên với AI
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200 border-0">
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm nhân viên mới
                            </Button>
                        </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tạo Nhân Viên Mới</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">Họ *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        placeholder="Nhập họ"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Tên *</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        placeholder="Nhập tên"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Nhập email"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="hireDate">Ngày vào làm *</Label>
                                    <Input
                                        id="hireDate"
                                        type="date"
                                        value={formData.hireDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="departmentId">Phòng ban *</Label>
                                    <Select
                                        value={formData.departmentId?.toString() || ""}
                                        onValueChange={(value) => {
                                            const deptId = value ? parseInt(value) : undefined
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                departmentId: deptId,
                                                positionId: undefined // Clear position when department changes
                                            }))
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn phòng ban trước" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="positionId">Chức vụ</Label>
                                    <Select
                                        value={formData.positionId?.toString() || ""}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, positionId: value ? parseInt(value) : undefined }))}
                                        disabled={!formData.departmentId}
                                    >
                                        <SelectTrigger className={!formData.departmentId ? "opacity-50 cursor-not-allowed" : ""}>
                                            <SelectValue placeholder={formData.departmentId ? "Chọn chức vụ" : "Vui lòng chọn phòng ban trước"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredPositions.length > 0 ? (
                                                filteredPositions.map((pos) => (
                                                    <SelectItem key={pos.id} value={pos.id.toString()}>
                                                        {pos.title}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    {formData.departmentId ? "Không có chức vụ nào" : "Chọn phòng ban trước"}
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="gender">Giới tính</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as Gender }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GENDER_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="maritalStatus">Tình trạng hôn nhân</Label>
                                    <Select
                                        value={formData.maritalStatus}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, maritalStatus: value as MaritalStatus }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MARITAL_STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="birthDate">Ngày sinh</Label>
                                    <Input
                                        id="birthDate"
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nationalId">CMND/CCCD</Label>
                                    <Input
                                        id="nationalId"
                                        value={formData.nationalId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                                        placeholder="Nhập số CMND/CCCD"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="address">Địa chỉ</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Nhập địa chỉ"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="managerId">Quản lý trực tiếp</Label>
                                    <Select
                                        value={formData.managerId?.toString() || "none"}
                                        onValueChange={(value) => {
                                            if (value === "none") {
                                                setFormData(prev => ({ ...prev, managerId: undefined }))
                                            } else {
                                                const managerId = parseInt(value)
                                                if (!isNaN(managerId)) {
                                                    setFormData(prev => ({ ...prev, managerId: managerId }))
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn quản lý" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] overflow-y-auto">
                                            <SelectItem value="none">Không có</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                                    {emp.fullName} ({emp.employeeCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="workShiftId">Ca làm việc</Label>
                                    <Select
                                        value={formData.workShiftId?.toString() || "none"}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, workShiftId: value === "none" ? undefined : parseInt(value) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn ca làm việc" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không có</SelectItem>
                                            {workShifts.map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>
                                                    {shift.name} ({shift.startTime} - {shift.endTime})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="emergencyContact">Liên hệ khẩn cấp</Label>
                                    <Input
                                        id="emergencyContact"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                        placeholder="Tên người liên hệ khẩn cấp"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergencyPhone">Số điện thoại khẩn cấp</Label>
                                    <Input
                                        id="emergencyPhone"
                                        value={formData.emergencyPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                                        placeholder="Số điện thoại liên hệ khẩn cấp"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="status">Trạng thái</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as EmployeeStatus }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* CV/Resume Fields Section */}
                            <Separator className="my-4" />
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thông tin CV/Resume (Tùy chọn)</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="educationLevel">Trình độ học vấn</Label>
                                        <Input
                                            id="educationLevel"
                                            value={formData.educationLevel || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, educationLevel: e.target.value || undefined }))}
                                            placeholder="Ví dụ: Đại học, Cao đẳng"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="educationMajor">Chuyên ngành</Label>
                                        <Input
                                            id="educationMajor"
                                            value={formData.educationMajor || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, educationMajor: e.target.value || undefined }))}
                                            placeholder="Ví dụ: Quản trị kinh doanh"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="educationSchool">Tên trường</Label>
                                        <Input
                                            id="educationSchool"
                                            value={formData.educationSchool || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, educationSchool: e.target.value || undefined }))}
                                            placeholder="Tên trường đại học/cao đẳng"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="educationGraduationYear">Năm tốt nghiệp</Label>
                                        <Input
                                            id="educationGraduationYear"
                                            type="number"
                                            value={formData.educationGraduationYear || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, educationGraduationYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                                            placeholder="Ví dụ: 2020"
                                            min="1950"
                                            max={new Date().getFullYear()}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="yearsOfExperience">Số năm kinh nghiệm</Label>
                                        <Input
                                            id="yearsOfExperience"
                                            type="number"
                                            value={formData.yearsOfExperience || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined }))}
                                            placeholder="Số năm"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                        <Input
                                            id="linkedinUrl"
                                            type="url"
                                            value={formData.linkedinUrl || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value || undefined }))}
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                                    <Input
                                        id="portfolioUrl"
                                        type="url"
                                        value={formData.portfolioUrl || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value || undefined }))}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="bio">Tóm tắt về bản thân</Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value || undefined }))}
                                        placeholder="Mô tả ngắn gọn về kinh nghiệm và kỹ năng..."
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="skills">Kỹ năng (phân cách bằng dấu ;)</Label>
                                    <Textarea
                                        id="skills"
                                        value={formData.skills ? convertJSONArrayToDisplay(formData.skills) : ""}
                                        onChange={(e) => {
                                            const jsonValue = convertToJSONArray(e.target.value)
                                            setFormData(prev => ({ ...prev, skills: jsonValue }))
                                        }}
                                        placeholder="Giao tiếp; Bán hàng; Chăm sóc khách hàng"
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="languages">Ngôn ngữ (format: Ngôn ngữ: Mức độ, phân cách bằng ;)</Label>
                                    <Textarea
                                        id="languages"
                                        value={formData.languages ? convertLanguagesToDisplay(formData.languages) : ""}
                                        onChange={(e) => {
                                            const jsonValue = convertLanguagesToJSON(e.target.value)
                                            setFormData(prev => ({ ...prev, languages: jsonValue }))
                                        }}
                                        placeholder="Tiếng Anh: Trung cấp; Tiếng Việt: Bản xứ"
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="certifications">Chứng chỉ (phân cách bằng dấu ;)</Label>
                                    <Textarea
                                        id="certifications"
                                        value={formData.certifications ? convertJSONArrayToDisplay(formData.certifications) : ""}
                                        onChange={(e) => {
                                            const jsonValue = convertToJSONArray(e.target.value)
                                            setFormData(prev => ({ ...prev, certifications: jsonValue }))
                                        }}
                                        placeholder="Chứng chỉ bán hàng; Chứng chỉ chăm sóc khách hàng"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button onClick={handleCreateEmployee} disabled={loading}>
                                    {loading ? "Đang tạo..." : "Tạo"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* Search */}
            <Card className="mb-6 shadow-vibrant hover-glow border-gradient">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm nhân viên (tên, email, mã nhân viên)..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Employees Table */}
            <Card className="shadow-vibrant hover-glow border-gradient">
                <CardContent className="p-0">
                    <div className="rounded-md border border-border/50 dark:border-border/30">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nhân viên</TableHead>
                                    <TableHead>Mã NV</TableHead>
                                    <TableHead>Phòng ban</TableHead>
                                    <TableHead>Chức vụ</TableHead>
                                    <TableHead>Truy cập</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày vào làm</TableHead>
                                    <TableHead className="w-[140px]">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <LoadingTable colSpan={8} message="Đang tải danh sách nhân viên..." />
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Users className="h-8 w-8 text-purple-400" />
                                                <p className="text-sm">Chưa có nhân viên nào trong hệ thống</p>
                                                <p className="text-xs">Nhấn “Thêm nhân viên mới” để bắt đầu</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow
                                            key={employee.id}
                                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            onClick={() => openDetailModal(employee)}
                                            title="Click để xem chi tiết"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={getImageUrl(employee.avatarUrl)} alt={employee.fullName} />
                                                        <AvatarFallback>
                                                            {employee.firstName[0]}{employee.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{employee.fullName}</div>
                                                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{employee.employeeCode}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {employee.departmentName || (
                                                    departments.find(d => d.id === employee.departmentId)?.name || "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {employee.positionTitle || (
                                                    positions.find(p => p.id === employee.positionId)?.title || "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {renderSystemAccessBadge(employee)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell>
                                                {new Date(employee.hireDate).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {employee.status === EmployeeStatus.ACTIVE ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Vô hiệu hóa"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeactivateEmployee(employee.id)
                                                            }}
                                                        >
                                                            <PowerOff className="h-4 w-4 text-orange-600" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Kích hoạt"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleActivateEmployee(employee.id)
                                                            }}
                                                        >
                                                            <Power className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Chỉnh sửa"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openEditDialog(employee)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {!employee.userId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Thăng chức & cấp quyền"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openPromoteDialog(employee)
                                                            }}
                                                        >
                                                            <UserCog className="h-4 w-4 text-purple-600" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteEmployee(employee.id)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = currentPage < 3 ? i : currentPage - 2 + i
                                if (page >= totalPages) return null
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            onClick={() => setCurrentPage(page)}
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                        >
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            })}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa Nhân Viên</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-firstName">Họ *</Label>
                                <Input
                                    id="edit-firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    placeholder="Nhập họ"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-lastName">Tên *</Label>
                                <Input
                                    id="edit-lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="Nhập tên"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email *</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Nhập email"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-address">Địa chỉ</Label>
                            <Textarea
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Nhập địa chỉ"
                                rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-phone">Số điện thoại</Label>
                                <Input
                                    id="edit-phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-birthDate">Ngày sinh</Label>
                                <Input
                                    id="edit-birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-nationalId">CMND/CCCD</Label>
                                <Input
                                    id="edit-nationalId"
                                    value={formData.nationalId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                                    placeholder="Nhập số CMND/CCCD"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-maritalStatus">Tình trạng hôn nhân</Label>
                                <Select
                                    value={formData.maritalStatus}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, maritalStatus: value as MaritalStatus }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MARITAL_STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-hireDate">Ngày vào làm</Label>
                                <Input
                                    id="edit-hireDate"
                                    type="date"
                                    value={formData.hireDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-terminationDate">Ngày nghỉ việc</Label>
                                <Input
                                    id="edit-terminationDate"
                                    type="date"
                                    value={formData.terminationDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, terminationDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-departmentId">Phòng ban *</Label>
                                <Select
                                    value={formData.departmentId?.toString() || ""}
                                    onValueChange={(value) => {
                                        const deptId = value ? parseInt(value) : undefined
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            departmentId: deptId,
                                            positionId: undefined // Clear position when department changes
                                        }))
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn phòng ban trước" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-positionId">Chức vụ</Label>
                                <Select
                                    value={formData.positionId?.toString() || ""}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, positionId: value ? parseInt(value) : undefined }))}
                                    disabled={!formData.departmentId}
                                >
                                    <SelectTrigger className={!formData.departmentId ? "opacity-50 cursor-not-allowed" : ""}>
                                        <SelectValue placeholder={formData.departmentId ? "Chọn chức vụ" : "Vui lòng chọn phòng ban trước"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredPositions.length > 0 ? (
                                            filteredPositions.map((pos) => (
                                                <SelectItem key={pos.id} value={pos.id.toString()}>
                                                    {pos.title}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                {formData.departmentId ? "Không có chức vụ nào" : "Chọn phòng ban trước"}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-gender">Giới tính</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as Gender }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GENDER_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-status">Trạng thái</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as EmployeeStatus }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-managerId">Quản lý trực tiếp</Label>
                                <Select
                                    value={formData.managerId !== undefined && formData.managerId !== null ? formData.managerId.toString() : "none"}
                                    onValueChange={(value) => {
                                        if (value === "none") {
                                            setFormData(prev => ({ ...prev, managerId: undefined }))
                                        } else {
                                            const managerId = parseInt(value)
                                            if (!isNaN(managerId)) {
                                                setFormData(prev => ({ ...prev, managerId: managerId }))
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn quản lý" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        <SelectItem value="none">Không có</SelectItem>
                                        {employees
                                            .filter(emp => emp.id !== editingEmployee?.id)
                                            .map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                                    {emp.fullName} ({emp.employeeCode})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-workShiftId">Ca làm việc</Label>
                                <Select
                                    value={formData.workShiftId?.toString() || "none"}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, workShiftId: value === "none" ? undefined : parseInt(value) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ca làm việc" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không có</SelectItem>
                                        {workShifts.map((shift) => (
                                            <SelectItem key={shift.id} value={shift.id.toString()}>
                                                {shift.name} ({shift.startTime} - {shift.endTime})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-emergencyContact">Liên hệ khẩn cấp</Label>
                                <Input
                                    id="edit-emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                    placeholder="Tên người liên hệ khẩn cấp"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-emergencyPhone">Số điện thoại khẩn cấp</Label>
                                <Input
                                    id="edit-emergencyPhone"
                                    value={formData.emergencyPhone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                                    placeholder="Số điện thoại liên hệ khẩn cấp"
                                />
                            </div>
                        </div>

                        {/* CV/Resume Fields Section */}
                        <Separator className="my-4" />
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thông tin CV/Resume</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-educationLevel">Trình độ học vấn</Label>
                                    <Input
                                        id="edit-educationLevel"
                                        value={formData.educationLevel || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, educationLevel: e.target.value || undefined }))}
                                        placeholder="Ví dụ: Đại học, Cao đẳng"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-educationMajor">Chuyên ngành</Label>
                                    <Input
                                        id="edit-educationMajor"
                                        value={formData.educationMajor || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, educationMajor: e.target.value || undefined }))}
                                        placeholder="Ví dụ: Quản trị kinh doanh"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-educationSchool">Tên trường</Label>
                                    <Input
                                        id="edit-educationSchool"
                                        value={formData.educationSchool || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, educationSchool: e.target.value || undefined }))}
                                        placeholder="Tên trường đại học/cao đẳng"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-educationGraduationYear">Năm tốt nghiệp</Label>
                                    <Input
                                        id="edit-educationGraduationYear"
                                        type="number"
                                        value={formData.educationGraduationYear || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, educationGraduationYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        placeholder="Ví dụ: 2020"
                                        min="1950"
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-yearsOfExperience">Số năm kinh nghiệm</Label>
                                    <Input
                                        id="edit-yearsOfExperience"
                                        type="number"
                                        value={formData.yearsOfExperience || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        placeholder="Số năm"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-linkedinUrl">LinkedIn URL</Label>
                                    <Input
                                        id="edit-linkedinUrl"
                                        type="url"
                                        value={formData.linkedinUrl || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value || undefined }))}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="edit-portfolioUrl">Portfolio URL</Label>
                                <Input
                                    id="edit-portfolioUrl"
                                    type="url"
                                    value={formData.portfolioUrl || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value || undefined }))}
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-bio">Tóm tắt về bản thân</Label>
                                <Textarea
                                    id="edit-bio"
                                    value={formData.bio || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value || undefined }))}
                                    placeholder="Mô tả ngắn gọn về kinh nghiệm và kỹ năng..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-skills">Kỹ năng (phân cách bằng dấu ;)</Label>
                                <Textarea
                                    id="edit-skills"
                                    value={formData.skills ? convertJSONArrayToDisplay(formData.skills) : ""}
                                    onChange={(e) => {
                                        const jsonValue = convertToJSONArray(e.target.value)
                                        setFormData(prev => ({ ...prev, skills: jsonValue }))
                                    }}
                                    placeholder="Giao tiếp; Bán hàng; Chăm sóc khách hàng"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-languages">Ngôn ngữ (format: Ngôn ngữ: Mức độ, phân cách bằng ;)</Label>
                                <Textarea
                                    id="edit-languages"
                                    value={formData.languages ? convertLanguagesToDisplay(formData.languages) : ""}
                                    onChange={(e) => {
                                        const jsonValue = convertLanguagesToJSON(e.target.value)
                                        setFormData(prev => ({ ...prev, languages: jsonValue }))
                                    }}
                                    placeholder="Tiếng Anh: Trung cấp; Tiếng Việt: Bản xứ"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-certifications">Chứng chỉ (phân cách bằng dấu ;)</Label>
                                <Textarea
                                    id="edit-certifications"
                                    value={formData.certifications ? convertJSONArrayToDisplay(formData.certifications) : ""}
                                    onChange={(e) => {
                                        const jsonValue = convertToJSONArray(e.target.value)
                                        setFormData(prev => ({ ...prev, certifications: jsonValue }))
                                    }}
                                    placeholder="Chứng chỉ bán hàng; Chứng chỉ chăm sóc khách hàng"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleUpdateEmployee} disabled={loading}>
                                {loading ? "Đang cập nhật..." : "Cập nhật"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Employee Detail Modal */}
            {selectedEmployee && (
                <EmployeeDetailModal
                    employee={selectedEmployee}
                    isOpen={isDetailModalOpen}
                    onClose={closeDetailModal}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteEmployee}
                    onActivate={handleActivateEmployee}
                    onDeactivate={handleDeactivateEmployee}
                    onPromote={openPromoteDialog}
                    onEmployeeUpdated={(updated) => {
                        setSelectedEmployee(updated)
                        // Update employee in the list
                        setEmployees(prev => prev.map(emp => 
                            emp.id === updated.id ? updated : emp
                        ))
                    }}
                />
            )}

            {/* CV Parser Dialog */}
            <CVParserDialog
                open={isCVParserOpen}
                onOpenChange={setIsCVParserOpen}
                onParseSuccess={handleCVParseSuccess}
            />

            <PromoteEmployeeDialog
                employee={promotingEmployee}
                open={isPromoteDialogOpen}
                onOpenChange={(open) => {
                    setIsPromoteDialogOpen(open)
                    if (!open) {
                        setPromotingEmployee(null)
                    }
                }}
                departments={departments}
                positions={positions}
                employees={employees}
                onSuccess={handlePromotionSuccess}
            />
        </div>
    )
}

