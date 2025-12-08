import api from '../axios'
import { AllowanceType } from './allowance'

// Employee Allowance Types
export interface EmployeeAllowanceResponse {
    id: number
    employeeId: number
    employeeName?: string
    employeeCode?: string
    allowanceId: number
    allowanceName: string
    allowanceType: AllowanceType
    allowanceAmount: number  // Số tiền mặc định từ allowance
    customAmount?: number     // Số tiền tùy chỉnh (nếu có)
    actualAmount: number     // Số tiền thực tế (customAmount hoặc allowanceAmount)
    effectiveDate: string
    endDate?: string
    notes?: string
    createdAt: string
    updatedAt: string
}

export interface CreateEmployeeAllowanceRequest {
    employeeId: number
    allowanceId: number
    customAmount?: number
    effectiveDate: string
    endDate?: string
    notes?: string
}

export interface UpdateEmployeeAllowanceRequest {
    customAmount?: number
    effectiveDate?: string
    endDate?: string
    notes?: string
}

// Helper function để extract data từ API response
const extractData = <T>(response: any): T => {
    return response.data.data
}

// Employee Allowance API service
export const employeeAllowanceAPI = {
    /**
     * Gán phụ cấp cho nhân viên
     * POST /api/employee-allowances
     */
    async createEmployeeAllowance(data: CreateEmployeeAllowanceRequest): Promise<EmployeeAllowanceResponse> {
        try {
            const response = await api.post('/api/employee-allowances', data)
            return extractData<EmployeeAllowanceResponse>(response)
        } catch (error: any) {
            console.error('Error creating employee allowance:', error)
            throw error
        }
    },

    /**
     * Lấy tất cả phụ cấp của một nhân viên
     * GET /api/employee-allowances/employee/{employeeId}
     */
    async getEmployeeAllowances(employeeId: number): Promise<EmployeeAllowanceResponse[]> {
        try {
            const response = await api.get(`/api/employee-allowances/employee/${employeeId}`)
            return extractData<EmployeeAllowanceResponse[]>(response)
        } catch (error: any) {
            console.error('Error getting employee allowances:', error)
            throw error
        }
    },

    /**
     * Lấy phụ cấp theo ID
     * GET /api/employee-allowances/{id}
     */
    async getEmployeeAllowanceById(id: number): Promise<EmployeeAllowanceResponse> {
        try {
            const response = await api.get(`/api/employee-allowances/${id}`)
            return extractData<EmployeeAllowanceResponse>(response)
        } catch (error: any) {
            console.error('Error getting employee allowance:', error)
            throw error
        }
    },

    /**
     * Cập nhật phụ cấp của nhân viên
     * PUT /api/employee-allowances/{id}
     */
    async updateEmployeeAllowance(id: number, data: UpdateEmployeeAllowanceRequest): Promise<EmployeeAllowanceResponse> {
        try {
            const response = await api.put(`/api/employee-allowances/${id}`, data)
            return extractData<EmployeeAllowanceResponse>(response)
        } catch (error: any) {
            console.error('Error updating employee allowance:', error)
            throw error
        }
    },

    /**
     * Xóa phụ cấp của nhân viên (soft delete)
     * DELETE /api/employee-allowances/{id}
     */
    async deleteEmployeeAllowance(id: number): Promise<void> {
        try {
            await api.delete(`/api/employee-allowances/${id}`)
        } catch (error: any) {
            console.error('Error deleting employee allowance:', error)
            throw error
        }
    }
}

