import api from '../axios'

// ==================== INTERFACES ====================

export interface AuditLogResponse {
    id: number
    action: string
    entity: string
    entityId: number
    userId: number
    username: string
    ipAddress: string
    userAgent: string
    requestId: string
    details: string
    occurredAt: string // ISO datetime
    createdAt: string // ISO datetime
    updatedAt: string // ISO datetime
}

export interface CreateAuditLogRequest {
    action: string
    entity?: string
    entityId?: number
    userId?: number
    username?: string
    ipAddress?: string
    userAgent?: string
    requestId?: string
    details?: string
}

export interface SearchParams {
    action?: string
    userId?: number
    entity?: string
    entityId?: number
    from?: string // ISO datetime
    to?: string // ISO datetime
    page?: number
    size?: number
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
}

export interface ApiResponse<T> {
    status: string
    statusCode: number
    message: string
    data: T
    requestId?: string
    path?: string
}

// ==================== API FUNCTIONS ====================

export const auditAPI = {
    /**
     * Create a new audit log
     * POST /api/audit-logs
     */
    async create(request: CreateAuditLogRequest): Promise<AuditLogResponse> {
        const response = await api.post<ApiResponse<AuditLogResponse>>('/api/audit-logs', request)
        return response.data.data
    },

    /**
     * Get audit log by ID
     * GET /api/audit-logs/{id}
     */
    async getById(id: number): Promise<AuditLogResponse> {
        const response = await api.get<ApiResponse<AuditLogResponse>>(`/api/audit-logs/${id}`)
        return response.data.data
    },

    /**
     * Get audit logs by user ID
     * GET /api/audit-logs/user/{userId}?page=0&size=20
     */
    async getByUser(userId: number, page: number = 0, size: number = 20): Promise<PageResponse<AuditLogResponse>> {
        const response = await api.get<ApiResponse<PageResponse<AuditLogResponse>>>(
            `/api/audit-logs/user/${userId}`,
            {
                params: { page, size }
            }
        )
        return response.data.data
    },

    /**
     * Get audit logs by entity
     * GET /api/audit-logs/entity/{entity}/{entityId}?page=0&size=20
     */
    async getByEntity(
        entity: string,
        entityId: number,
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<AuditLogResponse>> {
        const response = await api.get<ApiResponse<PageResponse<AuditLogResponse>>>(
            `/api/audit-logs/entity/${entity}/${entityId}`,
            {
                params: { page, size }
            }
        )
        return response.data.data
    },

    /**
     * Search audit logs with filters
     * GET /api/audit-logs/search?action=...&userId=...&entity=...&entityId=...&from=...&to=...&page=0&size=20
     */
    async search(params: SearchParams): Promise<PageResponse<AuditLogResponse>> {
        const queryParams: Record<string, any> = {
            page: params.page ?? 0,
            size: params.size ?? 20
        }

        if (params.action) queryParams.action = params.action
        if (params.userId) queryParams.userId = params.userId
        if (params.entity) queryParams.entity = params.entity
        if (params.entityId) queryParams.entityId = params.entityId
        // Format dates to ISO string without timezone (LocalDateTime format)
        if (params.from) {
            const date = new Date(params.from)
            queryParams.from = date.toISOString().replace('Z', '').split('.')[0]
        }
        if (params.to) {
            const date = new Date(params.to)
            queryParams.to = date.toISOString().replace('Z', '').split('.')[0]
        }

        const response = await api.get<ApiResponse<PageResponse<AuditLogResponse>>>('/api/audit-logs/search', {
            params: queryParams
        })
        return response.data.data
    },

}

