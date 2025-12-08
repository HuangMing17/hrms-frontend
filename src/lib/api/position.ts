import api from '../axios'

// Position Level Enum - Updated according to microservices API
export type PositionLevel = 'INTERN' | 'STAFF' | 'SENIOR_STAFF' | 'SUPERVISOR' | 'ASSISTANT_MANAGER' | 'MANAGER' | 'DIRECTOR'

// Position types based on microservices API response
export interface Position {
    id: number
    title: string
    code: string
    description: string | null
    level: PositionLevel
    baseSalary: number | null
    departmentId: number
    active: boolean
    createdAt: string
    updatedAt: string
    // Extended fields for UI
    departmentName?: string
    employeeCount?: number
}

// Microservices API response wrapper
export interface PositionResponse {
    status: string
    statusCode: number
    message: string
    data: Position
    timestamp: string
    requestId: string
    path: string
}

// List response wrapper
export interface PositionListResponse {
    status: string
    statusCode: number
    message: string
    data: Position[]
    timestamp: string
    requestId: string
    path: string
}

export interface PositionCreateRequest {
    title: string
    code: string
    description?: string
    level: PositionLevel
    baseSalary?: number
    departmentId?: number
    active?: boolean
}

export interface PositionUpdateRequest {
    title?: string
    description?: string
    level?: PositionLevel
    baseSalary?: number
    departmentId?: number
    active?: boolean
}

export interface PositionSearchParams {
    keyword?: string
    departmentId?: number
    level?: string
    minSalary?: number
    maxSalary?: number
    activeOnly?: boolean
    page?: number
    size?: number
    sort?: string
}

export interface PositionCopyRequest {
    newTitle: string
    newCode: string
}

