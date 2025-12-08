/**
 * Leave API Testing Utilities
 * 
 * Sử dụng file này để test Leave API trong browser console
 * 
 * Usage:
 * 1. Import trong component hoặc page
 * 2. Gọi các function test từ browser console
 * 3. Kiểm tra kết quả trong console
 */

import { leaveAPI, LeaveStatus } from './leave'

export const leaveTestUtils = {
    /**
     * Test lấy tất cả leave types
     */
    async testGetAllLeaveTypes() {
        console.log('🧪 Testing: Get All Leave Types')
        try {
            const leaveTypes = await leaveAPI.getAllLeaveTypes()
            console.log('✅ Success:', leaveTypes)
            return leaveTypes
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Test tạo đơn nghỉ phép
     */
    async testCreateLeaveRequest(employeeId: number, leaveTypeId: number) {
        console.log('🧪 Testing: Create Leave Request')
        try {
            const request = {
                leaveTypeId,
                startDate: '2025-12-01',
                endDate: '2025-12-03',
                reason: 'Test nghỉ phép từ frontend'
            }
            const result = await leaveAPI.createLeaveRequest(employeeId, request)
            console.log('✅ Success:', result)
            return result
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Test lấy danh sách đơn nghỉ phép của nhân viên
     */
    async testGetEmployeeLeaveRequests(employeeId: number) {
        console.log('🧪 Testing: Get Employee Leave Requests')
        try {
            const result = await leaveAPI.getEmployeeLeaveRequests(employeeId, {
                page: 0,
                size: 20
            })
            console.log('✅ Success:', result)
            return result
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Test lấy số dư nghỉ phép
     */
    async testGetLeaveBalance(employeeId: number, year: number = 2025) {
        console.log('🧪 Testing: Get Leave Balance')
        try {
            const balance = await leaveAPI.getEmployeeLeaveBalance(employeeId, year)
            console.log('✅ Success:', balance)
            return balance
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Test phê duyệt đơn nghỉ phép
     */
    async testApproveLeaveRequest(leaveRequestId: number, approverId: number) {
        console.log('🧪 Testing: Approve Leave Request')
        try {
            const result = await leaveAPI.approveLeaveRequest(leaveRequestId, approverId, {
                action: 'APPROVE',
                comments: 'Đồng ý cho nghỉ phép - Test từ frontend'
            })
            console.log('✅ Success:', result)
            return result
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Test từ chối đơn nghỉ phép
     */
    async testRejectLeaveRequest(leaveRequestId: number, approverId: number) {
        console.log('🧪 Testing: Reject Leave Request')
        try {
            const result = await leaveAPI.rejectLeaveRequest(
                leaveRequestId,
                approverId,
                'Không đủ số ngày nghỉ còn lại - Test từ frontend'
            )
            console.log('✅ Success:', result)
            return result
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Test lấy danh sách đơn cần phê duyệt
     */
    async testGetPendingLeaveRequests(managerId: number) {
        console.log('🧪 Testing: Get Pending Leave Requests')
        try {
            const result = await leaveAPI.getPendingLeaveRequests(managerId, 0, 20)
            console.log('✅ Success:', result)
            return result
        } catch (error: any) {
            console.error('❌ Error:', error.response?.data || error.message)
            throw error
        }
    },

    /**
     * Chạy tất cả các test cơ bản
     */
    async runAllTests(employeeId: number = 5, managerId: number = 2) {
        console.log('🚀 Running all Leave API tests...\n')

        try {
            // Test 1: Get all leave types
            await this.testGetAllLeaveTypes()
            console.log('\n')

            // Test 2: Get leave balance
            await this.testGetLeaveBalance(employeeId)
            console.log('\n')

            // Test 3: Get employee leave requests
            await this.testGetEmployeeLeaveRequests(employeeId)
            console.log('\n')

            console.log('✅ All basic tests completed!')
        } catch (error) {
            console.error('❌ Test suite failed:', error)
        }
    }
}

// Export để có thể sử dụng trong browser console
if (typeof window !== 'undefined') {
    (window as any).leaveTestUtils = leaveTestUtils
}

