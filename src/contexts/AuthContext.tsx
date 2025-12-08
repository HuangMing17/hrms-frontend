"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, User, LoginResponse, FirebaseLoginResponse, ForgotPasswordResponse, ValidateResetTokenResponse, ResetPasswordResponse } from '../lib/api/auth'

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (usernameOrEmail: string, password: string) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => Promise<void>
    forgotPassword: (email: string) => Promise<ForgotPasswordResponse>
    validateResetToken: (token: string) => Promise<ValidateResetTokenResponse>
    resetPassword: (token: string, newPassword: string) => Promise<ResetPasswordResponse>
    error: string | null
    clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = () => {
            try {
                // Only run on client-side to avoid hydration mismatch
                if (typeof window !== 'undefined') {
                    const currentUser = authAPI.getCurrentUser()
                    setUser(currentUser)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                setError('Failed to initialize authentication')
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const login = async (usernameOrEmail: string, password: string) => {
        try {
            setIsLoading(true)
            setError(null)

            const response: LoginResponse = await authAPI.login(usernameOrEmail, password)
            setUser(response.data.user)
        } catch (error: any) {
            // Enhanced error message parsing for microservices format
            let errorMessage = 'Login failed'
            
            if (error.response?.data) {
                const errorData = error.response.data
                // Check for microservices error format
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message
                } else if (errorData.message) {
                    errorMessage = errorData.message
                } else if (error.message) {
                    errorMessage = error.message
                }
                
                // Log request ID if available for debugging
                if (errorData.requestId) {
                    console.debug(`Login error - Request ID: ${errorData.requestId}`)
                }
            }
            
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const loginWithGoogle = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response: FirebaseLoginResponse = await authAPI.loginWithGoogle()
            setUser(response.user)
        } catch (error: any) {
            // Enhanced error message parsing for Firebase login
            let errorMessage = 'Google Sign-In failed'
            
            if (error.response?.data) {
                const errorData = error.response.data
                // Check for microservices error format
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message
                } else if (errorData.message) {
                    errorMessage = errorData.message
                }
                
                // Log request ID if available for debugging
                if (errorData.requestId) {
                    console.debug(`Google login error - Request ID: ${errorData.requestId}`)
                }
            } else if (error.message) {
                errorMessage = error.message
            }
            
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            setIsLoading(true)
            setError(null)

            await authAPI.logout()
            setUser(null)
        } catch (error: any) {
            console.error('Logout error:', error)
            // Even if logout fails, clear local state
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const forgotPassword = async (email: string) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await authAPI.forgotPassword(email)
            return response
        } catch (error: any) {
            // Enhanced error message parsing for microservices format
            let errorMessage = 'Có lỗi xảy ra khi gửi email khôi phục'
            
            if (error.response?.data) {
                const errorData = error.response.data
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message
                } else if (errorData.message) {
                    errorMessage = errorData.message
                }
                
                if (errorData.requestId) {
                    console.debug(`Forgot password error - Request ID: ${errorData.requestId}`)
                }
            }
            
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const validateResetToken = async (token: string) => {
        try {
            const response = await authAPI.validateResetToken(token)
            return response
        } catch (error: any) {
            console.error('Validate reset token error:', error)
            throw error
        }
    }

    const resetPassword = async (token: string, newPassword: string) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await authAPI.resetPassword(token, newPassword)
            return response
        } catch (error: any) {
            // Enhanced error message parsing for microservices format
            let errorMessage = 'Có lỗi xảy ra khi đặt lại mật khẩu'
            
            if (error.response?.data) {
                const errorData = error.response.data
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message
                } else if (errorData.message) {
                    errorMessage = errorData.message
                }
                
                if (errorData.requestId) {
                    console.debug(`Reset password error - Request ID: ${errorData.requestId}`)
                }
            }
            
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const clearError = () => {
        setError(null)
    }

    const isAuthenticated = typeof window !== 'undefined' ? authAPI.isAuthenticated() : false

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        forgotPassword,
        validateResetToken,
        resetPassword,
        error,
        clearError,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
