import api from '../axios'

// ==================== ENUMS ====================

export enum LeaveStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    WITHDRAWN = "WITHDRAWN"
}

// ==================== INTERFACES ====================

// Leave Request
export interface LeaveRequest {
    id: number
    employeeId: number
    employeeName?: string
    employeeCode?: string
    leaveTypeId: number
    leaveTypeName?: string
    leaveTypeCode?: string
    startDate: string // ISO date format: "2025-12-01"
    endDate: string // ISO date format: "2025-12-03"
    totalDays: number
    reason?: string
    status: LeaveStatus
    approverId?: number
    approverName?: string
    approverComments?: string
    rejectionReason?: string // Lý do từ chối
    approvedAt?: string // ISO datetime
    cancelledAt?: string // ISO datetime - Thời gian hủy đơn
    createdAt: string // ISO datetime
    updatedAt: string // ISO datetime
}

// Create Leave Request
export interface CreateLeaveRequest {
    leaveTypeId: number
    startDate: string // ISO date format
    endDate: string // ISO date format
    reason?: string // Max 1000 characters
}

// Update Leave Request
export interface UpdateLeaveRequest {
    leaveTypeId?: number
    startDate?: string
    endDate?: string
    reason?: string
}

// Approve Leave Request
export interface ApproveLeaveRequest {
    action: "APPROVE" | "REJECT"
    comments?: string // Max 1000 characters
}

// Leave Type
export interface LeaveType {
    id: number
    name: string
    code: string
    description?: string
    maxDaysPerYear: number
    requiresApproval: boolean
    isPaid: boolean
    carryForward: boolean
    active: boolean
    createdAt: string // ISO datetime
    updatedAt: string // ISO datetime
}

// Leave Balance
export interface LeaveBalance {
    id: number
    employeeId: number
    employeeName?: string
    employeeCode?: string
    leaveTypeId: number
    leaveTypeName?: string
    leaveTypeCode?: string
    totalEntitlement: number
    usedDays: number
    remainingDays: number
    carryForwardDays: number
    year: number
}

// Paginated Response
export interface PaginatedLeaveResponse<T> {
    content: T[]
    pageable: {
        pageNumber: number
        pageSize: number
        sort: {
            sorted: boolean
            unsorted: boolean
            empty: boolean
        }
    }
    totalElements: number
    totalPages: number
    last: boolean
    first: boolean
    numberOfElements: number
    size: number
    number: number
    sort: {
        sorted: boolean
        unsorted: boolean
        empty: boolean
    }
    empty: boolean
}

// API Response Wrapper
export interface LeaveApiResponse<T> {
    status: "SUCCESS" | "ERROR"
    statusCode: number
    message: string
    data?: T
    error?: {
        code: string
        message: string
        type: string
        details?: string
    }
    timestamp: string
    requestId: string
    path: string
}

// Search Parameters
export interface LeaveRequestSearchParams {
    employeeId?: number
    status?: LeaveStatus
    page?: number
    size?: number
}

// ==================== API SERVICE ====================

