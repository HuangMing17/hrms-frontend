import { useAuth as useAuthContext } from '../contexts/AuthContext'

// Re-export the useAuth hook from AuthContext for easier imports
export { useAuth } from '../contexts/AuthContext'

// Additional auth utilities
export const useAuthUtils = () => {
    const auth = useAuthContext()

    return {
        ...auth,
        // Additional utility functions
        isAdmin: () => auth.user?.roles?.includes('ADMIN') || false,
        isEmployee: () => auth.user?.roles?.includes('EMPLOYEE') || false,
        isManager: () => auth.user?.roles?.includes('MANAGER') || false,
        hasRole: (role: string) => auth.user?.roles?.includes(role) || false,
        hasPermission: (permission: string) => auth.user?.permissions?.includes(permission) || false,
        getUserDisplayName: () => auth.user?.fullName || auth.user?.username || auth.user?.email || 'User',
    }
}
