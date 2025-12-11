import api from '../axios'

// Enums
export enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    TERMINATED = "TERMINATED",
    ON_LEAVE = "ON_LEAVE",
    PROBATION = "PROBATION"
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}

export enum MaritalStatus {
    SINGLE = "SINGLE",
    MARRIED = "MARRIED",
    DIVORCED = "DIVORCED",
    WIDOWED = "WIDOWED",
    SEPARATED = "SEPARATED"
}

// Employee Types
export interface Employee {
    id: number
    employeeCode: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone?: string
    address?: string
    birthDate?: string
    nationalId?: string
    gender?: Gender
    maritalStatus?: MaritalStatus
    hireDate: string
    terminationDate?: string
    status: EmployeeStatus
    avatarUrl?: string
    emergencyContact?: string
    emergencyPhone?: string
    userId?: number
    departmentId?: number
    positionId?: number
    managerId?: number
    workShiftId?: number
    createdAt: string
    updatedAt: string
    // Extended fields for UI
    departmentName?: string
    positionTitle?: string
    managerName?: string
    // KPI Fields
    salesTarget?: number
    currentSales?: number
    attendanceRate?: number
    customerSatisfactionScore?: number
    kpiRating?: number
    kpiUpdatedAt?: string
    // Denormalized fields
    positionCode?: string
    // CV/Resume fields
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

export interface CreateEmployeeRequest {
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: string
    birthDate?: string
    nationalId?: string
    gender?: Gender
    maritalStatus?: MaritalStatus
    hireDate: string
    status?: EmployeeStatus
    avatarUrl?: string
    emergencyContact?: string
    emergencyPhone?: string
    userId?: number
    departmentId?: number
    positionId?: number
    managerId?: number
    workShiftId?: number
    // CV/Resume fields
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

export interface UpdateEmployeeRequest {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    birthDate?: string
    nationalId?: string
    gender?: Gender
    maritalStatus?: MaritalStatus
    hireDate?: string
    terminationDate?: string
    status?: EmployeeStatus
    avatarUrl?: string
    emergencyContact?: string
    emergencyPhone?: string
    departmentId?: number
    positionId?: number
    managerId?: number
    workShiftId?: number
}

export interface EmployeeListResponse {
    employees: Employee[]
    currentPage: number
    totalPages: number
    totalElements: number
    pageSize: number
}

// KPI Types
export interface UpdateKPIRequest {
    salesTarget: number                    // Required: Mục tiêu doanh số (VND)
    currentSales?: number                  // Optional: Doanh số hiện tại (VND)
    attendanceRate?: number                 // Optional: Tỷ lệ chấm công (0-100)
    customerSatisfactionScore?: number      // Optional: Điểm hài lòng khách hàng (1-5)
}

export interface KPIDataResponse {
    employeeId: number
    employeeName: string
    salesTarget: number
    currentSales: number
    salesAchievement: number               // % đạt mục tiêu (tự động tính)
    attendanceRate: number
    customerSatisfactionScore?: number      // Điểm hài lòng khách hàng (1-5)
    kpiRating: number                      // Điểm KPI tổng hợp (0-100)
    kpiUpdatedAt: string                   // ISO 8601 format
}

export interface PromoteEmployeeRequest {
    newPositionId: number
    newDepartmentId?: number
    newManagerId?: number
    roles?: string[]
    provisionSystemAccount?: boolean
}

export interface PromoteEmployeeResponse {
    employee: Employee
    accountCreated: boolean
    username?: string
    passwordResetLink?: string
    assignedRoles?: string[]
}

// API Response
export interface ApiResponse<T> {
    status: "SUCCESS" | "ERROR" | "VALIDATION_ERROR"
    statusCode: number
    message: string
    data?: T
    timestamp: string
    requestId?: string
    path?: string
    validationErrors?: Record<string, string[]>
    error?: {
        code: string
        type: string
        message?: string
    }
}

// Employee API service
export const employeeAPI = {
    // 1. Tạo nhân viên mới
    async createEmployee(request: CreateEmployeeRequest): Promise<Employee> {
        try {
            const response = await api.post('/api/employees', request)
            return response.data.data
        } catch (error: any) {
            console.error('Error creating employee:', error)
            throw error
        }
    },

    // 2. Cập nhật nhân viên
    async updateEmployee(id: number, request: UpdateEmployeeRequest): Promise<Employee> {
        try {
            const response = await api.put(`/api/employees/${id}`, request)
            return response.data.data
        } catch (error: any) {
            console.error('Error updating employee:', error)
            throw error
        }
    },

    // 3. Lấy nhân viên theo ID
    async getEmployeeById(id: number): Promise<Employee> {
        try {
            const response = await api.get(`/api/employees/${id}`)
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching employee:', error)
            throw error
        }
    },

    // 4. Lấy nhân viên theo code
    async getEmployeeByCode(code: string): Promise<Employee> {
        try {
            const response = await api.get(`/api/employees/code/${code}`)
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching employee by code:', error)
            throw error
        }
    },

    // 5. Lấy tất cả nhân viên (phân trang)
    async getAllEmployees(
        page: number = 0,
        size: number = 20,
        sortBy: string = 'createdAt',
        sortDirection: 'ASC' | 'DESC' = 'DESC'
    ): Promise<EmployeeListResponse> {
        try {
            const response = await api.get(`/api/employees`, {
                params: {
                    page,
                    size,
                    sortBy,
                    sortDirection
                }
            })
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching employees:', error)
            throw error
        }
    },

    // 6. Xóa nhân viên (soft delete)
    async deleteEmployee(id: number): Promise<void> {
        try {
            await api.delete(`/api/employees/${id}`)
        } catch (error: any) {
            console.error('Error deleting employee:', error)
            throw error
        }
    },

    // 7. Tìm kiếm nhân viên
    async searchEmployees(
        keyword?: string,
        page: number = 0,
        size: number = 20,
        sortBy: string = 'createdAt',
        sortDirection: 'ASC' | 'DESC' = 'DESC'
    ): Promise<EmployeeListResponse> {
        try {
            const params: any = {
                page,
                size,
                sortBy,
                sortDirection
            }
            if (keyword) {
                params.keyword = keyword
            }

            const response = await api.get(`/api/employees/search`, { params })
            return response.data.data
        } catch (error: any) {
            console.error('Error searching employees:', error)
            throw error
        }
    },

    // 8. Lấy nhân viên theo department
    async getEmployeesByDepartment(
        departmentId: number,
        page: number = 0,
        size: number = 20
    ): Promise<EmployeeListResponse> {
        try {
            const response = await api.get(`/api/employees/department/${departmentId}`, {
                params: {
                    page,
                    size
                }
            })
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching employees by department:', error)
            throw error
        }
    },

    // 9. Kích hoạt nhân viên
    async activateEmployee(id: number): Promise<Employee> {
        try {
            // Thử POST trước (thường được hỗ trợ tốt hơn), fallback sang PATCH
            try {
                const response = await api.post(`/api/employees/${id}/activate`, {})
                return response.data.data
            } catch (postError: any) {
                // Fallback to PATCH if POST fails
                const response = await api.patch(`/api/employees/${id}/activate`, {}, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                return response.data.data
            }
        } catch (error: any) {
            console.error('Error activating employee:', error)
            if (error.response) {
                console.error('Response data:', error.response.data)
                console.error('Response status:', error.response.status)
            } else if (error.request) {
                console.error('Request made but no response received:', error.request)
            }
            throw error
        }
    },

    // 10. Vô hiệu hóa nhân viên
    async deactivateEmployee(id: number): Promise<Employee> {
        try {
            // Thử POST trước (thường được hỗ trợ tốt hơn), fallback sang PATCH
            try {
                const response = await api.post(`/api/employees/${id}/deactivate`, {})
                return response.data.data
            } catch (postError: any) {
                // Fallback to PATCH if POST fails
                const response = await api.patch(`/api/employees/${id}/deactivate`, {}, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                return response.data.data
            }
        } catch (error: any) {
            console.error('Error deactivating employee:', error)
            if (error.response) {
                console.error('Response data:', error.response.data)
                console.error('Response status:', error.response.status)
            } else if (error.request) {
                console.error('Request made but no response received:', error.request)
            }
            throw error
        }
    },

    // 11. Lấy thông tin nhân viên hiện tại (self-service)
    async getCurrentEmployee(): Promise<Employee> {
        try {
            const response = await api.get('/api/employees/me')
            return response.data.data
        } catch (error: any) {
            // Chỉ log error nếu không phải lỗi authentication (401/403)
            // Vì đây có thể là expected behavior khi user chưa đăng nhập
            const status = error?.response?.status
            if (status !== 401 && status !== 403) {
                console.error('Error fetching current employee:', error)
            }
            throw error
        }
    },

    // 12. Upload avatar
    async uploadAvatar(id: number, file: File): Promise<Employee> {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post(`/api/employees/${id}/avatar`, formData)
            return response.data.data
        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error?.message ||
                error?.message ||
                'Không thể upload avatar'
            throw new Error(message)
        }
    },

    // 13. Xóa avatar
    async deleteAvatar(id: number): Promise<Employee> {
        try {
            const response = await api.delete(`/api/employees/${id}/avatar`)
            return response.data.data
        } catch (error: any) {
            console.error('Error deleting avatar:', error)
            throw error
        }
    },

    // 14. Cập nhật KPI
    async updateKPI(employeeId: number, request: UpdateKPIRequest): Promise<KPIDataResponse> {
        try {
            const response = await api.put<ApiResponse<KPIDataResponse>>(
                `/api/employees/${employeeId}/kpi`,
                request
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error updating KPI:', error)
            throw error
        }
    },

    // 15. Tính lại KPI
    async calculateKPI(employeeId: number): Promise<number> {
        try {
            const response = await api.post<ApiResponse<number>>(
                `/api/employees/${employeeId}/kpi/calculate`,
                {}
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error calculating KPI:', error)
            throw error
        }
    },

    // 16. Lấy KPI data
    async getKPI(employeeId: number): Promise<KPIDataResponse> {
        try {
            const response = await api.get<ApiResponse<KPIDataResponse>>(
                `/api/employees/${employeeId}/kpi`
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error getting KPI:', error)
            throw error
        }
    },

    // 17. Promote employee & optionally create account
    async promoteEmployee(employeeId: number, request: PromoteEmployeeRequest): Promise<PromoteEmployeeResponse> {
        try {
            const response = await api.post<ApiResponse<PromoteEmployeeResponse>>(
                `/api/employees/${employeeId}/promote`,
                request
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error promoting employee:', error)
            throw error
        }
    },

    // 18. Parse CV from file upload
    async parseCV(file: File): Promise<any> {
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/employees/parse-cv`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to parse CV" }))
                throw new Error(errorData.message || "Failed to parse CV")
            }

            const result = await response.json()
            return result.data
        } catch (error: any) {
            console.error('Error parsing CV:', error)
            throw error
        }
    }
}

