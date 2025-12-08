import api from '../axios'

// Enums
export enum PayFrequency {
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
    BIWEEKLY = "BIWEEKLY"
}

// Salary Types
export interface SalaryResponse {
    id: number
    employeeId: number
    employeeName?: string
    employeeCode?: string
    baseSalary: number
    grossSalary: number
    currency: string
    payFrequency: PayFrequency
    effectiveDate: string
    endDate?: string
    active: boolean
    deleted: boolean
    deletedAt?: string
    createdAt: string
    updatedAt: string
}

export interface CreateSalaryRequest {
    baseSalary: number
    grossSalary: number
    currency?: string
    payFrequency: PayFrequency
    effectiveDate: string
    endDate?: string
    active?: boolean
}

export interface UpdateSalaryRequest {
    baseSalary?: number
    grossSalary?: number
    currency?: string
    payFrequency?: PayFrequency
    effectiveDate?: string
    endDate?: string
    active?: boolean
}

// Helper function để extract data từ API response
const extractData = <T>(response: any): T => {
    return response.data.data
}

// Salary API service
export const salaryAPI = {
    /**
     * Lấy lương hiện tại của nhân viên
     * GET /api/salaries/employee/{id}/current
     */
    async getCurrentSalary(employeeId: number): Promise<SalaryResponse> {
        try {
            const response = await api.get(`/api/salaries/employee/${employeeId}/current`)
            return extractData<SalaryResponse>(response)
        } catch (error: any) {
            console.error('Error getting current salary:', error)
            throw error
        }
    },

    /**
     * Lấy lịch sử lương của nhân viên
     * GET /api/salaries/employee/{id}/history
     */
    async getSalaryHistory(employeeId: number): Promise<SalaryResponse[]> {
        try {
            const response = await api.get(`/api/salaries/employee/${employeeId}/history`)
            return extractData<SalaryResponse[]>(response)
        } catch (error: any) {
            console.error('Error getting salary history:', error)
            throw error
        }
    },

    /**
     * Tạo salary record mới cho nhân viên
     * POST /api/salaries/employee/{id}
     * Tự động deactivate salary cũ nếu có
     */
    async createSalary(employeeId: number, data: CreateSalaryRequest): Promise<SalaryResponse> {
        try {
            const response = await api.post(`/api/salaries/employee/${employeeId}`, data)
            return extractData<SalaryResponse>(response)
        } catch (error: any) {
            console.error('Error creating salary:', error)
            throw error
        }
    },

    /**
     * Cập nhật thông tin salary
     * PUT /api/salaries/{id}
     */
    async updateSalary(id: number, data: UpdateSalaryRequest): Promise<SalaryResponse> {
        try {
            const response = await api.put(`/api/salaries/${id}`, data)
            return extractData<SalaryResponse>(response)
        } catch (error: any) {
            console.error('Error updating salary:', error)
            throw error
        }
    },

    /**
     * Xóa salary (soft delete)
     * DELETE /api/salaries/{id}
     */
    async deleteSalary(id: number): Promise<void> {
        try {
            await api.delete(`/api/salaries/${id}`)
        } catch (error: any) {
            console.error('Error deleting salary:', error)
            throw error
        }
    }
}

