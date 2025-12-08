import api from '../axios'

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    LATE = 'LATE',
    ABSENT = 'ABSENT',
    HALF_DAY = 'HALF_DAY',
    EARLY_DEPARTURE = 'EARLY_DEPARTURE',
    OVERTIME = 'OVERTIME'
}

export interface AttendanceRecord {
    id: number
    employeeId: number
    employeeName: string
    employeeCode: string
    attendanceDate: string
    checkInTime: string | null
    checkOutTime: string | null
    status: AttendanceStatus
    workHours: string | null
    overtimeHours: string | null
    notes: string | null
    workShiftId: number | null
    workShiftName: string | null
    departmentName?: string | null
}

export interface PaginatedResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    pageable?: {
        pageNumber: number
        pageSize: number
    }
}

export interface AttendanceHistoryParams {
    employeeId: number
    startDate: string
    endDate: string
    page?: number
    size?: number
}

export interface AttendanceReportParams {
    startDate: string
    endDate: string
    departmentId?: number
    page?: number
    size?: number
}

export interface CheckInRequest {
    notes?: string
    location?: string
}

export interface CheckOutRequest {
    notes?: string
    location?: string
}

export interface ManualAttendanceRequest {
    employeeId: number
    attendanceDate: string
    checkInTime?: string
    checkOutTime?: string
    status: AttendanceStatus
    notes?: string
    workShiftId?: number
}

export type UpdateAttendanceRequest = ManualAttendanceRequest

export interface AttendanceSummaryResponse {
    employeeId: number
    employeeName: string
    employeeCode: string
    year: number
    month: number
    totalDays: number
    presentDays: number
    lateDays: number
    absentDays: number
    halfDays: number
    totalWorkHours: number
    totalOvertimeHours: number
}

export interface WorkShiftResponse {
    id: number
    name: string
    startTime: string
    endTime: string
    breakDuration: string
    active: boolean
    createdAt: string
    updatedAt: string
}

export type WorkScheduleStatus = "SCHEDULED" | "COMPLETED" | "ABSENT" | "CANCELLED"

export interface WorkScheduleResponse {
    id: number
    employeeId: number
    employeeCode?: string
    employeeName?: string
    departmentId?: number
    departmentName?: string
    workShiftId: number
    workShiftName?: string
    scheduleDate: string
    status: WorkScheduleStatus
    notes?: string
    createdAt: string
    updatedAt: string
}

export interface WorkScheduleRequest {
    employeeId?: number
    workShiftId?: number
    scheduleDate?: string
    status?: WorkScheduleStatus
    notes?: string
}

export interface WorkScheduleFilter {
    startDate?: string
    endDate?: string
    departmentId?: number
    employeeId?: number
    page?: number
    size?: number
}

const extractData = <T>(response: any): T => response.data?.data ?? response.data

export const attendanceAPI = {
    async checkIn(employeeId: number, payload: CheckInRequest): Promise<AttendanceRecord> {
        const response = await api.post(`/api/attendance/check-in/${employeeId}`, payload)
        return extractData<AttendanceRecord>(response)
    },

    async checkOut(employeeId: number, payload: CheckOutRequest): Promise<AttendanceRecord> {
        const response = await api.post(`/api/attendance/check-out/${employeeId}`, payload)
        return extractData<AttendanceRecord>(response)
    },

    async createManualAttendance(payload: ManualAttendanceRequest): Promise<AttendanceRecord> {
        const response = await api.post('/api/attendance', payload)
        return extractData<AttendanceRecord>(response)
    },

    async getAttendanceById(id: number): Promise<AttendanceRecord> {
        const response = await api.get(`/api/attendance/${id}`)
        return extractData<AttendanceRecord>(response)
    },

    async getAttendanceByDate(employeeId: number, date: string): Promise<AttendanceRecord | null> {
        const response = await api.get(`/api/attendance/employee/${employeeId}/date/${date}`)
        return extractData<AttendanceRecord | null>(response)
    },

    async getAttendanceHistory(params: AttendanceHistoryParams): Promise<PaginatedResponse<AttendanceRecord>> {
        const { employeeId, startDate, endDate, page = 0, size = 20 } = params
        const response = await api.get(`/api/attendance/employee/${employeeId}/history`, {
            params: { startDate, endDate, page, size }
        })
        return extractData<PaginatedResponse<AttendanceRecord>>(response)
    },

    async getAttendanceReport(params: AttendanceReportParams): Promise<PaginatedResponse<AttendanceRecord>> {
        const { startDate, endDate, departmentId, page = 0, size = 20 } = params
        const response = await api.get('/api/attendance/report', {
            params: { startDate, endDate, departmentId, page, size }
        })
        return extractData<PaginatedResponse<AttendanceRecord>>(response)
    },

    async getAttendanceSummary(employeeId: number, month: number, year: number): Promise<AttendanceSummaryResponse> {
        const response = await api.get(`/api/attendance/employee/${employeeId}/summary`, {
            params: { month, year }
        })
        return extractData<AttendanceSummaryResponse>(response)
    },

    async updateAttendance(id: number, payload: UpdateAttendanceRequest): Promise<AttendanceRecord> {
        const response = await api.put(`/api/attendance/${id}`, payload)
        return extractData<AttendanceRecord>(response)
    },

    async deleteAttendance(id: number): Promise<void> {
        await api.delete(`/api/attendance/${id}`)
    },

    async getWorkShifts(): Promise<WorkShiftResponse[]> {
        const response = await api.get('/api/work-shifts')
        return extractData<WorkShiftResponse[]>(response)
    },

    async getWorkShiftById(id: number): Promise<WorkShiftResponse> {
        const response = await api.get(`/api/work-shifts/${id}`)
        return extractData<WorkShiftResponse>(response)
    },

    async getWorkShiftByName(name: string): Promise<WorkShiftResponse> {
        const response = await api.get(`/api/work-shifts/name/${encodeURIComponent(name)}`)
        return extractData<WorkShiftResponse>(response)
  },

  async createWorkSchedule(payload: WorkScheduleRequest): Promise<WorkScheduleResponse> {
    const response = await api.post(`/api/work-schedules`, payload)
    return extractData<WorkScheduleResponse>(response)
  },

  async updateWorkSchedule(id: number, payload: WorkScheduleRequest): Promise<WorkScheduleResponse> {
    const response = await api.put(`/api/work-schedules/${id}`, payload)
    return extractData<WorkScheduleResponse>(response)
  },

  async deleteWorkSchedule(id: number): Promise<void> {
    await api.delete(`/api/work-schedules/${id}`)
  },

  async getWorkSchedules(params: WorkScheduleFilter = {}): Promise<PaginatedResponse<WorkScheduleResponse>> {
    const response = await api.get(`/api/work-schedules`, { params })
    return extractData<PaginatedResponse<WorkScheduleResponse>>(response)
  },

  async getEmployeeMonthlySchedule(employeeId: number, month: number, year: number): Promise<WorkScheduleResponse[]> {
    const response = await api.get(`/api/work-schedules/employee/${employeeId}`, {
      params: { month, year },
    })
    return extractData<WorkScheduleResponse[]>(response)
  },

  async exportAttendanceReport(params: { startDate: string; endDate: string; departmentId?: number }, format: "csv" | "excel" = "csv"): Promise<Blob> {
    const response = await api.get(`/api/attendance/export`, {
      params: { ...params, format },
      responseType: "blob",
    })
    return response.data
    }
}