export interface PositionStatistics {
    totalPositions: number
    activePositions: number
    positionsByLevel: Record<string, number>
    positionsByDepartment: Record<string, number>
    averageSalary: number
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

// Position API service - Updated for microservices
export const positionAPI = {
    // 1. Tạo position mới
    async createPosition(data: PositionCreateRequest): Promise<Position> {
        try {
            const response = await api.post('/api/positions', data)
            return response.data.data
        } catch (error: any) {
            console.error('Error creating position:', error)
            throw error
        }
    },

    // 2. Lấy danh sách positions (active)
    async getPositions(): Promise<Position[]> {
        try {
            const response = await api.get('/api/positions')
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching positions:', error)
            throw error
        }
    },

    // 3. Lấy position theo ID
    async getPositionById(id: number): Promise<Position> {
        try {
            const response = await api.get(`/api/positions/${id}`)
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching position:', error)
            throw error
        }
    },

    // 4. Lấy position theo code
    async getPositionByCode(code: string): Promise<Position> {
        try {
            const response = await api.get(`/api/positions/code/${code}`)
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching position by code:', error)
            throw error
        }
    },

    // 5. Lấy positions theo department
    async getPositionsByDepartment(departmentId: number): Promise<Position[]> {
        try {
            const response = await api.get(`/api/positions/department/${departmentId}`)
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching positions by department:', error)
            throw error
        }
    },

    // 6. Lấy positions theo level
    async getPositionsByLevel(level: PositionLevel): Promise<Position[]> {
        try {
            const response = await api.get(`/api/positions/level/${level}`)
            return response.data.data
        } catch (error: any) {
            console.error('Error fetching positions by level:', error)
            throw error
        }
    },

    // 7. Cập nhật position
    async updatePosition(id: number, data: PositionUpdateRequest): Promise<Position> {
        try {
            const response = await api.put(`/api/positions/${id}`, data)
            return response.data.data
        } catch (error: any) {
            console.error('Error updating position:', error)
            throw error
        }
    },

    // 8. Xóa position
    async deletePosition(id: number): Promise<void> {
        try {
            await api.delete(`/api/positions/${id}`)
        } catch (error) {
            console.error('Error deleting position:', error)
            throw error
        }
    },

    // 9. Kích hoạt position
    async activatePosition(id: number): Promise<Position> {
        try {
            const response = await api.patch(`/api/positions/${id}/activate`)
            return response.data.data
        } catch (error: any) {
            console.error('Error activating position:', error)
            throw error
        }
    },

    // 10. Vô hiệu hóa position
    async deactivatePosition(id: number): Promise<Position> {
        try {
            const response = await api.patch(`/api/positions/${id}/deactivate`)
            return response.data.data
        } catch (error: any) {
            console.error('Error deactivating position:', error)
            throw error
        }
    },

    // 11. Tìm kiếm positions (API endpoint)
    async searchPositionsAPI(keyword?: string): Promise<Position[]> {
        try {
            const url = keyword 
                ? `/api/positions/search?keyword=${encodeURIComponent(keyword)}`
                : '/api/positions/search'
            const response = await api.get(url)
            return response.data.data
        } catch (error: any) {
            console.error('Error searching positions:', error)
            throw error
        }
    },


    // Legacy methods for backward compatibility
    async getPositionsPaginated(params: {
        activeOnly?: boolean
        page?: number
        size?: number
        sort?: string
    } = {}): Promise<PaginatedResponse<Position>> {
        try {
            const positions = await this.getPositions()
            return {
                content: positions,
                pageable: {
                    pageNumber: 0,
                    pageSize: positions.length,
                    sort: {
                        sorted: false,
                        unsorted: true
                    }
                },
                totalElements: positions.length,
                totalPages: 1,
                first: true,
                last: true,
                numberOfElements: positions.length
            }
        } catch (error: any) {
            console.error('Error fetching positions paginated:', error)
            throw error
        }
    },

    async searchPositions(params: PositionSearchParams): Promise<PaginatedResponse<Position>> {
        try {
            let positions: Position[]
            
            // Use API endpoint if keyword is provided
            if (params.keyword) {
                positions = await this.searchPositionsAPI(params.keyword)
            } else {
                positions = await this.getPositions()
            }
            
            // Filter by department
            if (params.departmentId) {
                positions = positions.filter(pos => pos.departmentId === params.departmentId)
            }
            
            // Filter by level
            if (params.level) {
                positions = positions.filter(pos => pos.level === params.level)
            }
            
            // Filter by salary range
            if (params.minSalary) {
                positions = positions.filter(pos => (pos.baseSalary || 0) >= params.minSalary!)
            }
            if (params.maxSalary) {
                positions = positions.filter(pos => (pos.baseSalary || 0) <= params.maxSalary!)
            }

            // Filter by activeOnly
            if (params.activeOnly !== undefined) {
                positions = positions.filter(pos => pos.active === params.activeOnly)
            }

            return {
                content: positions,
                pageable: {
                    pageNumber: params.page || 0,
                    pageSize: params.size || positions.length,
                    sort: {
                        sorted: false,
                        unsorted: true
                    }
                },
                totalElements: positions.length,
                totalPages: 1,
                first: true,
                last: true,
                numberOfElements: positions.length
            }
        } catch (error: any) {
            console.error('Error searching positions:', error)
            throw error
        }
    },

    // Helper methods
    async getPositionStatistics(): Promise<PositionStatistics> {
        try {
            const positions = await this.getPositions()
            const activePositions = positions.filter(p => p.active)
            
            // Calculate statistics by level
            const positionsByLevel: Record<string, number> = {}
            positions.forEach(pos => {
                positionsByLevel[pos.level] = (positionsByLevel[pos.level] || 0) + 1
            })

            // Calculate statistics by department
            const positionsByDepartment: Record<string, number> = {}
            positions.forEach(pos => {
                const deptName = pos.departmentName || `Department ${pos.departmentId}`
                positionsByDepartment[deptName] = (positionsByDepartment[deptName] || 0) + 1
            })

            const totalSalary = positions.reduce((sum, pos) => sum + (pos.baseSalary || 0), 0)
            const averageSalary = positions.length > 0 ? totalSalary / positions.length : 0

            return {
                totalPositions: positions.length,
                activePositions: activePositions.length,
                positionsByLevel,
                positionsByDepartment,
                averageSalary
            }
        } catch (error: any) {
            console.error('Error fetching position statistics:', error)
            throw error
        }
    }
}
