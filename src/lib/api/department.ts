import api from '../axios'

// Type definitions for department data - Updated for microservices
export interface Department {
    id: number
    name: string
    code: string
    description?: string
    managerId?: number
    parentDepartmentId?: number
    active: boolean
    createdAt: string
    updatedAt: string
    subDepartments?: Department[] | null
    manager?: any // Manager info when expanded
    parentDepartment?: Department | null // Parent department when expanded
    employees?: any[] | null // Employee list when expanded
}

export interface DepartmentCreateRequest {
    name: string
    code: string
    description?: string
    managerId?: number
    parentDepartmentId?: number
    active?: boolean
}

export interface DepartmentUpdateRequest {
    name?: string
    description?: string
    managerId?: number | null  // Allow null to remove manager
    parentDepartmentId?: number | null  // Allow null to remove parent
    active?: boolean
}

export interface DepartmentSearchParams {
    keyword?: string
    activeOnly?: boolean
    page?: number
    size?: number
}

export interface DepartmentEmployee {
    id: number
    employeeCode: string
    firstName: string
    lastName: string
    email: string
    phone: string
    status: string
    departmentName: string
    positionTitle: string
    managerName?: string
}

export interface DepartmentTransferRequest {
    employeeId: number
    newDepartmentId: number
    effectiveDate: string
}

export interface PaginatedResponse<T> {
    content: T[]
    pageable: {
        pageNumber: number
        pageSize: number
        sort: {
            sorted: boolean
            unsorted: boolean
        }
    }
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
    numberOfElements: number
}

// Microservices API Response Format
export interface ApiResponse<T> {
    status: string
    statusCode: number
    message: string
    data: T
    timestamp: string
    requestId?: string
    path?: string
}

