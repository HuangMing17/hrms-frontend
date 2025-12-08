"use client"

import { useState, useEffect } from "react"
import { DollarSign, Calculator, FileText, TrendingUp, Download, Plus, Edit, Trash2, Eye, Check, CheckCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Alert, AlertDescription } from "./ui/alert"
import { LoadingTable, LoadingSpinner } from "./ui/loading"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"
import { employeeAPI, Employee } from "../lib/api/employee"
import { salaryAPI, SalaryResponse, CreateSalaryRequest, UpdateSalaryRequest, PayFrequency } from "../lib/api/salary"
import { payrollAPI, PayrollResponse, CalculatePayrollRequest, PayrollSummaryResponse, PayrollStatus, PayrollPreviewResponse, DeductionDetail } from "../lib/api/payroll"
import { positionAPI, Position } from "../lib/api/position"
import { allowanceAPI, AllowanceResponse, CreateAllowanceRequest, UpdateAllowanceRequest, AllowanceType } from "../lib/api/allowance"
import { employeeAllowanceAPI, EmployeeAllowanceResponse, CreateEmployeeAllowanceRequest, UpdateEmployeeAllowanceRequest } from "../lib/api/employee-allowance"

// Hardcoded data - sẽ được thay thế bằng API calls trong tương lai
const salaryData: any[] = [] // TODO: Implement API for payslips

const payrollHistory: any[] = [] // TODO: Implement API for payroll history report

