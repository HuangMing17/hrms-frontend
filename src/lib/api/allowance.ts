import api from '../axios'

// Allowance Types
export enum AllowanceType {
    FIXED = "FIXED",
    PERCENTAGE = "PERCENTAGE",
    VARIABLE = "VARIABLE"
}

export interface AllowanceResponse {
    id: number
    name: string
    description?: string
    type: AllowanceType
    amount: number
    taxable: boolean
    active: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateAllowanceRequest {
    name: string
    description?: string
    type: AllowanceType
    amount: number
    taxable?: boolean
    active?: boolean
}

export interface UpdateAllowanceRequest {
    name?: string
    description?: string
    type?: AllowanceType
    amount?: number
    taxable?: boolean
    active?: boolean
}

// Helper function để extract data từ API response
const extractData = <T>(response: any): T => {
    return response.data.data
}

// Allowance API service
export const allowanceAPI = {
    /**
     * Tạo allowance mới
     * POST /api/allowances
     */
    async createAllowance(data: CreateAllowanceRequest): Promise<AllowanceResponse> {
        try {
            const response = await api.post('/api/allowances', data)
            return extractData<AllowanceResponse>(response)
        } catch (error: any) {
            console.error('Error creating allowance:', error)
            throw error
        }
    },

    /**
     * Lấy tất cả allowances
     * GET /api/allowances
     */
    async getAllAllowances(): Promise<AllowanceResponse[]> {
        try {
            const response = await api.get('/api/allowances')
            return extractData<AllowanceResponse[]>(response)
        } catch (error: any) {
            console.error('Error getting allowances:', error)
            throw error
        }
    },

    /**
     * Lấy allowance theo ID
     * GET /api/allowances/{id}
     */
    async getAllowanceById(id: number): Promise<AllowanceResponse> {
        try {
            const response = await api.get(`/api/allowances/${id}`)
            return extractData<AllowanceResponse>(response)
        } catch (error: any) {
            console.error('Error getting allowance:', error)
            throw error
        }
    },

    /**
     * Cập nhật allowance
     * PUT /api/allowances/{id}
     */
    async updateAllowance(id: number, data: UpdateAllowanceRequest): Promise<AllowanceResponse> {
        try {
            const response = await api.put(`/api/allowances/${id}`, data)
            return extractData<AllowanceResponse>(response)
        } catch (error: any) {
            console.error('Error updating allowance:', error)
            throw error
        }
    },

    /**
     * Xóa allowance
     * DELETE /api/allowances/{id}
     */
    async deleteAllowance(id: number): Promise<void> {
        try {
            await api.delete(`/api/allowances/${id}`)
        } catch (error: any) {
            console.error('Error deleting allowance:', error)
            throw error
        }
    }
}