// Department API service - Updated for microservices
export const departmentAPI = {
    // 1. Tạo phòng ban mới
    async createDepartment(departmentData: DepartmentCreateRequest): Promise<Department> {
        try {
            const response = await api.post('/api/departments', departmentData)
            return response.data.data
        } catch (error) {
            console.error('Error creating department:', error)
            throw error
        }
    },

    // 2. Lấy danh sách phòng ban (active)
    async getDepartments(): Promise<Department[]> {
        try {
            const response = await api.get('/api/departments')
            return response.data.data
        } catch (error) {
            console.error('Error fetching departments:', error)
            throw error
        }
    },

    // 3. Lấy root departments
    async getRootDepartments(): Promise<Department[]> {
        try {
            const response = await api.get('/api/departments/root')
            return response.data.data
        } catch (error) {
            console.error('Error fetching root departments:', error)
            throw error
        }
    },

    // 4. Lấy departments theo parent
    async getDepartmentsByParent(parentId: number): Promise<Department[]> {
        try {
            const response = await api.get(`/api/departments/parent/${parentId}`)
            return response.data.data
        } catch (error) {
            console.error('Error fetching departments by parent:', error)
            throw error
        }
    },

    // 5. Lấy chi tiết phòng ban theo ID
    async getDepartmentById(id: number): Promise<Department> {
        try {
            const response = await api.get(`/api/departments/${id}`)
            return response.data.data
        } catch (error) {
            console.error('Error fetching department by ID:', error)
            throw error
        }
    },

    // 6. Lấy phòng ban theo code
    async getDepartmentByCode(code: string): Promise<Department> {
        try {
            const response = await api.get(`/api/departments/code/${code}`)
            return response.data.data
        } catch (error) {
            console.error('Error fetching department by code:', error)
            throw error
        }
    },

    // 7. Cập nhật phòng ban
    async updateDepartment(id: number, updateData: DepartmentUpdateRequest): Promise<Department> {
        try {
            const response = await api.put(`/api/departments/${id}`, updateData)
            return response.data.data
        } catch (error) {
            console.error('Error updating department:', error)
            throw error
        }
    },

    // 8. Xóa phòng ban (soft delete)
    async deleteDepartment(id: number): Promise<void> {
        try {
            await api.delete(`/api/departments/${id}`)
        } catch (error) {
            console.error('Error deleting department:', error)
            throw error
        }
    },

    // 9. Lấy nhân viên trong phòng ban (nếu có employee service integration)
    async getDepartmentEmployees(id: number, params: {
        includeSub?: boolean
        page?: number
        size?: number
    } = {}): Promise<PaginatedResponse<DepartmentEmployee>> {
        try {
            const queryParams = new URLSearchParams()
            if (params.includeSub !== undefined) queryParams.append('includeSub', params.includeSub.toString())
            if (params.page !== undefined) queryParams.append('page', params.page.toString())
            if (params.size !== undefined) queryParams.append('size', params.size.toString())

            const queryString = queryParams.toString()
            const response = await api.get(`/api/departments/${id}/employees${queryString ? `?${queryString}` : ''}`)
            return response.data.data
        } catch (error) {
            console.error('Error fetching department employees:', error)
            throw error
        }
    },

    // 10. Đếm số nhân viên trong phòng ban
    async getDepartmentEmployeeCount(id: number, includeSub: boolean = true): Promise<number> {
        try {
            const response = await api.get(`/api/departments/${id}/employees/count?includeSub=${includeSub}`)
            return response.data.data
        } catch (error) {
            console.error('Error fetching department employee count:', error)
            throw error
        }
    },

    // 11. Chuyển nhân viên sang phòng ban khác (nếu có employee service integration)
    async transferEmployee(transferData: DepartmentTransferRequest): Promise<void> {
        try {
            const queryParams = new URLSearchParams()
            queryParams.append('employeeId', transferData.employeeId.toString())
            queryParams.append('newDepartmentId', transferData.newDepartmentId.toString())
            queryParams.append('effectiveDate', transferData.effectiveDate)

            const queryString = queryParams.toString()
            await api.post(`/api/departments/transfer?${queryString}`)
        } catch (error) {
            console.error('Error transferring employee:', error)
            throw error
        }
    },

    // 12. Gán trưởng phòng
    async assignManager(id: number, managerId: number): Promise<Department> {
        try {
            const response = await api.put(`/api/departments/${id}/manager`, { managerId })
            return response.data.data
        } catch (error) {
            console.error('Error assigning manager:', error)
            throw error
        }
    },

    // 13. Xóa trưởng phòng
    async removeManager(id: number): Promise<Department> {
        try {
            const response = await api.delete(`/api/departments/${id}/manager`)
            return response.data.data
        } catch (error) {
            console.error('Error removing manager:', error)
            throw error
        }
    },

    // 14. Kích hoạt department
    async activateDepartment(id: number): Promise<Department> {
        try {
            const response = await api.patch(`/api/departments/${id}/activate`)
            return response.data.data
        } catch (error) {
            console.error('Error activating department:', error)
            throw error
        }
    },

    // 15. Vô hiệu hóa department
    async deactivateDepartment(id: number): Promise<Department> {
        try {
            const response = await api.patch(`/api/departments/${id}/deactivate`)
            return response.data.data
        } catch (error) {
            console.error('Error deactivating department:', error)
            throw error
        }
    },

    // 16. Lấy cấu trúc cây department (Hierarchy Tree)
    async getDepartmentTree(): Promise<Department[]> {
        try {
            const response = await api.get('/api/departments/tree')
            return response.data.data
        } catch (error) {
            console.error('Error fetching department tree:', error)
            throw error
        }
    },

    // 17. Tìm kiếm departments (API endpoint)
    async searchDepartmentsAPI(keyword?: string): Promise<Department[]> {
        try {
            const url = keyword
                ? `/api/departments/search?keyword=${encodeURIComponent(keyword)}`
                : '/api/departments/search'
            const response = await api.get(url)
            return response.data.data
        } catch (error) {
            console.error('Error searching departments:', error)
            throw error
        }
    },

    // 18. Lấy thống kê department
    async getDepartmentStatistics(id: number): Promise<{
        departmentId: number
        departmentName: string
        departmentCode: string
        totalEmployees?: number
        activeEmployees?: number
        inactiveEmployees?: number
        totalPositions: number
        activePositions: number
        subDepartmentsCount: number
        hasManager: boolean
        managerId?: number
    }> {
        try {
            const response = await api.get(`/api/departments/${id}/statistics`)
            return response.data.data
        } catch (error) {
            console.error('Error fetching department statistics:', error)
            throw error
        }
    },

    // Legacy methods for backward compatibility
    async getDepartmentsPaginated(params: {
        activeOnly?: boolean
        page?: number
        size?: number
        sort?: string
    } = {}): Promise<PaginatedResponse<Department>> {
        // For backward compatibility, just return departments as paginated response
        try {
            const departments = await this.getDepartments()
            return {
                content: departments,
                pageable: {
                    pageNumber: 0,
                    pageSize: departments.length,
                    sort: {
                        sorted: false,
                        unsorted: true
                    }
                },
                totalElements: departments.length,
                totalPages: 1,
                first: true,
                last: true,
                numberOfElements: departments.length
            }
        } catch (error) {
            console.error('Error fetching departments paginated:', error)
            throw error
        }
    },

    async searchDepartments(params: DepartmentSearchParams): Promise<PaginatedResponse<Department>> {
        // Use API endpoint if keyword is provided, otherwise use getDepartments
        try {
            let departments: Department[]
            if (params.keyword) {
                departments = await this.searchDepartmentsAPI(params.keyword)
            } else {
                departments = await this.getDepartments()
            }

            // Filter by activeOnly if specified
            if (params.activeOnly !== undefined) {
                departments = departments.filter(dept => dept.active === params.activeOnly)
            }

            return {
                content: departments,
                pageable: {
                    pageNumber: params.page || 0,
                    pageSize: params.size || departments.length,
                    sort: {
                        sorted: false,
                        unsorted: true
                    }
                },
                totalElements: departments.length,
                totalPages: 1,
                first: true,
                last: true,
                numberOfElements: departments.length
            }
        } catch (error) {
            console.error('Error searching departments:', error)
            throw error
        }
    },

    // Legacy methods for backward compatibility - keep for compatibility
}
