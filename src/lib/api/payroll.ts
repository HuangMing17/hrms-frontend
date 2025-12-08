import api from '../axios'
import { PayFrequency } from './salary'

// Deduction Detail Types
export interface DeductionDetail {
    name: string
    description?: string
    amount: number
    type: 'FIXED' | 'PERCENTAGE' | 'VARIABLE'
    mandatory: boolean
}

// Payroll Types
export interface PayrollResponse {
    id: number
    employeeId: number
    employeeName?: string
    employeeCode?: string
    payPeriodMonth: number
    payPeriodYear: number
    payDate?: string
    baseSalary: number
    totalAllowances: number
    overtimePay: number
    totalDeductions: number
    grossPay: number
    netPay: number
    status: PayrollStatus
    payslipPath?: string
    processedAt?: string
    createdAt: string
    updatedAt: string
    deductionDetails?: DeductionDetail[]
}

// Preview payroll (lương tạm tính trong tháng)
export interface PayrollPreviewResponse {
    employeeId: number
    employeeCode?: string
    employeeName?: string
    payPeriodMonth: number
    payPeriodYear: number
    baseSalary: number
    totalAllowances: number
    totalDeductions: number
    overtimePay: number
    grossPay: number
    netPay: number
    status: string // DRAFT, CALCULATED, ...
    deductionDetails?: DeductionDetail[]
}

export enum PayrollStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    PROCESSED = "PROCESSED",
    PAID = "PAID",
    CANCELLED = "CANCELLED"
}

export interface CalculatePayrollRequest {
    payPeriodMonth: number
    payPeriodYear: number
    employeeIds?: number[]
    departmentId?: number
    includeOvertime?: boolean
    includeAllowances?: boolean
    includeDeductions?: boolean
}

export interface PayrollSummaryResponse {
    payPeriodMonth: number
    payPeriodYear: number
    totalEmployees: number
    totalBaseSalary: number
    totalOvertimePay: number
    totalAllowances: number
    totalDeductions: number
    totalGrossPay: number
    totalNetPay: number
    payrolls: PayrollResponse[]
}

export interface PayrollHistoryParams {
    startDate?: string
    endDate?: string
    page?: number
    size?: number
    sortBy?: string
    sortDirection?: 'ASC' | 'DESC'
}

export interface PayrollQueryParams {
    month?: number
    year?: number
    departmentId?: number
    status?: PayrollStatus
    page?: number
    size?: number
    sortBy?: string
    sortDirection?: 'ASC' | 'DESC'
}

export interface PaginatedResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
    empty: boolean
}

// Helper function để extract data từ API response
const extractData = <T>(response: any): T => {
    return response.data.data
}

