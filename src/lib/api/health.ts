import api from '../axios'

// Health check utilities for microservices
export const healthAPI = {
    // Check API Gateway health
    async checkAPIGateway() {
        try {
            const response = await api.get('/actuator/health')
            return {
                status: 'UP',
                service: 'API Gateway',
                data: response.data
            }
        } catch (error) {
            return {
                status: 'DOWN',
                service: 'API Gateway',
                error: error
            }
        }
    },

    // Test auth endpoints availability
    async testAuthEndpoints() {
        const results = {
            gateway: false,
            loginEndpoint: false,
            refreshEndpoint: false,
            firebaseEndpoint: false
        }

        try {
            // Test gateway health
            await this.checkAPIGateway()
            results.gateway = true
        } catch (error) {
            console.warn('Gateway health check failed:', error)
        }

        // Note: We can't test actual auth endpoints without valid credentials
        // This is just structure for future testing
        console.log('Auth endpoints test results:', results)
        return results
    },

    // Log current configuration for debugging
    logConfiguration() {
        console.group('🔧 Microservices Configuration')
        console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL)
        console.log('API Timeout:', process.env.NEXT_PUBLIC_API_TIMEOUT)
        console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
        console.log('Current Token:', localStorage.getItem('accessToken') ? 'Present' : 'Not found')
        console.log('Current User:', localStorage.getItem('user') ? 'Present' : 'Not found')
        console.groupEnd()
    }
}

// Auth flow testing utility
export const authTestUtils = {
    // Test traditional login flow (requires valid credentials)
    async testTraditionalLogin(username: string, password: string) {
        try {
            console.log('🔐 Testing traditional login...')
            const response = await api.post('/api/auth/login', {
                usernameOrEmail: username,
                password: password
            })
            console.log('✅ Traditional login successful')
            console.log('Request ID:', response.data.requestId)
            return true
        } catch (error: any) {
            console.error('❌ Traditional login failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Test token refresh flow
    async testTokenRefresh() {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                console.warn('⚠️ No refresh token available for testing')
                return false
            }

            console.log('🔄 Testing token refresh...')
            const response = await api.post('/api/auth/refresh', {}, {
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            })
            console.log('✅ Token refresh successful')
            console.log('Request ID:', response.data.requestId)
            return true
        } catch (error: any) {
            console.error('❌ Token refresh failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Test Firebase login endpoint (requires Firebase setup)
    async testFirebaseEndpoint(idToken: string) {
        try {
            console.log('🔥 Testing Firebase login...')
            const response = await api.post('/api/auth/firebase-login', {
                idToken: idToken
            })
            console.log('✅ Firebase login successful')
            console.log('Request ID:', response.data.requestId)
            return true
        } catch (error: any) {
            console.error('❌ Firebase login failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Test logout flow
    async testLogout() {
        try {
            console.log('🚪 Testing logout...')
            const response = await api.post('/api/auth/logout')
            console.log('✅ Logout successful')
            console.log('Request ID:', response.data?.requestId)
            return true
        } catch (error: any) {
            console.error('❌ Logout failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Test forgot password flow (requires valid email)
    async testForgotPassword(email: string) {
        try {
            console.log('📧 Testing forgot password...')
            const response = await api.post('/api/auth/forgot-password', {
                email: email
            })
            console.log('✅ Forgot password successful')
            console.log('Request ID:', response.data.requestId)
            console.log('Reset link:', response.data.resetLink)
            return true
        } catch (error: any) {
            console.error('❌ Forgot password failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Test reset password token validation
    async testValidateResetToken(token: string) {
        try {
            console.log('🔍 Testing token validation...')
            const response = await api.get(`/api/auth/validate-reset-token?token=${token}`)
            console.log('✅ Token validation successful')
            console.log('Request ID:', response.data.requestId)
            console.log('Token valid:', response.data.valid)
            return true
        } catch (error: any) {
            console.error('❌ Token validation failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Test reset password with token
    async testResetPassword(token: string, newPassword: string) {
        try {
            console.log('🔐 Testing password reset...')
            const response = await api.post('/api/auth/reset-password', {
                token: token,
                newPassword: newPassword
            })
            console.log('✅ Password reset successful')
            console.log('Request ID:', response.data.requestId)
            return true
        } catch (error: any) {
            console.error('❌ Password reset failed:', error.response?.data?.error?.message || error.message)
            console.log('Request ID:', error.response?.data?.requestId)
            return false
        }
    },

    // Run comprehensive auth flow test
    async runAuthFlowTest() {
        console.group('🧪 Microservices Auth Flow Test')
        
        healthAPI.logConfiguration()
        
        console.log('\n📊 Testing endpoints availability...')
        await healthAPI.testAuthEndpoints()
        
        console.log('\n⚠️ Note: Actual tests require valid data')
        console.log('🔐 Login: authTestUtils.testTraditionalLogin(username, password)')
        console.log('🔄 Refresh: authTestUtils.testTokenRefresh()')
        console.log('📧 Forgot: authTestUtils.testForgotPassword(email)')
        console.log('🔍 Validate: authTestUtils.testValidateResetToken(token)')
        console.log('🔐 Reset: authTestUtils.testResetPassword(token, newPassword)')
        
        console.groupEnd()
    },

    // Test complete password reset flow
    async runPasswordResetFlowTest() {
        console.group('🔐 Password Reset Flow Test')
        console.log('This would test the complete password reset flow:')
        console.log('1. Send forgot password request')
        console.log('2. Validate reset token from email')
        console.log('3. Reset password with new password')
        console.log('4. Login with new password')
        console.log('\n⚠️ Requires valid email and manual email checking')
        console.groupEnd()
    }
}