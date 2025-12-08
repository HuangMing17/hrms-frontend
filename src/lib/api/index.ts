// Centralized API exports
export { authAPI } from './auth'
export { attendanceAPI } from './attendance'
export { departmentAPI } from './department'
export { positionAPI } from './position'
export { healthAPI, authTestUtils } from './health'
export { salaryAPI } from './salary'
export { payrollAPI } from './payroll'

// Re-export types
export type { LoginResponse, FirebaseLoginResponse, RefreshTokenResponse, User, ForgotPasswordRequest, ForgotPasswordResponse, ValidateResetTokenResponse, ResetPasswordRequest, ResetPasswordResponse } from './auth'
export type { Department, DepartmentCreateRequest, DepartmentUpdateRequest, DepartmentSearchParams, DepartmentEmployee, DepartmentTransferRequest, PaginatedResponse, ApiResponse } from './department'
export type { Position, PositionLevel, PositionCreateRequest, PositionUpdateRequest, PositionSearchParams, PositionCopyRequest, PositionStatistics } from './position'
export type { SalaryResponse, CreateSalaryRequest, UpdateSalaryRequest, PayFrequency } from './salary'
export type { PayrollResponse, CalculatePayrollRequest, PayrollSummaryResponse, PayrollStatus, PayrollHistoryParams, PayrollQueryParams } from './payroll'
