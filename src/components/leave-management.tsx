"use client"

import { useState, useEffect } from "react"
import { Plane, Calendar, CheckCircle, XCircle, Clock, Plus, Edit, Trash2, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Alert, AlertDescription } from "./ui/alert"
import { LoadingPage } from "./ui/loading"
import {
  leaveAPI,
  LeaveRequest,
  LeaveType,
  LeaveBalance,
  LeaveStatus,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  ApproveLeaveRequest
} from "../lib/api/leave"
import { employeeAPI, Employee } from "../lib/api/employee"
import { useAuth } from "../contexts/AuthContext"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination"

// Status mapping for Vietnamese display
const STATUS_LABELS: Record<LeaveStatus, string> = {
  [LeaveStatus.PENDING]: "Chờ duyệt",
  [LeaveStatus.APPROVED]: "Đã duyệt",
  [LeaveStatus.REJECTED]: "Từ chối",
  [LeaveStatus.CANCELLED]: "Đã hủy",
  [LeaveStatus.WITHDRAWN]: "Đã rút"
}

// Status color mapping
const STATUS_COLORS: Record<LeaveStatus, string> = {
  [LeaveStatus.PENDING]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  [LeaveStatus.APPROVED]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [LeaveStatus.REJECTED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [LeaveStatus.CANCELLED]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  [LeaveStatus.WITHDRAWN]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  LEAVE_TYPE_1: "Nghỉ phép năm",
  LEAVE_TYPE_2: "Nghỉ ốm",
  LEAVE_TYPE_3: "Nghỉ cá nhân",
  LEAVE_TYPE_4: "Nghỉ thai sản",
  LEAVE_TYPE_5: "Nghỉ cha/ mẹ",
  LEAVE_TYPE_6: "Nghỉ khẩn cấp",
  LEAVE_TYPE_7: "Nghỉ phép bổ sung",
  LEAVE_TYPE_8: "Nghỉ bệnh dài ngày"
}

const getLeaveTypeLabel = (type: LeaveType) => {
  const normalizedCode = type.code?.toUpperCase()
  return (normalizedCode && LEAVE_TYPE_LABELS[normalizedCode]) || type.name || "Loại phép"
}

export function LeaveManagement() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("requests")

  // Leave Request states
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Leave Type states
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false)

  // Leave Balance states
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [balanceLoading, setBalanceLoading] = useState(false)

  // Employee states
  const [employees, setEmployees] = useState<Employee[]>([])

  // Filter states
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [viewAllEmployees, setViewAllEmployees] = useState(true) // Mặc định xem tất cả nhân viên

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize] = useState(20)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingLeaveRequest, setEditingLeaveRequest] = useState<LeaveRequest | null>(null)
  const [approvingLeaveRequest, setApprovingLeaveRequest] = useState<LeaveRequest | null>(null)
  const [viewingLeaveRequest, setViewingLeaveRequest] = useState<LeaveRequest | null>(null)

  // Form states
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    leaveTypeId: 0,
    startDate: "",
    endDate: "",
    reason: ""
  })
  const [createEmployeeId, setCreateEmployeeId] = useState<number | null>(null)

  // Approve form states
  const [approveFormData, setApproveFormData] = useState<ApproveLeaveRequest>({
    action: "APPROVE",
    comments: ""
  })

  // Statistics states
  const [stats, setStats] = useState({
    pending: 0,
    approvedThisMonth: 0,
    onLeaveToday: 0,
    utilizationRate: 0
  })

  // ==================== HELPER FUNCTIONS ====================

  const getStatusBadge = (status: LeaveStatus) => {
    const label = STATUS_LABELS[status]
    const colorClass = STATUS_COLORS[status]
    return <Badge className={colorClass}>{label}</Badge>
  }

  const resetForm = () => {
    setFormData({
      leaveTypeId: 0,
      startDate: "",
      endDate: "",
      reason: ""
    })
  }

  const resetApproveForm = () => {
    setApproveFormData({
      action: "APPROVE",
      comments: ""
    })
  }

  // (Đã bỏ chọn theo từng nhân viên, luôn xem tất cả nhân viên)

  // Check if user is admin or HR
  const isAdminOrHR = () => {
    if (!user) return false
    return user.roles?.some(role => role === "ADMIN" || role === "HR") ?? false
  }

  // ==================== DATA LOADING FUNCTIONS ====================

  // Load all employees (for admin/HR)
  const loadEmployees = async () => {
    try {
      const result = await employeeAPI.getAllEmployees(0, 500)
      setEmployees(result.employees)
    } catch (err: any) {
      console.error('Error loading employees:', err)
    }
  }

  // Load leave types
  const loadLeaveTypes = async () => {
    setLeaveTypesLoading(true)
    try {
      const types = await leaveAPI.getAllLeaveTypes()
      setLeaveTypes(types)
    } catch (err: any) {
      console.error('Error loading leave types:', err)
      setError(err.message || "Không thể tải danh sách loại phép")
    } finally {
      setLeaveTypesLoading(false)
    }
  }

  // Load leave requests (luôn theo tất cả nhân viên, phân quyền do backend quyết định)
  const loadLeaveRequests = async () => {
    await loadAllLeaveRequests()
  }

  // Load all leave requests using new endpoint
  const loadAllLeaveRequests = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: any = {
        page: currentPage,
        size: pageSize
      }

      if (statusFilter !== "ALL") {
        params.status = statusFilter
      }

      const result = await leaveAPI.getAllLeaveRequests(params)
      setLeaveRequests(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
      setCurrentPage(result.number)

      // Calculate stats from current page (or fetch all for accurate stats)
      // For better stats, we could fetch all without pagination, but that might be heavy
      // For now, calculate from current page
      calculateStats(result.content)
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Load leave balance
  const loadLeaveBalance = async () => {
    // Balance only makes sense for specific employee, skip when viewing all
    if (viewAllEmployees || !selectedEmployeeId) {
      setLeaveBalances([])
      return
    }

    setBalanceLoading(true)
    try {
      const balances = await leaveAPI.getEmployeeLeaveBalance(selectedEmployeeId, selectedYear)
      setLeaveBalances(balances)
    } catch (err: any) {
      console.error('Error loading leave balance:', err)
    } finally {
      setBalanceLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (requests: LeaveRequest[]) => {
    const pending = requests.filter(r => r.status === LeaveStatus.PENDING).length

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const approvedThisMonth = requests.filter(r => {
      if (r.status !== LeaveStatus.APPROVED || !r.approvedAt) return false
      const approvedDate = new Date(r.approvedAt)
      return approvedDate.getMonth() === currentMonth && approvedDate.getFullYear() === currentYear
    }).length

    const today = now.toISOString().split('T')[0]
    const onLeaveToday = requests.filter(r => {
      if (r.status !== LeaveStatus.APPROVED) return false
      return r.startDate <= today && r.endDate >= today
    }).length

    // Calculate utilization rate from balances
    let utilizationRate = 0
    if (leaveBalances.length > 0) {
      const totalEntitlement = leaveBalances.reduce((sum, b) => sum + b.totalEntitlement, 0)
      const totalUsed = leaveBalances.reduce((sum, b) => sum + b.usedDays, 0)
      utilizationRate = totalEntitlement > 0 ? Math.round((totalUsed / totalEntitlement) * 100) : 0
    }

    setStats({
      pending,
      approvedThisMonth,
      onLeaveToday,
      utilizationRate
    })
  }

  // ==================== CRUD OPERATIONS ====================

  // Create leave request
  const handleCreateLeaveRequest = async () => {
    // Phải chọn nhân viên cụ thể trong form tạo đơn
    if (!createEmployeeId) {
      setError("Vui lòng chọn nhân viên để tạo đơn nghỉ phép")
      return
    }
    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await leaveAPI.createLeaveRequest(createEmployeeId, formData)
      setIsCreateDialogOpen(false)
      resetForm()
      setCreateEmployeeId(null)
      loadLeaveRequests()
      loadLeaveBalance()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Không thể tạo đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Update leave request
  const handleUpdateLeaveRequest = async () => {
    if (!editingLeaveRequest) return

    setLoading(true)
    setError(null)

    try {
      const updateData: UpdateLeaveRequest = {
        leaveTypeId: formData.leaveTypeId || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        reason: formData.reason || undefined
      }

      await leaveAPI.updateLeaveRequest(editingLeaveRequest.id, updateData)
      setIsEditDialogOpen(false)
      setEditingLeaveRequest(null)
      resetForm()
      loadLeaveRequests()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Không thể cập nhật đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Approve leave request
  const handleApproveLeaveRequest = async () => {
    if (!approvingLeaveRequest) {
      console.error('No leave request selected for approval')
      return
    }

    if (!user?.id) {
      setError("Không thể xác định người dùng hiện tại. Vui lòng đăng nhập lại.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Approving leave request:', {
        leaveRequestId: approvingLeaveRequest.id,
        approverId: user.id,
        formData: approveFormData
      })

      await leaveAPI.approveLeaveRequest(
        approvingLeaveRequest.id,
        user.id,
        approveFormData
      )

      console.log('Leave request approved successfully')
      setIsApproveDialogOpen(false)
      setApprovingLeaveRequest(null)
      resetApproveForm()
      await loadLeaveRequests()
    } catch (err: any) {
      console.error('Error approving leave request:', err)
      setError(err.response?.data?.message || err.message || "Không thể phê duyệt đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Reject leave request
  const handleRejectLeaveRequest = async (leaveRequestId: number, reason: string) => {
    if (!user?.id) {
      setError("Không thể xác định người dùng hiện tại. Vui lòng đăng nhập lại.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Rejecting leave request:', {
        leaveRequestId,
        approverId: user.id,
        reason
      })

      await leaveAPI.rejectLeaveRequest(leaveRequestId, user.id, reason)

      console.log('Leave request rejected successfully')
      await loadLeaveRequests()
    } catch (err: any) {
      console.error('Error rejecting leave request:', err)
      setError(err.response?.data?.message || err.message || "Không thể từ chối đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Cancel leave request
  const handleCancelLeaveRequest = async (leaveRequestId: number) => {
    if (!selectedEmployeeId) return

    if (!confirm("Bạn có chắc chắn muốn hủy đơn nghỉ phép này?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await leaveAPI.cancelLeaveRequest(leaveRequestId, selectedEmployeeId)
      loadLeaveRequests()
      loadLeaveBalance()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Không thể hủy đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Delete leave request
  const handleDeleteLeaveRequest = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn nghỉ phép này?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await leaveAPI.deleteLeaveRequest(id)
      loadLeaveRequests()
      loadLeaveBalance()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Không thể xóa đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (request: LeaveRequest) => {
    setEditingLeaveRequest(request)
    setFormData({
      leaveTypeId: request.leaveTypeId,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason || ""
    })
    setIsEditDialogOpen(true)
  }

  // Open approve dialog
  const openApproveDialog = (request: LeaveRequest) => {
    setApprovingLeaveRequest(request)
    setApproveFormData({
      action: "APPROVE",
      comments: ""
    })
    setIsApproveDialogOpen(true)
  }

  // Open view details dialog
  const openViewDialog = async (request: LeaveRequest) => {
    try {
      // Fetch full details from API
      const fullDetails = await leaveAPI.getLeaveRequestById(request.id)
      setViewingLeaveRequest(fullDetails)
      setIsViewDialogOpen(true)
    } catch (err: any) {
      console.error('Error loading leave request details:', err)
      setError(err.response?.data?.message || err.message || "Không thể tải chi tiết đơn nghỉ phép")
    }
  }

  // ==================== EFFECTS ====================

  // Load initial data
  useEffect(() => {
    const bootstrap = async () => {
      await loadEmployees()
      await loadLeaveTypes()
    }
    bootstrap()
  }, [])

  useEffect(() => {
    // Auto-select first employee only if not admin/HR or not viewing all
    if (!selectedEmployeeId && !viewAllEmployees && employees.length > 0 && !isAdminOrHR()) {
      setSelectedEmployeeId(employees[0].id)
    }
    // For admin/HR, default to "view all" if no selection
    if (isAdminOrHR() && !selectedEmployeeId && !viewAllEmployees && employees.length > 0) {
      setViewAllEmployees(true)
    }
  }, [employees, selectedEmployeeId, viewAllEmployees])

  // Load leave requests when employee or filter changes
  useEffect(() => {
    if (selectedEmployeeId || viewAllEmployees) {
      loadLeaveRequests()
    }
  }, [selectedEmployeeId, viewAllEmployees, statusFilter, currentPage])

  // Load leave balance when employee or year changes
  useEffect(() => {
    if (!viewAllEmployees && selectedEmployeeId) {
      loadLeaveBalance()
    } else {
      setLeaveBalances([])
    }
  }, [selectedEmployeeId, selectedYear, viewAllEmployees])

  // Recalculate stats when balances change
  useEffect(() => {
    if (leaveRequests.length > 0) {
      calculateStats(leaveRequests)
    }
  }, [leaveBalances])

  return (
    <div className="p-6">
      {/* Error Alert */}
      {error && (
        <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div>
            <h2 className="text-2xl font-semibold mb-1 text-gradient">Quản lý nghỉ phép</h2>
            <p className="text-muted-foreground">
              Quản lý đơn xin nghỉ và số ngày phép của toàn bộ nhân viên
            </p>
          </div>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (open) {
              // Khi mở form tạo đơn, mặc định chọn nhân viên đang filter (nếu có)
              if (selectedEmployeeId) {
                setCreateEmployeeId(selectedEmployeeId)
              } else if (employees.length === 1) {
                setCreateEmployeeId(employees[0].id)
              } else {
                setCreateEmployeeId(null)
              }
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo Đơn Nghỉ Phép Mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-employee">Nhân viên *</Label>
                <Select
                  value={createEmployeeId ? createEmployeeId.toString() : ""}
                  onValueChange={(value) =>
                    setCreateEmployeeId(value ? Number(value) : null)
                  }
                >
                  <SelectTrigger id="create-employee">
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="leaveTypeId">Loại phép *</Label>
                <Select
                  value={formData.leaveTypeId.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phép" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {getLeaveTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Từ ngày *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Đến ngày *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="reason">Lý do</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do nghỉ phép"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateLeaveRequest}
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                >
                  {loading ? "Đang tạo..." : "Tạo đơn"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn chờ duyệt</CardTitle>
            <div className="p-2 rounded-full bg-coral-gradient">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Cần xét duyệt</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt tháng</CardTitle>
            <div className="p-2 rounded-full bg-rose-gradient">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{stats.approvedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Đơn được duyệt</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang nghỉ</CardTitle>
            <Plane className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeaveToday}</div>
            <p className="text-xs text-muted-foreground">Nhân viên nghỉ phép</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ sử dụng phép</CardTitle>
            <Calendar className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">Trung bình năm</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
          <TabsTrigger value="requests">Đơn xin nghỉ</TabsTrigger>
          <TabsTrigger value="types">Loại phép</TabsTrigger>
          <TabsTrigger value="balance">Số ngày phép</TabsTrigger>
          <TabsTrigger value="calendar">Lịch nghỉ phép</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Danh sách đơn xin nghỉ</h3>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as LeaveStatus | "ALL")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value={LeaveStatus.PENDING}>Chờ duyệt</SelectItem>
                  <SelectItem value={LeaveStatus.APPROVED}>Đã duyệt</SelectItem>
                  <SelectItem value={LeaveStatus.REJECTED}>Từ chối</SelectItem>
                  <SelectItem value={LeaveStatus.CANCELLED}>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn nghỉ phép
              </Button>
            </div>
          </div>

          {loading && leaveRequests.length === 0 ? (
            <LoadingPage message="Đang tải danh sách đơn nghỉ phép..." />
          ) : !loading && leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không có đơn nghỉ phép nào</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-gradient shadow-vibrant">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Loại phép</TableHead>
                      <TableHead>Từ ngày</TableHead>
                      <TableHead>Đến ngày</TableHead>
                      <TableHead>Số ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.employeeName || `ID: ${request.employeeId}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.leaveTypeName || request.leaveTypeCode || `ID: ${request.leaveTypeId}`}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.startDate}</TableCell>
                        <TableCell>{request.endDate}</TableCell>
                        <TableCell>{request.totalDays} ngày</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* View Details Button - Always visible */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600"
                              onClick={() => openViewDialog(request)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Xem
                            </Button>

                            {request.status === LeaveStatus.PENDING && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => openApproveDialog(request)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => {
                                    const reason = prompt("Nhập lý do từ chối:")
                                    if (reason) handleRejectLeaveRequest(request.id, reason)
                                  }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                            {(request.status === LeaveStatus.PENDING || request.status === LeaveStatus.APPROVED) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(request)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Sửa
                              </Button>
                            )}
                            {request.status === LeaveStatus.PENDING && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600"
                                onClick={() => handleCancelLeaveRequest(request.id)}
                              >
                                Hủy
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDeleteLeaveRequest(request.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage < 3 ? i : currentPage - 2 + i
                        if (page >= totalPages) return null
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                          className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quản lý loại phép</h3>
          </div>

          {leaveTypesLoading && leaveTypes.length === 0 ? (
            <LoadingPage message="Đang tải danh sách loại phép..." />
          ) : !leaveTypesLoading && leaveTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không có loại phép nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leaveTypes.map((type) => {
                const friendlyLabel = getLeaveTypeLabel(type)
                // Get color based on leave type code
                const getTypeColor = (code: string) => {
                  switch (code.toUpperCase()) {
                    case 'ANNUAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    case 'SICK': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    case 'MATERNITY': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                    case 'UNPAID': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    default: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  }
                }

                return (
                  <Card key={type.id} className="shadow-vibrant hover-glow border-gradient">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{friendlyLabel}</CardTitle>
                          {type.name && type.name !== friendlyLabel && (
                            <p className="text-sm text-muted-foreground mt-1">{type.name}</p>
                          )}
                        </div>
                        <Badge className={getTypeColor(type.code)}>
                          {type.maxDaysPerYear} ngày/năm
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {type.description && (
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Có lương:</span>
                            <Badge variant={type.isPaid ? "default" : "secondary"}>
                              {type.isPaid ? "Có" : "Không"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Cần duyệt:</span>
                            <Badge variant={type.requiresApproval ? "default" : "secondary"}>
                              {type.requiresApproval ? "Có" : "Không"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Chuyển năm:</span>
                            <Badge variant={type.carryForward ? "default" : "secondary"}>
                              {type.carryForward ? "Có" : "Không"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Trạng thái:</span>
                            <Badge variant={type.active ? "default" : "secondary"}>
                              {type.active ? "Hoạt động" : "Tạm dừng"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Số ngày phép còn lại - Năm {selectedYear}</h3>
            <div className="flex gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {balanceLoading && leaveBalances.length === 0 ? (
            <LoadingPage message="Đang tải số dư phép..." />
          ) : !balanceLoading && leaveBalances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không có dữ liệu số dư nghỉ phép</p>
            </div>
          ) : (
            <div className="rounded-md border border-gradient shadow-vibrant">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                    <TableHead>Loại phép</TableHead>
                    <TableHead>Tổng quyền lợi</TableHead>
                    <TableHead>Đã sử dụng</TableHead>
                    <TableHead>Còn lại</TableHead>
                    <TableHead>Chuyển năm</TableHead>
                    <TableHead>Tiến độ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveBalances.map((balance) => {
                    const usagePercent = balance.totalEntitlement > 0
                      ? Math.round((balance.usedDays / balance.totalEntitlement) * 100)
                      : 0

                    return (
                      <TableRow key={balance.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{balance.leaveTypeName || balance.leaveTypeCode}</div>
                            <div className="text-xs text-muted-foreground">
                              {balance.employeeName || `ID: ${balance.employeeId}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{balance.totalEntitlement} ngày</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            {balance.usedDays} ngày
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {balance.remainingDays} ngày
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {balance.carryForwardDays > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {balance.carryForwardDays} ngày
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${usagePercent >= 80
                                  ? 'bg-red-600'
                                  : usagePercent >= 50
                                    ? 'bg-orange-600'
                                    : 'bg-green-600'
                                  }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">{usagePercent}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <h3 className="text-lg font-semibold">Lịch nghỉ phép tháng 10/2024</h3>

          <Card className="shadow-vibrant hover-glow border-gradient">
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 text-center">
                {/* Header */}
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                  <div key={day} className="font-semibold p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const hasLeave = [15, 16, 20, 21, 22].includes(day)
                  return (
                    <div
                      key={day}
                      className={`p-2 border rounded ${hasLeave ? 'bg-orange-100 dark:bg-orange-900' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} cursor-pointer`}
                    >
                      <div className="font-medium">{day}</div>
                      {hasLeave && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">Nghỉ phép</div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900 rounded"></div>
                  <span>Ngày nghỉ phép</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  <span>Ngày làm việc</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Phê duyệt đơn nghỉ phép</DialogTitle>
          </DialogHeader>
          {approvingLeaveRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nhân viên:</span>
                  <span className="text-sm font-medium">
                    {approvingLeaveRequest.employeeName || `ID: ${approvingLeaveRequest.employeeId}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Loại phép:</span>
                  <span className="text-sm font-medium">
                    {approvingLeaveRequest.leaveTypeName || approvingLeaveRequest.leaveTypeCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Thời gian:</span>
                  <span className="text-sm font-medium">
                    {approvingLeaveRequest.startDate} → {approvingLeaveRequest.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Số ngày:</span>
                  <span className="text-sm font-medium">{approvingLeaveRequest.totalDays} ngày</span>
                </div>
                {approvingLeaveRequest.reason && (
                  <div>
                    <span className="text-sm text-muted-foreground">Lý do:</span>
                    <p className="text-sm mt-1">{approvingLeaveRequest.reason}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="action">Quyết định *</Label>
                <Select
                  value={approveFormData.action}
                  onValueChange={(value: "APPROVE" | "REJECT") =>
                    setApproveFormData(prev => ({ ...prev, action: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">Phê duyệt</SelectItem>
                    <SelectItem value="REJECT">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comments">Ghi chú</Label>
                <Textarea
                  id="comments"
                  value={approveFormData.comments}
                  onChange={(e) => setApproveFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleApproveLeaveRequest}
                  disabled={loading}
                  className={approveFormData.action === "APPROVE" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {loading ? "Đang xử lý..." : approveFormData.action === "APPROVE" ? "Phê duyệt" : "Từ chối"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle>
          </DialogHeader>
          {viewingLeaveRequest && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">Thông tin nhân viên</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Tên nhân viên:</span>
                    <p className="text-sm font-medium">
                      {viewingLeaveRequest.employeeName || `ID: ${viewingLeaveRequest.employeeId}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Mã nhân viên:</span>
                    <p className="text-sm font-medium">{viewingLeaveRequest.employeeId}</p>
                  </div>
                </div>
              </div>

              {/* Leave Request Information */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm mb-3 text-green-900 dark:text-green-100">Thông tin đơn nghỉ phép</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Loại phép:</span>
                    <p className="text-sm font-medium">
                      <Badge variant="outline">
                        {viewingLeaveRequest.leaveTypeName || viewingLeaveRequest.leaveTypeCode || `ID: ${viewingLeaveRequest.leaveTypeId}`}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Trạng thái:</span>
                    <p className="text-sm font-medium">{getStatusBadge(viewingLeaveRequest.status)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Từ ngày:</span>
                    <p className="text-sm font-medium">{viewingLeaveRequest.startDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Đến ngày:</span>
                    <p className="text-sm font-medium">{viewingLeaveRequest.endDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Số ngày nghỉ:</span>
                    <p className="text-sm font-medium text-blue-600">{viewingLeaveRequest.totalDays} ngày</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Ngày tạo:</span>
                    <p className="text-sm font-medium">
                      {viewingLeaveRequest.createdAt ? new Date(viewingLeaveRequest.createdAt).toLocaleString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              {viewingLeaveRequest.reason && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">Lý do nghỉ phép</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingLeaveRequest.reason}</p>
                </div>
              )}

              {/* Approval Information */}
              {(viewingLeaveRequest.status === LeaveStatus.APPROVED || viewingLeaveRequest.status === LeaveStatus.REJECTED) && (
                <div className={`p-4 rounded-lg ${viewingLeaveRequest.status === LeaveStatus.APPROVED
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                  <h3 className={`font-semibold text-sm mb-3 ${viewingLeaveRequest.status === LeaveStatus.APPROVED
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                    }`}>
                    {viewingLeaveRequest.status === LeaveStatus.APPROVED ? 'Thông tin phê duyệt' : 'Thông tin từ chối'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Người {viewingLeaveRequest.status === LeaveStatus.APPROVED ? 'phê duyệt' : 'từ chối'}:</span>
                      <p className="text-sm font-medium">
                        {viewingLeaveRequest.approverName || `ID: ${viewingLeaveRequest.approverId || 'N/A'}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Thời gian:</span>
                      <p className="text-sm font-medium">
                        {(() => {
                          const approvedAt = viewingLeaveRequest.approvedAt
                          const rejectedAt = (viewingLeaveRequest as any).rejectedAt
                          if (approvedAt) return new Date(approvedAt).toLocaleString('vi-VN')
                          if (rejectedAt) return new Date(rejectedAt).toLocaleString('vi-VN')
                          return 'N/A'
                        })()}
                      </p>
                    </div>
                  </div>
                  {viewingLeaveRequest.approverComments && (
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground">Ghi chú:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingLeaveRequest.approverComments}</p>
                    </div>
                  )}
                  {viewingLeaveRequest.rejectionReason && (
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground">Lý do từ chối:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap text-red-600 dark:text-red-400">{viewingLeaveRequest.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Cancel Information */}
              {viewingLeaveRequest.status === LeaveStatus.CANCELLED && viewingLeaveRequest.cancelledAt && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">Thông tin hủy</h3>
                  <p className="text-sm text-muted-foreground">
                    Đã hủy vào: {new Date(viewingLeaveRequest.cancelledAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đơn nghỉ phép</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-leaveTypeId">Loại phép *</Label>
              <Select
                value={formData.leaveTypeId.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại phép" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {getLeaveTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-startDate">Từ ngày *</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-endDate">Đến ngày *</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-reason">Lý do</Label>
              <Textarea
                id="edit-reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Nhập lý do nghỉ phép"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateLeaveRequest} disabled={loading}>
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
