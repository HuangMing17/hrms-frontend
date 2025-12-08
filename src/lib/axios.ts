import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// Create Axios instance with base configuration
const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - Auto-attach JWT token to headers
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Only run on client-side
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken')
            if (accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`
            }
            
            // If request data is FormData, let browser set Content-Type with boundary
            // Don't set Content-Type manually for FormData, axios will handle it
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type']
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Handle 401 Unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // Only run on client-side
                if (typeof window !== 'undefined') {
                    const refreshToken = localStorage.getItem('refreshToken')

                    if (refreshToken) {
                        // Call refresh token endpoint with token in Authorization header
                        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {}, {
                            headers: {
                                'Authorization': `Bearer ${refreshToken}`,
                                'Content-Type': 'application/json'
                            }
                        })

                        const { accessToken, refreshToken: newRefreshToken } = response.data

                        // Update tokens in localStorage
                        localStorage.setItem('accessToken', accessToken)
                        if (newRefreshToken) {
                            localStorage.setItem('refreshToken', newRefreshToken)
                        }

                        // Retry original request with new token
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`
                        }
                        return api(originalRequest)
                    }
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('user')

                    // Redirect to login page
                    window.location.href = '/'
                }
                return Promise.reject(refreshError)
            }
        }

        // Handle other errors with enhanced logging
        // Skip logging for 401/403 on /api/employees/me endpoint (expected for unauthenticated users)
        const isMeEndpoint = originalRequest?.url?.includes('/api/employees/me')
        const isNotificationSearch = originalRequest?.url?.includes('/api/notifications/search')
        
        if (error.response?.status === 403 && !isMeEndpoint) {
            console.error('Access forbidden - insufficient permissions')
        } else if (error.response?.status >= 500) {
            // Skip logging for notification search errors (service might be down)
            if (!isNotificationSearch) {
                console.error('Server error:', error.response.data)
            }
        }

        // Log request ID for tracing if available (skip for expected 401/403 on /me and notification errors)
        if (error.response?.data?.requestId && 
            !(isMeEndpoint && (error.response?.status === 401 || error.response?.status === 403)) &&
            !isNotificationSearch) {
            console.error(`Request ID: ${error.response.data.requestId}`)
        }

        return Promise.reject(error)
    }
)

export default api