// Payroll API service
export const payrollAPI = {
    /**
     * Lương tạm tính (preview) cho tháng/năm
     * GET /api/payrolls/preview
     */
    async previewPayroll(
        month: number,
        year: number,
        departmentId?: number
    ): Promise<PayrollPreviewResponse[]> {
        try {
            const params: any = { month, year }
            if (departmentId) {
                params.departmentId = departmentId
            }
            const response = await api.get('/api/payrolls/preview', { params })
            return extractData<PayrollPreviewResponse[]>(response)
        } catch (error: any) {
            console.error('Error previewing payroll:', error)
            throw error
        }
    },

    /**
     * Tính lương cho nhân viên hoặc phòng ban
     * POST /api/payrolls/calculate
     */
    async calculatePayroll(data: CalculatePayrollRequest): Promise<PayrollResponse[]> {
        try {
            const response = await api.post('/api/payrolls/calculate', data)
            return extractData<PayrollResponse[]>(response)
        } catch (error: any) {
            console.error('Error calculating payroll:', error)
            throw error
        }
    },

    /**
     * Lấy thông tin bảng lương theo ID
     * GET /api/payrolls/{id}
     */
    async getPayroll(id: number): Promise<PayrollResponse> {
        try {
            const response = await api.get(`/api/payrolls/${id}`)
            return extractData<PayrollResponse>(response)
        } catch (error: any) {
            console.error('Error getting payroll:', error)
            throw error
        }
    },

    /**
     * Lấy bảng lương của nhân viên theo tháng/năm
     * GET /api/payrolls/employee/{id}?month=X&year=Y
     */
    async getEmployeePayroll(employeeId: number, month: number, year: number): Promise<PayrollResponse> {
        try {
            const response = await api.get(`/api/payrolls/employee/${employeeId}`, {
                params: { month, year }
            })
            return extractData<PayrollResponse>(response)
        } catch (error: any) {
            console.error('Error getting employee payroll:', error)
            throw error
        }
    },

    /**
     * Lấy lịch sử lương của nhân viên
     * GET /api/payrolls/employee/{id}/history
     */
    async getPayrollHistory(
        employeeId: number,
        params: PayrollHistoryParams = {}
    ): Promise<PaginatedResponse<PayrollResponse>> {
        try {
            const response = await api.get(`/api/payrolls/employee/${employeeId}/history`, { params })
            return extractData<PaginatedResponse<PayrollResponse>>(response)
        } catch (error: any) {
            console.error('Error getting payroll history:', error)
            throw error
        }
    },

    /**
     * Lấy tất cả bảng lương (có phân trang)
     * GET /api/payrolls
     */
    async getAllPayrolls(params: PayrollQueryParams = {}): Promise<PaginatedResponse<PayrollResponse>> {
        try {
            const response = await api.get('/api/payrolls', { params })
            return extractData<PaginatedResponse<PayrollResponse>>(response)
        } catch (error: any) {
            console.error('Error getting all payrolls:', error)
            throw error
        }
    },

    /**
     * Lấy báo cáo tổng hợp lương
     * GET /api/payrolls/summary?month=X&year=Y&departmentId=X
     */
    async getPayrollSummary(
        month: number,
        year: number,
        departmentId?: number
    ): Promise<PayrollSummaryResponse> {
        try {
            const params: any = { month, year }
            if (departmentId) {
                params.departmentId = departmentId
            }
            const response = await api.get('/api/payrolls/summary', { params })
            return extractData<PayrollSummaryResponse>(response)
        } catch (error: any) {
            console.error('Error getting payroll summary:', error)
            throw error
        }
    },

    /**
     * Phê duyệt bảng lương
     * POST /api/payrolls/{id}/approve
     */
    async approvePayroll(id: number, approverId: number): Promise<PayrollResponse> {
        try {
            const response = await api.post(`/api/payrolls/${id}/approve?approverId=${approverId}`)
            return extractData<PayrollResponse>(response)
        } catch (error: any) {
            console.error('Error approving payroll:', error)
            throw error
        }
    },

    /**
     * Hoàn tất thanh toán bảng lương
     * POST /api/payrolls/{id}/complete
     */
    async completePayroll(id: number): Promise<PayrollResponse> {
        try {
            const response = await api.post(`/api/payrolls/${id}/complete`)
            return extractData<PayrollResponse>(response)
        } catch (error: any) {
            console.error('Error completing payroll:', error)
            throw error
        }
    },

    /**
     * Cập nhật bảng lương
     * PUT /api/payrolls/{id}
     */
    async updatePayroll(id: number, data: CalculatePayrollRequest): Promise<PayrollResponse> {
        try {
            const response = await api.put(`/api/payrolls/${id}`, data)
            return extractData<PayrollResponse>(response)
        } catch (error: any) {
            console.error('Error updating payroll:', error)
            throw error
        }
    },

    /**
     * Xóa bảng lương (soft delete)
     * DELETE /api/payrolls/{id}
     */
    async deletePayroll(id: number): Promise<void> {
        try {
            await api.delete(`/api/payrolls/${id}`)
        } catch (error: any) {
            console.error('Error deleting payroll:', error)
            throw error
        }
    },

    /**
     * Gửi email payslip cho một payroll
     * POST /api/payrolls/{id}/send-email
     */
    async sendPayslipEmail(
        payrollId: number,
        data?: {
            customSubject?: string
            customMessage?: string
            sentBy?: number
        }
    ): Promise<any> {
        try {
            const response = await api.post(`/api/payrolls/${payrollId}/send-email`, data || {})
            return extractData<any>(response)
        } catch (error: any) {
            console.error('Error sending payslip email:', error)
            throw error
        }
    },

    /**
     * Gửi email payslip hàng loạt
     * POST /api/payrolls/send-bulk-email
     */
    async sendBulkPayslipEmails(data: {
        payrollIds: number[]
        customSubject?: string
        customMessage?: string
        sentBy?: number
    }): Promise<any> {
        try {
            const response = await api.post('/api/payrolls/send-bulk-email', data)
            return extractData<any>(response)
        } catch (error: any) {
            console.error('Error sending bulk payslip emails:', error)
            throw error
        }
    },

    /**
     * Lấy báo cáo bảng lương theo phòng ban
     * GET /api/payrolls/department/{id}/report
     */
    async getDepartmentPayrollReport(
        departmentId: number,
        month: number,
        year: number,
        page: number = 0,
        size: number = 10
    ): Promise<PaginatedResponse<PayrollResponse>> {
        try {
            const response = await api.get(`/api/payrolls/department/${departmentId}/report`, {
                params: { month, year, page, size }
            })
            return extractData<PaginatedResponse<PayrollResponse>>(response)
        } catch (error: any) {
            console.error('Error getting department payroll report:', error)
            throw error
        }
    }
}