export function PayrollManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState("payroll")

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaries, setSalaries] = useState<SalaryResponse[]>([])
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([])
  const [currentSalary, setCurrentSalary] = useState<SalaryResponse | null>(null)
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummaryResponse | null>(null)
  const [allowances, setAllowances] = useState<AllowanceResponse[]>([])
  const [employeeAllowances, setEmployeeAllowances] = useState<EmployeeAllowanceResponse[]>([])
  const [selectedEmployeeForAllowance, setSelectedEmployeeForAllowance] = useState<number | null>(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Dialog states - Salary
  const [isCreateSalaryDialogOpen, setIsCreateSalaryDialogOpen] = useState(false)
  const [isEditSalaryDialogOpen, setIsEditSalaryDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [editingSalary, setEditingSalary] = useState<SalaryResponse | null>(null)

  // Dialog states - Payroll
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollResponse | null>(null)
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false)
  const [isEditPayrollDialogOpen, setIsEditPayrollDialogOpen] = useState(false)
  const [isDeletePayrollConfirmOpen, setIsDeletePayrollConfirmOpen] = useState(false)
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<PayrollResponse | null>(null)
  const [deletingPayrollId, setDeletingPayrollId] = useState<number | null>(null)
  const [deletingSalaryId, setDeletingSalaryId] = useState<number | null>(null)

  // Dialog states - Employee Allowance
  const [isCreateEmployeeAllowanceDialogOpen, setIsCreateEmployeeAllowanceDialogOpen] = useState(false)
  const [isEditEmployeeAllowanceDialogOpen, setIsEditEmployeeAllowanceDialogOpen] = useState(false)
  const [isDeleteEmployeeAllowanceConfirmOpen, setIsDeleteEmployeeAllowanceConfirmOpen] = useState(false)
  const [editingEmployeeAllowance, setEditingEmployeeAllowance] = useState<EmployeeAllowanceResponse | null>(null)
  const [deletingEmployeeAllowanceId, setDeletingEmployeeAllowanceId] = useState<number | null>(null)

  // Dialog states - Allowance
  const [isEditAllowanceDialogOpen, setIsEditAllowanceDialogOpen] = useState(false)
  const [isDeleteAllowanceConfirmOpen, setIsDeleteAllowanceConfirmOpen] = useState(false)
  const [editingAllowance, setEditingAllowance] = useState<AllowanceResponse | null>(null)
  const [deletingAllowanceId, setDeletingAllowanceId] = useState<number | null>(null)

  // Employee Allowance form state
  const [employeeAllowanceForm, setEmployeeAllowanceForm] = useState<CreateEmployeeAllowanceRequest>({
    employeeId: 0,
    allowanceId: 0,
    customAmount: undefined,
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: undefined,
    notes: ""
  })

  // Allowance form state
  const [allowanceForm, setAllowanceForm] = useState<CreateAllowanceRequest>({
    name: "",
    description: "",
    type: AllowanceType.FIXED,
    amount: 0,
    taxable: true,
    active: true
  })

  // Form state
  const [salaryForm, setSalaryForm] = useState<CreateSalaryRequest>({
    baseSalary: 0,
    grossSalary: 0,
    currency: "VND",
    payFrequency: PayFrequency.MONTHLY,
    effectiveDate: "",
    active: true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đã thanh toán":
      case "PAID":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Đã thanh toán</Badge>
      case "Chờ thanh toán":
      case "PENDING_APPROVAL":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Chờ phê duyệt</Badge>
      case "PROCESSED":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Đã xử lý</Badge>
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Nháp</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Đã hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Data fetching functions
  const loadEmployees = async () => {
    try {
      const response = await employeeAPI.getAllEmployees(0, 100)
      setEmployees(response.employees || [])
    } catch (err: any) {
      console.error('Error loading employees:', err)
      setError(err.response?.data?.message || 'Không thể tải danh sách nhân viên')
      setEmployees([]) // Set empty array on error
    }
  }

  const loadCurrentSalary = async (employeeId: number) => {
    setLoading(true)
    try {
      const salary = await salaryAPI.getCurrentSalary(employeeId)
      setCurrentSalary(salary)
      setError(null)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setCurrentSalary(null) // Nhân viên chưa có salary
      } else {
        console.error('Error loading current salary:', err)
        setError(err.response?.data?.message || 'Không thể tải thông tin lương hiện tại')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadSalaryHistory = async (employeeId: number) => {
    setLoading(true)
    try {
      const history = await salaryAPI.getSalaryHistory(employeeId)
      setSalaries(Array.isArray(history) ? history : [])
      setError(null)
    } catch (err: any) {
      console.error('Error loading salary history:', err)
      setError(err.response?.data?.message || 'Không thể tải lịch sử lương')
      setSalaries([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadPayrollSummary = async (month: number, year: number, departmentId?: number) => {
    setLoading(true)
    try {
      const summary = await payrollAPI.getPayrollSummary(month, year, departmentId)
      setPayrollSummary(summary)
      // Load payrolls from summary response
      if (summary.payrolls && summary.payrolls.length > 0) {
        setPayrolls(summary.payrolls)
        setIsPreviewMode(false) // Khi có payroll thật thì tắt preview mode
      }
      setError(null)
    } catch (err: any) {
      console.error('Error loading payroll summary:', err)
      setError(err.response?.data?.message || 'Không thể tải báo cáo tổng hợp')
    } finally {
      setLoading(false)
    }
  }

  // useEffect hooks
  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      loadCurrentSalary(selectedEmployee)
      loadSalaryHistory(selectedEmployee)
      loadEmployeePositionSalary(selectedEmployee)
    }
  }, [selectedEmployee])

  // Load employee position và auto-fill baseSalary từ position
  const loadEmployeePositionSalary = async (employeeId: number) => {
    try {
      const employee = await employeeAPI.getEmployeeById(employeeId)

      if (employee.positionId) {
        const position = await positionAPI.getPositionById(employee.positionId)

        if (position.baseSalary && position.baseSalary > 0) {
          // Auto-fill baseSalary và grossSalary từ position
          setSalaryForm(prev => ({
            ...prev,
            baseSalary: position.baseSalary || 0,
            grossSalary: position.baseSalary || 0 // Gross = Base by default
          }))
        }
      }
    } catch (err: any) {
      console.error('Error loading employee position:', err)
      // Không hiển thị error vì đây chỉ là auto-fill
    }
  }

  useEffect(() => {
    // Không load payrolls tự động vì backend không có endpoint GET /payrolls
    // User sẽ click "Tính lương tự động" để load payrolls
    loadPayrollSummary(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear])

  // Load allowances when allowances tab is active
  useEffect(() => {
    if (activeTab === "allowances") {
      loadAllowances()
    }
  }, [activeTab])

  // Load employee allowances when employee-allowances tab is active
  useEffect(() => {
    if (activeTab === "employee-allowances") {
      loadEmployees()
      loadAllowances()
      if (selectedEmployeeForAllowance) {
        loadEmployeeAllowances(selectedEmployeeForAllowance)
      }
    }
  }, [activeTab, selectedEmployeeForAllowance])

  const loadAllowances = async () => {
    setLoading(true)
    try {
      const data = await allowanceAPI.getAllAllowances()
      setAllowances(data)
      setError(null)
    } catch (err: any) {
      console.error('Error loading allowances:', err)
      setError(err.response?.data?.message || 'Không thể tải danh sách phụ cấp')
      setAllowances([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAllowance = async () => {
    // Validation
    if (!allowanceForm.name || allowanceForm.name.trim() === "") {
      setError("Tên phụ cấp không được để trống")
      return
    }

    if (allowanceForm.amount <= 0) {
      setError("Mức phụ cấp phải lớn hơn 0")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await allowanceAPI.createAllowance(allowanceForm)
      // Reset form
      setAllowanceForm({
        name: "",
        description: "",
        type: AllowanceType.FIXED,
        amount: 0,
        taxable: true,
        active: true
      })
      // Reload allowances
      await loadAllowances()
    } catch (err: any) {
      console.error('Error creating allowance:', err)
      setError(err.response?.data?.message || 'Không thể tạo phụ cấp')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAllowance = async () => {
    if (!editingAllowance) return

    // Validation
    if (allowanceForm.name && allowanceForm.name.trim() === "") {
      setError("Tên phụ cấp không được để trống")
      return
    }

    if (allowanceForm.amount !== undefined && allowanceForm.amount <= 0) {
      setError("Mức phụ cấp phải lớn hơn 0")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: UpdateAllowanceRequest = {
        name: allowanceForm.name || undefined,
        description: allowanceForm.description || undefined,
        type: allowanceForm.type || undefined,
        amount: allowanceForm.amount > 0 ? allowanceForm.amount : undefined,
        taxable: allowanceForm.taxable,
        active: allowanceForm.active
      }
      await allowanceAPI.updateAllowance(editingAllowance.id, updateData)
      setIsEditAllowanceDialogOpen(false)
      setEditingAllowance(null)
      // Reset form
      setAllowanceForm({
        name: "",
        description: "",
        type: AllowanceType.FIXED,
        amount: 0,
        taxable: true,
        active: true
      })
      // Reload allowances
      await loadAllowances()
    } catch (err: any) {
      console.error('Error updating allowance:', err)
      setError(err.response?.data?.message || 'Không thể cập nhật phụ cấp')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAllowance = async () => {
    if (!deletingAllowanceId) return

    setLoading(true)
    setError(null)

    try {
      await allowanceAPI.deleteAllowance(deletingAllowanceId)
      setIsDeleteAllowanceConfirmOpen(false)
      setDeletingAllowanceId(null)
      // Reload allowances
      await loadAllowances()
    } catch (err: any) {
      console.error('Error deleting allowance:', err)
      setError(err.response?.data?.message || 'Không thể xóa phụ cấp')
    } finally {
      setLoading(false)
    }
  }

  const openEditAllowanceDialog = (allowance: AllowanceResponse) => {
    setEditingAllowance(allowance)
    setAllowanceForm({
      name: allowance.name,
      description: allowance.description || "",
      type: allowance.type,
      amount: allowance.amount,
      taxable: allowance.taxable,
      active: allowance.active
    })
    setIsEditAllowanceDialogOpen(true)
  }

  const openDeleteAllowanceDialog = (id: number) => {
    setDeletingAllowanceId(id)
    setIsDeleteAllowanceConfirmOpen(true)
  }

  // Employee Allowance functions
  const loadEmployeeAllowances = async (employeeId: number) => {
    setLoading(true)
    try {
      const data = await employeeAllowanceAPI.getEmployeeAllowances(employeeId)
      setEmployeeAllowances(data)
      setError(null)
    } catch (err: any) {
      console.error('Error loading employee allowances:', err)
      setError(err.response?.data?.message || 'Không thể tải danh sách phụ cấp của nhân viên')
      setEmployeeAllowances([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmployeeAllowance = async () => {
    // Validation
    if (!employeeAllowanceForm.employeeId || employeeAllowanceForm.employeeId <= 0) {
      setError("Vui lòng chọn nhân viên")
      return
    }

    if (!employeeAllowanceForm.allowanceId || employeeAllowanceForm.allowanceId <= 0) {
      setError("Vui lòng chọn loại phụ cấp")
      return
    }

    if (!employeeAllowanceForm.effectiveDate) {
      setError("Vui lòng chọn ngày hiệu lực")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await employeeAllowanceAPI.createEmployeeAllowance(employeeAllowanceForm)
      // Reset form
      setEmployeeAllowanceForm({
        employeeId: selectedEmployeeForAllowance || 0,
        allowanceId: 0,
        customAmount: undefined,
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
        notes: ""
      })
      setIsCreateEmployeeAllowanceDialogOpen(false)
      // Reload employee allowances
      if (selectedEmployeeForAllowance) {
        await loadEmployeeAllowances(selectedEmployeeForAllowance)
      }
    } catch (err: any) {
      console.error('Error creating employee allowance:', err)
      setError(err.response?.data?.message || 'Không thể gán phụ cấp cho nhân viên')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmployeeAllowance = async () => {
    if (!editingEmployeeAllowance) return

    setLoading(true)
    setError(null)

    try {
      const updateData: UpdateEmployeeAllowanceRequest = {
        customAmount: employeeAllowanceForm.customAmount,
        effectiveDate: employeeAllowanceForm.effectiveDate,
        endDate: employeeAllowanceForm.endDate,
        notes: employeeAllowanceForm.notes
      }
      await employeeAllowanceAPI.updateEmployeeAllowance(editingEmployeeAllowance.id, updateData)
      setIsEditEmployeeAllowanceDialogOpen(false)
      setEditingEmployeeAllowance(null)
      // Reload employee allowances
      if (selectedEmployeeForAllowance) {
        await loadEmployeeAllowances(selectedEmployeeForAllowance)
      }
    } catch (err: any) {
      console.error('Error updating employee allowance:', err)
      setError(err.response?.data?.message || 'Không thể cập nhật phụ cấp')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployeeAllowance = async () => {
    if (!deletingEmployeeAllowanceId) return

    setLoading(true)
    setError(null)

    try {
      await employeeAllowanceAPI.deleteEmployeeAllowance(deletingEmployeeAllowanceId)
      setIsDeleteEmployeeAllowanceConfirmOpen(false)
      setDeletingEmployeeAllowanceId(null)
      // Reload employee allowances
      if (selectedEmployeeForAllowance) {
        await loadEmployeeAllowances(selectedEmployeeForAllowance)
      }
    } catch (err: any) {
      console.error('Error deleting employee allowance:', err)
      setError(err.response?.data?.message || 'Không thể xóa phụ cấp')
    } finally {
      setLoading(false)
    }
  }

  const openEditEmployeeAllowanceDialog = (employeeAllowance: EmployeeAllowanceResponse) => {
    setEditingEmployeeAllowance(employeeAllowance)
    setEmployeeAllowanceForm({
      employeeId: employeeAllowance.employeeId,
      allowanceId: employeeAllowance.allowanceId,
      customAmount: employeeAllowance.customAmount,
      effectiveDate: employeeAllowance.effectiveDate,
      endDate: employeeAllowance.endDate || undefined,
      notes: employeeAllowance.notes || ""
    })
    setIsEditEmployeeAllowanceDialogOpen(true)
  }

  const openDeleteEmployeeAllowanceDialog = (id: number) => {
    setDeletingEmployeeAllowanceId(id)
    setIsDeleteEmployeeAllowanceConfirmOpen(true)
  }

  // CRUD Operations
  const handleCreateSalary = async () => {
    if (!selectedEmployee) {
      setError("Vui lòng chọn nhân viên")
      return
    }

    // Validation
    if (salaryForm.baseSalary <= 0) {
      setError("Lương cơ bản phải lớn hơn 0")
      return
    }

    if (salaryForm.grossSalary <= 0) {
      setError("Lương gross phải lớn hơn 0")
      return
    }

    if (salaryForm.grossSalary < salaryForm.baseSalary) {
      setError("Lương gross phải lớn hơn hoặc bằng lương cơ bản")
      return
    }

    if (!salaryForm.effectiveDate) {
      setError("Vui lòng chọn ngày hiệu lực")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await salaryAPI.createSalary(selectedEmployee, salaryForm)
      setIsCreateSalaryDialogOpen(false)
      await loadCurrentSalary(selectedEmployee)
      await loadSalaryHistory(selectedEmployee)
      // Reset form
      setSalaryForm({
        baseSalary: 0,
        grossSalary: 0,
        currency: "VND",
        payFrequency: PayFrequency.MONTHLY,
        effectiveDate: "",
        active: true
      })
    } catch (err: any) {
      console.error('Error creating salary:', err)
      setError(err.response?.data?.message || 'Không thể tạo salary')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSalary = async () => {
    if (!editingSalary) return

    setLoading(true)
    setError(null)

    try {
      await salaryAPI.updateSalary(editingSalary.id, salaryForm)
      setIsEditSalaryDialogOpen(false)
      await loadCurrentSalary(editingSalary.employeeId)
      await loadSalaryHistory(editingSalary.employeeId)
      setEditingSalary(null)
    } catch (err: any) {
      console.error('Error updating salary:', err)
      setError(err.response?.data?.message || 'Không thể cập nhật salary')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSalary = async () => {
    if (!deletingSalaryId) return

    setLoading(true)
    setError(null)

    try {
      await salaryAPI.deleteSalary(deletingSalaryId)
      setIsDeleteConfirmOpen(false)
      setDeletingSalaryId(null)
      if (selectedEmployee) {
        await loadCurrentSalary(selectedEmployee)
        await loadSalaryHistory(selectedEmployee)
      }
    } catch (err: any) {
      console.error('Error deleting salary:', err)
      setError(err.response?.data?.message || 'Không thể xóa salary')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewPayroll = async () => {
    setLoading(true)
    setError(null)

    try {
      const previewList = await payrollAPI.previewPayroll(selectedMonth, selectedYear)

      if (!previewList || previewList.length === 0) {
        setPayrolls([])
        setIsPreviewMode(true)
        setError("Chưa có dữ liệu lương tạm tính cho kỳ này.")
        return
      }

      // Map PayrollPreviewResponse sang PayrollResponse để hiển thị
      const nowIso = new Date().toISOString()
      const mapped: PayrollResponse[] = previewList.map((p: PayrollPreviewResponse, index: number) => ({
        id: -1 * (index + 1), // ID ảo chỉ để render, không có trong DB
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        employeeCode: p.employeeCode,
        payPeriodMonth: p.payPeriodMonth,
        payPeriodYear: p.payPeriodYear,
        payDate: undefined,
        baseSalary: Number(p.baseSalary || 0),
        totalAllowances: Number(p.totalAllowances || 0),
        overtimePay: Number(p.overtimePay || 0),
        totalDeductions: Number(p.totalDeductions || 0),
        grossPay: Number(p.grossPay || 0),
        netPay: Number(p.netPay || 0),
        status: (p.status as PayrollStatus) || PayrollStatus.DRAFT,
        payslipPath: undefined,
        processedAt: undefined,
        createdAt: nowIso,
        updatedAt: nowIso
      }))

      setPayrolls(mapped)
      setIsPreviewMode(true)
      setError(null)
    } catch (err: any) {
      console.error('Error previewing payroll:', err)
      setError(err.response?.data?.message || 'Không thể tải lương tạm tính')
      setPayrolls([])
      setIsPreviewMode(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculatePayroll = async () => {
    setLoading(true)
    setError(null)

    try {
      // Lấy tất cả employee IDs có salary
      const employeeIds = employees.map(emp => emp.id)

      if (employeeIds.length === 0) {
        setError('Không có nhân viên nào để tính lương')
        setLoading(false)
        return
      }

      const request: CalculatePayrollRequest = {
        payPeriodMonth: selectedMonth,
        payPeriodYear: selectedYear,
        employeeIds: employeeIds, // Gửi list employee IDs
        includeOvertime: true,
        includeAllowances: true,
        includeDeductions: true
      }

      const results = await payrollAPI.calculatePayroll(request)
      setPayrolls(Array.isArray(results) ? results : [])
      setIsPreviewMode(false) // Sau khi tính lương thật thì tắt preview mode

      // Reload summary to get updated data
      await loadPayrollSummary(selectedMonth, selectedYear)

      if (results.length === 0) {
        setError('Không có nhân viên nào có salary để tính lương. Vui lòng tạo salary cho nhân viên trước.')
      }
    } catch (err: any) {
      console.error('Error calculating payroll:', err)
      setError(err.response?.data?.message || 'Không thể tính lương')
      setPayrolls([]) // Set empty array on error
      setIsPreviewMode(false)
    } finally {
      setLoading(false)
    }
  }

  // Payroll Actions
  const handleViewPayrollDetails = async (payrollId: number) => {
    // Nếu là preview mode hoặc ID ảo (âm), chỉ hiển thị từ data hiện có
    if (isPreviewMode || payrollId < 0) {
      const payroll = payrolls.find(p => p.id === payrollId)
      if (payroll) {
        setSelectedPayroll(payroll)
        setIsViewDetailsDialogOpen(true)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payroll = await payrollAPI.getPayroll(payrollId)
      setSelectedPayroll(payroll)
      setIsViewDetailsDialogOpen(true)
    } catch (err: any) {
      console.error('Error fetching payroll details:', err)
      setError(err.response?.data?.message || 'Không thể tải thông tin bảng lương')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayroll = async () => {
    if (!selectedPayroll) return

    setLoading(true)
    setError(null)

    try {
      // Get current user ID from localStorage or auth context
      // For now, using a placeholder - should be replaced with actual user ID
      const currentUserId = 1 // TODO: Get from auth context

      await payrollAPI.approvePayroll(selectedPayroll.id, currentUserId)
      setIsApproveConfirmOpen(false)
      setSelectedPayroll(null)

      // Reload summary to get updated payrolls
      await loadPayrollSummary(selectedMonth, selectedYear)
    } catch (err: any) {
      console.error('Error approving payroll:', err)
      setError(err.response?.data?.message || 'Không thể phê duyệt bảng lương')
    } finally {
      setLoading(false)
    }
  }

  const handleCompletePayroll = async () => {
    if (!selectedPayroll) return

    setLoading(true)
    setError(null)

    try {
      await payrollAPI.completePayroll(selectedPayroll.id)
      setIsCompleteConfirmOpen(false)
      setSelectedPayroll(null)

      // Reload summary to get updated payrolls
      await loadPayrollSummary(selectedMonth, selectedYear)
    } catch (err: any) {
      console.error('Error completing payroll:', err)
      setError(err.response?.data?.message || 'Không thể hoàn tất thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPayslipEmail = async (payrollId: number) => {
    setLoading(true)
    setError(null)

    try {
      const currentUserId = 1 // TODO: Get from auth context
      await payrollAPI.sendPayslipEmail(payrollId, {
        sentBy: currentUserId,
        customSubject: `Bảng lương tháng ${selectedMonth}/${selectedYear}`,
        customMessage: "Kính gửi anh/chị, đây là bảng lương của bạn."
      })
      // Show success message
      setError(null)
      alert('Email đã được gửi thành công!')
    } catch (err: any) {
      console.error('Error sending payslip email:', err)
      setError(err.response?.data?.message || 'Không thể gửi email')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePayroll = async () => {
    if (!editingPayroll) return

    setLoading(true)
    setError(null)

    try {
      const request: CalculatePayrollRequest = {
        payPeriodMonth: editingPayroll.payPeriodMonth,
        payPeriodYear: editingPayroll.payPeriodYear,
        employeeIds: [editingPayroll.employeeId],
        includeOvertime: true,
        includeAllowances: true,
        includeDeductions: true
      }

      await payrollAPI.updatePayroll(editingPayroll.id, request)
      setIsEditPayrollDialogOpen(false)
      setEditingPayroll(null)

      // Reload summary to get updated payrolls
      await loadPayrollSummary(selectedMonth, selectedYear)
    } catch (err: any) {
      console.error('Error updating payroll:', err)
      setError(err.response?.data?.message || 'Không thể cập nhật bảng lương')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayroll = async () => {
    if (!deletingPayrollId) return

    setLoading(true)
    setError(null)

    try {
      await payrollAPI.deletePayroll(deletingPayrollId)
      setIsDeletePayrollConfirmOpen(false)
      setDeletingPayrollId(null)

      // Remove from list
      setPayrolls(payrolls.filter(p => p.id !== deletingPayrollId))
    } catch (err: any) {
      console.error('Error deleting payroll:', err)
      setError(err.response?.data?.message || 'Không thể xóa bảng lương')
    } finally {
      setLoading(false)
    }
  }

  const openApproveDialog = (payroll: PayrollResponse) => {
    setSelectedPayroll(payroll)
    setIsApproveConfirmOpen(true)
  }

  const openCompleteDialog = (payroll: PayrollResponse) => {
    setSelectedPayroll(payroll)
    setIsCompleteConfirmOpen(true)
  }

  const openEditPayrollDialog = (payroll: PayrollResponse) => {
    setEditingPayroll(payroll)
    setIsEditPayrollDialogOpen(true)
  }

  const openDeletePayrollDialog = (payrollId: number) => {
    setDeletingPayrollId(payrollId)
    setIsDeletePayrollConfirmOpen(true)
  }

  const openEditDialog = (salary: SalaryResponse) => {
    setEditingSalary(salary)
    setSalaryForm({
      baseSalary: salary.baseSalary,
      grossSalary: salary.grossSalary,
      currency: salary.currency,
      payFrequency: salary.payFrequency,
      effectiveDate: salary.effectiveDate,
      endDate: salary.endDate,
      active: salary.active
    })
    setIsEditSalaryDialogOpen(true)
  }

  const openDeleteDialog = (salaryId: number) => {
    setDeletingSalaryId(salaryId)
    setIsDeleteConfirmOpen(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Quản lý lương</h2>
        <p className="text-muted-foreground">Quản lý bảng lương, phụ cấp và thanh toán</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200 flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Đóng
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Create Salary Dialog */}
      <Dialog open={isCreateSalaryDialogOpen} onOpenChange={setIsCreateSalaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo lương mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nhân viên *</Label>
              <Select
                value={selectedEmployee?.toString()}
                onValueChange={(value) => setSelectedEmployee(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.fullName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Lương cơ bản (VND) *</Label>
              <Input
                type="number"
                value={salaryForm.baseSalary}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  baseSalary: Number(e.target.value)
                }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Lương gross (VND) *</Label>
              <Input
                type="number"
                value={salaryForm.grossSalary}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  grossSalary: Number(e.target.value)
                }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Tần suất trả lương *</Label>
              <Select
                value={salaryForm.payFrequency}
                onValueChange={(value) => setSalaryForm(prev => ({
                  ...prev,
                  payFrequency: value as PayFrequency
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Hàng tháng</SelectItem>
                  <SelectItem value="WEEKLY">Hàng tuần</SelectItem>
                  <SelectItem value="BIWEEKLY">Hai tuần một lần</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ngày hiệu lực *</Label>
              <Input
                type="date"
                value={salaryForm.effectiveDate}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  effectiveDate: e.target.value
                }))}
              />
            </div>

            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={salaryForm.endDate || ""}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  endDate: e.target.value || undefined
                }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateSalaryDialogOpen(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateSalary}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Đang tạo..." : "Tạo lương"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Salary Dialog */}
      <Dialog open={isEditSalaryDialogOpen} onOpenChange={setIsEditSalaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật lương</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lương cơ bản (VND) *</Label>
              <Input
                type="number"
                value={salaryForm.baseSalary}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  baseSalary: Number(e.target.value)
                }))}
              />
            </div>

            <div>
              <Label>Lương gross (VND) *</Label>
              <Input
                type="number"
                value={salaryForm.grossSalary}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  grossSalary: Number(e.target.value)
                }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditSalaryDialogOpen(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateSalary}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa salary record này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSalary}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quỹ lương tháng</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollSummary ? formatCurrency(payrollSummary.totalNetPay) : '0 VND'}
            </div>
            <p className="text-xs text-muted-foreground">
              {payrollSummary ? `${payrollSummary.totalEmployees} nhân viên` : 'Chưa có dữ liệu'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lương trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollSummary && payrollSummary.totalEmployees > 0
                ? formatCurrency(payrollSummary.totalNetPay / payrollSummary.totalEmployees)
                : '0 VND'}
            </div>
            <p className="text-xs text-muted-foreground">VND/nhân viên/tháng</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isPreviewMode ? "Đang xem lương tạm tính" : "Chờ thanh toán"}
            </CardTitle>
            <Calculator className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPreviewMode
                ? payrolls.length
                : payrolls.filter(p => p.status === 'DRAFT' || p.status === 'PROCESSED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPreviewMode ? "Nhân viên có lương tạm tính" : "Nhân viên chưa thanh toán"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phiếu lương</CardTitle>
            <FileText className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
            <p className="text-xs text-muted-foreground">Đã tạo tháng này</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
          <TabsTrigger value="payroll">Bảng lương</TabsTrigger>
          <TabsTrigger value="allowances">Loại phụ cấp</TabsTrigger>
          <TabsTrigger value="employee-allowances">Gán phụ cấp</TabsTrigger>
          <TabsTrigger value="payslips">Phiếu lương</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Bảng lương tháng {selectedMonth}/{selectedYear}</h3>
              {isPreviewMode && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  ⚠️ Đang xem lương tạm tính - Dữ liệu chưa được chốt
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(Number(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      Tháng {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                onClick={() => setIsCreateSalaryDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo lương
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                onClick={handlePreviewPayroll}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                {loading && isPreviewMode ? "Đang tải..." : "Xem lương tạm tính"}
              </Button>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                onClick={handleCalculatePayroll}
                disabled={loading}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {loading && !isPreviewMode ? "Đang tính..." : "Tính lương tự động"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-gradient shadow-vibrant">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Lương cơ bản</TableHead>
                  <TableHead>Phụ cấp</TableHead>
                  <TableHead>Làm thêm</TableHead>
                  <TableHead>Thưởng</TableHead>
                  <TableHead>Khấu trừ</TableHead>
                  <TableHead>Thực lĩnh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <LoadingTable colSpan={9} message="Đang tải dữ liệu bảng lương..." />
                ) : payrolls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {isPreviewMode
                        ? "Chưa có dữ liệu lương tạm tính cho kỳ này."
                        : "Chưa có dữ liệu bảng lương. Nhấn \"Xem lương tạm tính\" hoặc \"Tính lương tự động\" để xem/tạo bảng lương."}
                    </TableCell>
                  </TableRow>
                ) : (
                  payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payroll.employeeName || `Nhân viên #${payroll.employeeId}`}</div>
                          <div className="text-sm text-muted-foreground">{payroll.employeeCode || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(payroll.baseSalary)}</TableCell>
                      <TableCell>{formatCurrency(payroll.totalAllowances)}</TableCell>
                      <TableCell>{formatCurrency(payroll.overtimePay)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-red-600">-{formatCurrency(payroll.totalDeductions)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(payroll.netPay)}</TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* View Details - Always visible */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayrollDetails(payroll.id)}
                            title="Xem chi tiết"
                            disabled={isPreviewMode || payroll.id < 0} // Disable nếu là preview hoặc ID ảo
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Approve - Only for DRAFT và không phải preview mode */}
                          {!isPreviewMode && payroll.status === "DRAFT" && payroll.id > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openApproveDialog(payroll)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Phê duyệt"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Complete - Only for PROCESSED và không phải preview mode */}
                          {!isPreviewMode && payroll.status === "PROCESSED" && payroll.id > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCompleteDialog(payroll)}
                              className="text-green-600 hover:text-green-700"
                              title="Hoàn tất thanh toán"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Send Email - For PROCESSED and PAID và không phải preview mode */}
                          {!isPreviewMode && (payroll.status === "PROCESSED" || payroll.status === "PAID") && payroll.id > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendPayslipEmail(payroll.id)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Gửi email phiếu lương"
                              disabled={loading}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Edit - Only for DRAFT và không phải preview mode */}
                          {!isPreviewMode && payroll.status === "DRAFT" && payroll.id > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPayrollDialog(payroll)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Delete - Only for DRAFT và không phải preview mode */}
                          {!isPreviewMode && payroll.status === "DRAFT" && payroll.id > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeletePayrollDialog(payroll.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="allowances" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quản lý phụ cấp</h3>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Thêm phụ cấp
            </Button>
          </div>

          {loading && allowances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải danh sách phụ cấp...
            </div>
          ) : allowances.length === 0 ? (
            <Alert>
              <AlertDescription>
                Chưa có phụ cấp nào. Hãy tạo phụ cấp mới bên dưới.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allowances.map((allowance) => (
                <Card key={allowance.id} className="shadow-vibrant hover-glow border-gradient">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{allowance.name}</CardTitle>
                      <Badge variant={allowance.type === AllowanceType.FIXED ? "default" : "secondary"}>
                        {allowance.type === AllowanceType.FIXED ? "Cố định" :
                          allowance.type === AllowanceType.PERCENTAGE ? "Theo phần trăm" : "Biến động"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mức phụ cấp:</span>
                        <span className="font-semibold">{formatCurrency(Number(allowance.amount))}</span>
                      </div>
                      {allowance.description && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Mô tả:</span>
                          <span className="text-sm">{allowance.description}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Chịu thuế:</span>
                        <Badge variant={allowance.taxable ? "default" : "secondary"}>
                          {allowance.taxable ? "Có" : "Không"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Trạng thái:</span>
                        <Badge variant={allowance.active ? "default" : "secondary"}>
                          {allowance.active ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditAllowanceDialog(allowance)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteAllowanceDialog(allowance.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-6 shadow-vibrant hover-glow border-gradient">
            <CardHeader>
              <CardTitle>Thêm phụ cấp mới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên phụ cấp *</Label>
                  <Input
                    placeholder="Nhập tên phụ cấp"
                    value={allowanceForm.name}
                    onChange={(e) => setAllowanceForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mức phụ cấp (VND) *</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={allowanceForm.amount}
                    onChange={(e) => setAllowanceForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Input
                    placeholder="Nhập mô tả (tùy chọn)"
                    value={allowanceForm.description || ""}
                    onChange={(e) => setAllowanceForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại phụ cấp *</Label>
                  <Select
                    value={allowanceForm.type}
                    onValueChange={(value) => setAllowanceForm(prev => ({ ...prev, type: value as AllowanceType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AllowanceType.FIXED}>Cố định</SelectItem>
                      <SelectItem value={AllowanceType.PERCENTAGE}>Theo phần trăm</SelectItem>
                      <SelectItem value={AllowanceType.VARIABLE}>Biến động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chịu thuế</Label>
                  <Select
                    value={allowanceForm.taxable ? "true" : "false"}
                    onValueChange={(value) => setAllowanceForm(prev => ({ ...prev, taxable: value === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Có</SelectItem>
                      <SelectItem value="false">Không</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleCreateAllowance}
                disabled={loading}
              >
                {loading ? "Đang tạo..." : "Tạo phụ cấp"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employee-allowances" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gán phụ cấp cho nhân viên</h3>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                setEmployeeAllowanceForm({
                  employeeId: selectedEmployeeForAllowance || 0,
                  allowanceId: 0,
                  customAmount: undefined,
                  effectiveDate: new Date().toISOString().split('T')[0],
                  endDate: undefined,
                  notes: ""
                })
                setIsCreateEmployeeAllowanceDialogOpen(true)
              }}
              disabled={!selectedEmployeeForAllowance}
            >
              <Plus className="h-4 w-4 mr-2" />
              Gán phụ cấp
            </Button>
          </div>

          <Card className="shadow-vibrant hover-glow border-gradient">
            <CardHeader>
              <CardTitle>Chọn nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEmployeeForAllowance?.toString() || ""}
                onValueChange={(value) => {
                  const empId = Number(value)
                  setSelectedEmployeeForAllowance(empId)
                  loadEmployeeAllowances(empId)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên để xem phụ cấp" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.fullName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEmployeeForAllowance && (
            <Card className="shadow-vibrant hover-glow border-gradient">
              <CardHeader>
                <CardTitle>Danh sách phụ cấp</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8">
                    <LoadingSpinner size="md" text="Đang tải danh sách phụ cấp..." />
                  </div>
                ) : employeeAllowances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nhân viên chưa có phụ cấp nào</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại phụ cấp</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Ngày hiệu lực</TableHead>
                        <TableHead>Ngày kết thúc</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeAllowances.map((ea) => (
                        <TableRow key={ea.id}>
                          <TableCell>{ea.allowanceName}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(ea.actualAmount)}
                            {ea.customAmount && ea.customAmount !== ea.allowanceAmount && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (tùy chỉnh)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(ea.effectiveDate).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell>
                            {ea.endDate ? new Date(ea.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                          </TableCell>
                          <TableCell>{ea.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditEmployeeAllowanceDialog(ea)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteEmployeeAllowanceDialog(ea.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Phiếu lương nhân viên</h3>
            <div className="flex gap-2">
              <Input placeholder="Tìm nhân viên..." className="w-64" />
              <Button className="bg-teal-600 hover:bg-teal-700">
                Tạo phiếu lương
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {salaryData.slice(0, 3).map((salary) => (
              <Card key={salary.id} className="shadow-vibrant hover-glow border-gradient">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{salary.employee}</CardTitle>
                      <p className="text-sm text-muted-foreground">{salary.position}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Lương cơ bản:</span>
                      <span>{formatCurrency(salary.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phụ cấp:</span>
                      <span className="text-green-600">+{formatCurrency(salary.allowances)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thưởng:</span>
                      <span className="text-green-600">+{formatCurrency(salary.bonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Khấu trừ:</span>
                      <span className="text-red-600">-{formatCurrency(salary.deductions)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Thực lĩnh:</span>
                      <span>{formatCurrency(salary.netSalary)}</span>
                    </div>
                  </div>
                  {getStatusBadge(salary.status)}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <h3 className="text-lg font-semibold">Báo cáo quỹ lương</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-vibrant hover-glow border-gradient">
              <CardHeader>
                <CardTitle>Lịch sử thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payrollHistory.map((history) => (
                    <div key={history.month} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium">{history.month}</div>
                        <div className="text-sm text-muted-foreground">{history.employees} nhân viên</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(history.totalPaid)}</div>
                        <div className="text-sm text-muted-foreground">TB: {formatCurrency(history.avgSalary)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-vibrant hover-glow border-gradient">
              <CardHeader>
                <CardTitle>Báo cáo tùy chỉnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Loại báo cáo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại báo cáo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Báo cáo tháng</SelectItem>
                      <SelectItem value="quarterly">Báo cáo quý</SelectItem>
                      <SelectItem value="yearly">Báo cáo năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thời gian</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Tháng hiện tại</SelectItem>
                      <SelectItem value="last">Tháng trước</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phòng ban</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="tech">Kỹ thuật</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  Tạo báo cáo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Payroll Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bảng lương</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nhân viên</Label>
                  <p className="font-medium">{selectedPayroll.employeeName || `Nhân viên #${selectedPayroll.employeeId}`}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Mã nhân viên</Label>
                  <p className="font-medium">{selectedPayroll.employeeCode || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tháng/Năm</Label>
                  <p className="font-medium">{selectedPayroll.payPeriodMonth}/{selectedPayroll.payPeriodYear}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayroll.status)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Chi tiết lương</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lương cơ bản:</span>
                    <span className="font-medium">{formatCurrency(selectedPayroll.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phụ cấp:</span>
                    <span className="font-medium text-green-600">+{formatCurrency(selectedPayroll.totalAllowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Làm thêm giờ:</span>
                    <span className="font-medium text-green-600">+{formatCurrency(selectedPayroll.overtimePay)}</span>
                  </div>
                  {/* Chi tiết khấu trừ */}
                  <div className="space-y-2">
                    <span className="text-muted-foreground">Khấu trừ:</span>
                    {selectedPayroll.deductionDetails && selectedPayroll.deductionDetails.length > 0 ? (
                      <div className="space-y-1 pl-4 border-l-2 border-red-200">
                        {selectedPayroll.deductionDetails.map((deduction, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <span className="font-medium">{deduction.name}</span>
                              {deduction.description && (
                                <span className="text-muted-foreground text-xs ml-2">({deduction.description})</span>
                              )}
                              {deduction.mandatory && (
                                <Badge variant="outline" className="ml-2 text-xs">Bắt buộc</Badge>
                              )}
                            </div>
                            <span className="text-red-600 font-medium">-{formatCurrency(deduction.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 mt-1 font-semibold">
                          <span>Tổng khấu trừ:</span>
                          <span className="text-red-600">-{formatCurrency(selectedPayroll.totalDeductions)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Không có khấu trừ</span>
                        <span className="font-medium text-red-600">-{formatCurrency(selectedPayroll.totalDeductions)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Tổng lương gross:</span>
                    <span className="font-semibold">{formatCurrency(selectedPayroll.grossPay)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold text-lg">Thực lĩnh:</span>
                    <span className="font-semibold text-lg text-green-600">{formatCurrency(selectedPayroll.netPay)}</span>
                  </div>
                </div>
              </div>


              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span>Ngày tạo: </span>
                  <span>{new Date(selectedPayroll.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div>
                  <span>Cập nhật: </span>
                  <span>{new Date(selectedPayroll.updatedAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Payroll Confirmation Dialog */}
      <AlertDialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận phê duyệt bảng lương</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayroll ? (
                <>
                  <p><strong>Nhân viên:</strong> {selectedPayroll.employeeName || `Nhân viên #${selectedPayroll.employeeId}`}</p>
                  <p><strong>Tháng:</strong> {selectedPayroll.payPeriodMonth}/{selectedPayroll.payPeriodYear}</p>
                  <p><strong>Tổng lương:</strong> {formatCurrency(selectedPayroll.netPay)} VND</p>
                </>
              ) : (
                <span>Xác nhận phê duyệt bảng lương</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprovePayroll}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Đang xử lý..." : "Phê duyệt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Payroll Confirmation Dialog */}
      <AlertDialog open={isCompleteConfirmOpen} onOpenChange={setIsCompleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hoàn tất thanh toán</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayroll ? (
                <>
                  <p><strong>Nhân viên:</strong> {selectedPayroll.employeeName || `Nhân viên #${selectedPayroll.employeeId}`}</p>
                  <p><strong>Tháng:</strong> {selectedPayroll.payPeriodMonth}/{selectedPayroll.payPeriodYear}</p>
                  <p><strong>Tổng lương:</strong> {formatCurrency(selectedPayroll.netPay)} VND</p>
                  <p className="text-orange-600 font-semibold mt-4">⚠️ Cảnh báo: Sau khi hoàn tất, bạn không thể chỉnh sửa bảng lương này!</p>
                </>
              ) : (
                <span>Xác nhận hoàn tất thanh toán</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompletePayroll}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Đang xử lý..." : "Hoàn tất"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payroll Confirmation Dialog */}
      <AlertDialog open={isDeletePayrollConfirmOpen} onOpenChange={setIsDeletePayrollConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bảng lương</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPayrollId ? (
                <>
                  <p>Bạn có chắc chắn muốn xóa bảng lương này?</p>
                  <p className="text-red-600 font-semibold mt-4">⚠️ Cảnh báo: Hành động này không thể hoàn tác!</p>
                </>
              ) : (
                <span>Xác nhận xóa bảng lương</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayroll}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Allowance Dialog */}
      <Dialog open={isEditAllowanceDialogOpen} onOpenChange={setIsEditAllowanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật phụ cấp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên phụ cấp *</Label>
                <Input
                  placeholder="Nhập tên phụ cấp"
                  value={allowanceForm.name}
                  onChange={(e) => setAllowanceForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mức phụ cấp (VND) *</Label>
                <Input
                  placeholder="0"
                  type="number"
                  value={allowanceForm.amount}
                  onChange={(e) => setAllowanceForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  placeholder="Nhập mô tả (tùy chọn)"
                  value={allowanceForm.description || ""}
                  onChange={(e) => setAllowanceForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Loại phụ cấp *</Label>
                <Select
                  value={allowanceForm.type}
                  onValueChange={(value) => setAllowanceForm(prev => ({ ...prev, type: value as AllowanceType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AllowanceType.FIXED}>Cố định</SelectItem>
                    <SelectItem value={AllowanceType.PERCENTAGE}>Theo phần trăm</SelectItem>
                    <SelectItem value={AllowanceType.VARIABLE}>Biến động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chịu thuế</Label>
                <Select
                  value={allowanceForm.taxable ? "true" : "false"}
                  onValueChange={(value) => setAllowanceForm(prev => ({ ...prev, taxable: value === "true" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Có</SelectItem>
                    <SelectItem value="false">Không</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={allowanceForm.active ? "true" : "false"}
                  onValueChange={(value) => setAllowanceForm(prev => ({ ...prev, active: value === "true" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditAllowanceDialogOpen(false)
                  setEditingAllowance(null)
                  setAllowanceForm({
                    name: "",
                    description: "",
                    type: AllowanceType.FIXED,
                    amount: 0,
                    taxable: true,
                    active: true
                  })
                }}
              >
                Hủy
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleUpdateAllowance}
                disabled={loading}
              >
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Allowance Confirm Dialog */}
      <AlertDialog open={isDeleteAllowanceConfirmOpen} onOpenChange={setIsDeleteAllowanceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phụ cấp</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phụ cấp này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteAllowanceConfirmOpen(false)
              setDeletingAllowanceId(null)
            }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllowance}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Employee Allowance Dialog */}
      <Dialog open={isCreateEmployeeAllowanceDialogOpen} onOpenChange={setIsCreateEmployeeAllowanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gán phụ cấp cho nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nhân viên *</Label>
              <Select
                value={employeeAllowanceForm.employeeId?.toString() || ""}
                onValueChange={(value) => setEmployeeAllowanceForm(prev => ({ ...prev, employeeId: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.fullName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Loại phụ cấp *</Label>
              <Select
                value={employeeAllowanceForm.allowanceId?.toString() || ""}
                onValueChange={(value) => setEmployeeAllowanceForm(prev => ({ ...prev, allowanceId: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại phụ cấp" />
                </SelectTrigger>
                <SelectContent>
                  {allowances.filter(a => a.active).map(allowance => (
                    <SelectItem key={allowance.id} value={allowance.id.toString()}>
                      {allowance.name} - {formatCurrency(allowance.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Số tiền tùy chỉnh (VND)</Label>
              <Input
                type="number"
                placeholder="Để trống để dùng số tiền mặc định"
                value={employeeAllowanceForm.customAmount || ""}
                onChange={(e) => setEmployeeAllowanceForm(prev => ({
                  ...prev,
                  customAmount: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nếu để trống, sẽ sử dụng số tiền mặc định của loại phụ cấp
              </p>
            </div>

            <div>
              <Label>Ngày hiệu lực *</Label>
              <Input
                type="date"
                value={employeeAllowanceForm.effectiveDate}
                onChange={(e) => setEmployeeAllowanceForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={employeeAllowanceForm.endDate || ""}
                onChange={(e) => setEmployeeAllowanceForm(prev => ({
                  ...prev,
                  endDate: e.target.value || undefined
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Để trống nếu phụ cấp vô thời hạn
              </p>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Input
                placeholder="Nhập ghi chú (tùy chọn)"
                value={employeeAllowanceForm.notes || ""}
                onChange={(e) => setEmployeeAllowanceForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateEmployeeAllowanceDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleCreateEmployeeAllowance}
                disabled={loading}
              >
                {loading ? "Đang tạo..." : "Gán phụ cấp"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Allowance Dialog */}
      <Dialog open={isEditEmployeeAllowanceDialogOpen} onOpenChange={setIsEditEmployeeAllowanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật phụ cấp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingEmployeeAllowance && (
              <>
                <div>
                  <Label>Loại phụ cấp</Label>
                  <Input
                    value={editingEmployeeAllowance.allowanceName}
                    disabled
                  />
                </div>

                <div>
                  <Label>Số tiền tùy chỉnh (VND)</Label>
                  <Input
                    type="number"
                    placeholder="Để trống để dùng số tiền mặc định"
                    value={employeeAllowanceForm.customAmount || ""}
                    onChange={(e) => setEmployeeAllowanceForm(prev => ({
                      ...prev,
                      customAmount: e.target.value ? Number(e.target.value) : undefined
                    }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Số tiền mặc định: {formatCurrency(editingEmployeeAllowance.allowanceAmount)}
                  </p>
                </div>

                <div>
                  <Label>Ngày hiệu lực *</Label>
                  <Input
                    type="date"
                    value={employeeAllowanceForm.effectiveDate}
                    onChange={(e) => setEmployeeAllowanceForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Ngày kết thúc</Label>
                  <Input
                    type="date"
                    value={employeeAllowanceForm.endDate || ""}
                    onChange={(e) => setEmployeeAllowanceForm(prev => ({
                      ...prev,
                      endDate: e.target.value || undefined
                    }))}
                  />
                </div>

                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    placeholder="Nhập ghi chú (tùy chọn)"
                    value={employeeAllowanceForm.notes || ""}
                    onChange={(e) => setEmployeeAllowanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditEmployeeAllowanceDialogOpen(false)
                      setEditingEmployeeAllowance(null)
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={handleUpdateEmployeeAllowance}
                    disabled={loading}
                  >
                    {loading ? "Đang cập nhật..." : "Cập nhật"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Allowance Confirm Dialog */}
      <AlertDialog open={isDeleteEmployeeAllowanceConfirmOpen} onOpenChange={setIsDeleteEmployeeAllowanceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phụ cấp</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phụ cấp này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteEmployeeAllowanceConfirmOpen(false)
              setDeletingEmployeeAllowanceId(null)
            }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployeeAllowance}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