export const leaveAPI = {
    // ========== Leave Requests ==========
    
    // 1. Tạo đơn xin nghỉ phép
    async createLeaveRequest(employeeId: number, request: CreateLeaveRequest): Promise<LeaveRequest> {
        try {
            const response = await api.post<LeaveApiResponse<LeaveRequest>>(
                `/api/leave-requests/employee/${employeeId}`,
                request
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error creating leave request:', error)
            throw error
        }
    },

    // 2. Phê duyệt đơn nghỉ phép
    async approveLeaveRequest(
        leaveRequestId: number,
        approverId: number,
        request: ApproveLeaveRequest
    ): Promise<LeaveRequest> {
        try {
            const response = await api.post<LeaveApiResponse<LeaveRequest>>(
                `/api/leave-requests/${leaveRequestId}/approve?approverId=${approverId}`,
                request
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error approving leave request:', error)
            throw error
        }
    },

    // 3. Từ chối đơn nghỉ phép
    async rejectLeaveRequest(
        leaveRequestId: number,
        approverId: number,
        reason: string
    ): Promise<LeaveRequest> {
        try {
            const response = await api.post<LeaveApiResponse<LeaveRequest>>(
                `/api/leave-requests/${leaveRequestId}/reject?approverId=${approverId}&reason=${encodeURIComponent(reason)}`,
                {}
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error rejecting leave request:', error)
            throw error
        }
    },

    // 4. Hủy đơn nghỉ phép
    async cancelLeaveRequest(leaveRequestId: number, employeeId: number): Promise<LeaveRequest> {
        try {
            const response = await api.post<LeaveApiResponse<LeaveRequest>>(
                `/api/leave-requests/${leaveRequestId}/cancel?employeeId=${employeeId}`,
                {}
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error cancelling leave request:', error)
            throw error
        }
    },

    // 5. Lấy thông tin đơn nghỉ phép theo ID
    async getLeaveRequestById(id: number): Promise<LeaveRequest> {
        try {
            const response = await api.get<LeaveApiResponse<LeaveRequest>>(
                `/api/leave-requests/${id}`
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching leave request:', error)
            throw error
        }
    },

    // 6. Lấy danh sách đơn nghỉ phép của nhân viên
    async getEmployeeLeaveRequests(
        employeeId: number,
        params?: {
            status?: LeaveStatus
            page?: number
            size?: number
        }
    ): Promise<PaginatedLeaveResponse<LeaveRequest>> {
        try {
            const queryParams = new URLSearchParams()
            if (params?.status) queryParams.append('status', params.status)
            if (params?.page !== undefined) queryParams.append('page', params.page.toString())
            if (params?.size !== undefined) queryParams.append('size', params.size.toString())

            const response = await api.get<LeaveApiResponse<PaginatedLeaveResponse<LeaveRequest>>>(
                `/api/leave-requests/employee/${employeeId}?${queryParams.toString()}`
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching employee leave requests:', error)
            throw error
        }
    },

    // 7. Lấy danh sách đơn nghỉ phép cần phê duyệt
    async getPendingLeaveRequests(
        managerId: number,
        page: number = 0,
        size: number = 20
    ): Promise<PaginatedLeaveResponse<LeaveRequest>> {
        try {
            const response = await api.get<LeaveApiResponse<PaginatedLeaveResponse<LeaveRequest>>>(
                `/api/leave-requests/pending?managerId=${managerId}&page=${page}&size=${size}`
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching pending leave requests:', error)
            throw error
        }
    },

    // 8. Lấy tất cả đơn nghỉ phép (dành cho admin/HR)
    async getAllLeaveRequests(
        params?: {
            status?: LeaveStatus
            page?: number
            size?: number
        }
    ): Promise<PaginatedLeaveResponse<LeaveRequest>> {
        try {
            const queryParams = new URLSearchParams()
            if (params?.status) queryParams.append('status', params.status)
            if (params?.page !== undefined) queryParams.append('page', params.page.toString())
            if (params?.size !== undefined) queryParams.append('size', params.size.toString())

            const response = await api.get<LeaveApiResponse<PaginatedLeaveResponse<LeaveRequest>>>(
                `/api/leave-requests?${queryParams.toString()}`
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching all leave requests:', error)
            throw error
        }
    },

    // 9. Lấy số dư nghỉ phép của nhân viên
    async getEmployeeLeaveBalance(
        employeeId: number,
        year: number = new Date().getFullYear()
    ): Promise<LeaveBalance[]> {
        try {
            const response = await api.get<LeaveApiResponse<LeaveBalance[]>>(
                `/api/leave-requests/employee/${employeeId}/balance?year=${year}`
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching leave balance:', error)
            throw error
        }
    },

    // 10. Cập nhật đơn nghỉ phép
    async updateLeaveRequest(id: number, request: UpdateLeaveRequest): Promise<LeaveRequest> {
        try {
            const response = await api.put<LeaveApiResponse<LeaveRequest>>(
                `/api/leave-requests/${id}`,
                request
            )
            return response.data.data!
        } catch (error: any) {
            console.error('Error updating leave request:', error)
            throw error
        }
    },

    // 11. Xóa đơn nghỉ phép (soft delete)
    async deleteLeaveRequest(id: number): Promise<void> {
        try {
            await api.delete(`/api/leave-requests/${id}`)
        } catch (error: any) {
            console.error('Error deleting leave request:', error)
            throw error
        }
    },

    // ========== Leave Types ==========

    // 12. Lấy tất cả leave types (active)
    async getAllLeaveTypes(): Promise<LeaveType[]> {
        try {
            const response = await api.get<LeaveApiResponse<LeaveType[]>>('/api/leave-types')
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching leave types:', error)
            throw error
        }
    },

    // 13. Lấy leave type theo ID
    async getLeaveTypeById(id: number): Promise<LeaveType> {
        try {
            const response = await api.get<LeaveApiResponse<LeaveType>>(`/api/leave-types/${id}`)
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching leave type:', error)
            throw error
        }
    },

    // 14. Lấy leave type theo code
    async getLeaveTypeByCode(code: string): Promise<LeaveType> {
        try {
            const response = await api.get<LeaveApiResponse<LeaveType>>(`/api/leave-types/code/${code}`)
            return response.data.data!
        } catch (error: any) {
            console.error('Error fetching leave type by code:', error)
            throw error
        }
    }
}

