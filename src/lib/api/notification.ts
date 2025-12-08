import api from "../axios"

export interface NotificationResponse {
    id: number
    recipientId: number
    title: string
    message: string
    type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "REMINDER"
    isRead: boolean
    relatedEntity?: string
    relatedEntityId?: number
    readAt?: string
    createdAt: string
    updatedAt: string
}

export interface CreateNotificationRequest {
    recipientId: number
    title: string
    message: string
    type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "REMINDER"
    relatedEntity?: string
    relatedEntityId?: number
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

interface ApiResponse<T> {
    status: string
    statusCode: number
    message: string
    data: T
}

export const notificationAPI = {
    /**
     * Create a new notification
     * POST /api/notifications
     */
    async create(request: CreateNotificationRequest): Promise<NotificationResponse> {
        const response = await api.post<ApiResponse<NotificationResponse>>('/api/notifications', request)
        return response.data.data
    },

    /**
     * Get notification by ID
     * GET /api/notifications/{id}
     */
    async getById(id: number): Promise<NotificationResponse> {
        const response = await api.get<ApiResponse<NotificationResponse>>(`/api/notifications/${id}`)
        return response.data.data
    },

    /**
     * Get notifications by recipient
     * GET /api/notifications/recipient/{recipientId}?page=0&size=20
     */
    async getByRecipient(recipientId: number, page: number = 0, size: number = 20): Promise<PageResponse<NotificationResponse>> {
        const response = await api.get<ApiResponse<PageResponse<NotificationResponse>>>(`/api/notifications/recipient/${recipientId}`, {
            params: { page, size }
        })
        return response.data.data
    },

    /**
     * Get unread notifications by recipient
     * GET /api/notifications/recipient/{recipientId}/unread?page=0&size=20
     */
    async getUnreadByRecipient(recipientId: number, page: number = 0, size: number = 20): Promise<PageResponse<NotificationResponse>> {
        const response = await api.get<ApiResponse<PageResponse<NotificationResponse>>>(`/api/notifications/recipient/${recipientId}/unread`, {
            params: { page, size }
        })
        return response.data.data
    },

    /**
     * Get notifications by recipient and type
     * GET /api/notifications/recipient/{recipientId}/type/{type}?page=0&size=20
     */
    async getByRecipientAndType(recipientId: number, type: string, page: number = 0, size: number = 20): Promise<PageResponse<NotificationResponse>> {
        const response = await api.get<ApiResponse<PageResponse<NotificationResponse>>>(`/api/notifications/recipient/${recipientId}/type/${type}`, {
            params: { page, size }
        })
        return response.data.data
    },

    /**
     * Search notifications by date range
     * GET /api/notifications/search?from=...&to=...&page=0&size=20
     */
    async search(from?: string, to?: string, page: number = 0, size: number = 20): Promise<PageResponse<NotificationResponse>> {
        const params: Record<string, any> = { page, size }
        // Only add from/to if they have values
        if (from && from.trim()) params.from = from
        if (to && to.trim()) params.to = to
        const response = await api.get<ApiResponse<PageResponse<NotificationResponse>>>('/api/notifications/search', { params })
        return response.data.data
    },

    /**
     * Mark notification as read
     * POST /api/notifications/{id}/read
     */
    async markAsRead(id: number): Promise<NotificationResponse> {
        const response = await api.post<ApiResponse<NotificationResponse>>(`/api/notifications/${id}/read`)
        return response.data.data
    },

    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     */
    async delete(id: number): Promise<void> {
        await api.delete(`/api/notifications/${id}`)
    }
}


