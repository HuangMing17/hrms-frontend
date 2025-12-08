import api from '../axios'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

// Type definitions based on microservices response structure
export interface LoginResponse {
    status: string
    statusCode: number
    message: string
    data: {
        accessToken: string
        tokenType: string
        expiresIn: number
        refreshToken: string
        user: {
            id: number
            username: string
            email: string
            fullName: string
            roles: string[]
            permissions: string[]
        }
    }
    timestamp: string
    requestId: string
    path: string
}

export interface FirebaseLoginResponse {
    token: string
    user: {
        id: number
        email: string
        username: string
        fullName: string
        roles: string[]
        permissions: string[]
        firebaseUid: string
        provider: string
    }
}

export interface RefreshTokenResponse {
    accessToken: string
    refreshToken: string
}

export interface User {
    id: number
    username: string
    email: string
    fullName: string
    roles: string[]
    permissions: string[]
    firebaseUid?: string
    provider?: string
}

// Password Reset Types
export interface ForgotPasswordRequest {
    email: string
}

export interface ForgotPasswordResponse {
    status: string
    statusCode: number
    message: string
    data?: {
        resetLink?: string
        message?: string
    }
    resetLink?: string  // Fallback cho backward compatibility
    timestamp: string
    requestId?: string
    path?: string
}

export interface ValidateResetTokenResponse {
    status: string
    statusCode: number
    message: string
    data?: {
        valid: boolean
        message: string
    }
    valid?: boolean  // Fallback cho backward compatibility
    timestamp: string
    requestId?: string
    path?: string
}

export interface ResetPasswordRequest {
    token: string
    newPassword: string
}

export interface ResetPasswordResponse {
    status: string
    statusCode: number
    message: string
    data?: {
        message?: string
    }
    timestamp: string
    requestId?: string
    path?: string
}

// Authentication API service
export const authAPI = {
    // Traditional login with username/email and password
    async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
        try {
            const response = await api.post('/api/auth/login', {
                usernameOrEmail,
                password
            })

            const data = response.data

            // Store tokens in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', data.data.accessToken)
                localStorage.setItem('refreshToken', data.data.refreshToken)
                localStorage.setItem('user', JSON.stringify(data.data.user))
            }

            return data
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    },

    // Firebase Google Sign-In
    async loginWithGoogle(): Promise<FirebaseLoginResponse> {
        try {
            // Check if Firebase auth is available
            if (!auth) {
                throw new Error('Firebase authentication is not available. Please check your configuration.')
            }

            // Sign in with Firebase
            const result = await signInWithPopup(auth, googleProvider!)
            const idToken = await result.user.getIdToken()

            // Send Firebase ID token to backend
            const response = await api.post('/api/auth/firebase-login', {
                idToken
            })

            const data = response.data

            // Store JWT token and user info
            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
                localStorage.setItem('firebaseUser', JSON.stringify(result.user))
            }

            return data
        } catch (error: any) {
            console.error('Google Sign-In error:', error)

            // Handle specific Firebase errors
            if (error.code === 'auth/invalid-api-key') {
                throw new Error('Firebase configuration error. Please contact administrator.')
            } else if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign-in was cancelled by user.')
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Popup was blocked by browser. Please allow popups for this site.')
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please check your internet connection.')
            } else if (error.code === 'auth/operation-not-allowed') {
                throw new Error('Google Sign-In is not enabled. Please contact administrator.')
            } else if (error.code === 'auth/unauthorized-domain') {
                throw new Error('This domain is not authorized for Firebase authentication.')
            }

            throw error
        }
    },

    // Refresh JWT token
    async refreshToken(): Promise<RefreshTokenResponse> {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                throw new Error('No refresh token available')
            }

            const response = await api.post('/api/auth/refresh', {}, {
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            })

            const data = response.data

            // Update tokens in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', data.accessToken)
                localStorage.setItem('refreshToken', data.refreshToken)
            }

            return data
        } catch (error) {
            console.error('Token refresh error:', error)
            throw error
        }
    },

    // Logout user
    async logout(): Promise<void> {
        try {
            // Call backend logout endpoint FIRST (while we still have the token)
            try {
                await api.post('/api/auth/logout')
            } catch (error) {
                // Log the error but don't throw - we still want to clear local data
                console.warn('Backend logout failed:', error)
            }

            // Sign out from Firebase if user is signed in and auth is available
            if (auth && auth.currentUser) {
                await signOut(auth)
            }

            // Clear all tokens and user data AFTER calling backend
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                localStorage.removeItem('firebaseUser')
            }
        } catch (error) {
            console.error('Logout error:', error)
            // Even if logout fails, clear local data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                localStorage.removeItem('firebaseUser')
            }
            throw error
        }
    },

    // Get current user from localStorage
    getCurrentUser(): User | null {
        if (typeof window === 'undefined') return null

        const userStr = localStorage.getItem('user')
        if (!userStr) return null

        try {
            return JSON.parse(userStr)
        } catch (error) {
            console.error('Error parsing user data:', error)
            return null
        }
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false

        const accessToken = localStorage.getItem('accessToken')
        return !!accessToken
    },

    // Get access token
    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('accessToken')
    },

    // Get refresh token
    getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('refreshToken')
    },

    // Forgot Password - Send reset email
    async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
        try {
            const response = await api.post('/api/auth/forgot-password', {
                email
            })

            return response.data
        } catch (error) {
            console.error('Forgot password error:', error)
            throw error
        }
    },

    // Validate Reset Token
    async validateResetToken(token: string): Promise<ValidateResetTokenResponse> {
        try {
            const response = await api.get(`/api/auth/validate-reset-token?token=${token}`)

            return response.data
        } catch (error) {
            console.error('Validate reset token error:', error)
            throw error
        }
    },

    // Reset Password with Token
    async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
        try {
            const response = await api.post('/api/auth/reset-password', {
                token,
                newPassword
            })

            return response.data
        } catch (error) {
            console.error('Reset password error:', error)
            throw error
        }
    }
}
