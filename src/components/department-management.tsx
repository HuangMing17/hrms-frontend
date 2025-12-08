"use client"

import { useState, useEffect } from "react"
import { Building2, Users, UserCog, Plus, Edit, Trash2, MapPin, Search, Eye, Power, PowerOff, UserPlus, UserMinus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { departmentAPI, Department, DepartmentCreateRequest, DepartmentUpdateRequest } from "../lib/api/department"
import { positionAPI, Position, PositionLevel, PositionCreateRequest, PositionUpdateRequest } from "../lib/api/position"
import { employeeAPI, Employee } from "../lib/api/employee"
import { DepartmentDetailModal } from "./department-detail-modal"
import { PositionDetailModal } from "./position-detail-modal"
import { LoadingCard, LoadingTable, LoadingSpinner } from "./ui/loading"

// Position Level Options for UI - Single store hierarchy
const POSITION_LEVELS: { value: PositionLevel; label: string }[] = [
  { value: 'INTERN', label: 'Thực tập sinh' },
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'SENIOR_STAFF', label: 'Nhân viên cấp cao' },
  { value: 'SUPERVISOR', label: 'Giám sát' },
  { value: 'ASSISTANT_MANAGER', label: 'Phó quản lý' },
  { value: 'MANAGER', label: 'Quản lý cửa hàng' },
  { value: 'DIRECTOR', label: 'Giám đốc' }
]

export function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState("departments")

  // Department states
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [activeOnly, setActiveOnly] = useState(true)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  // Detail modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  // Manager assignment dialog
  const [isAssignManagerDialogOpen, setIsAssignManagerDialogOpen] = useState(false)
  const [assigningManagerId, setAssigningManagerId] = useState<number | null>(null)
  const [selectedManagerId, setSelectedManagerId] = useState<number | undefined>(undefined)

  // Employees list for manager selection
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [totalEmployeesCount, setTotalEmployeesCount] = useState<number | null>(null)
  const [totalEmployeesLoading, setTotalEmployeesLoading] = useState(false)

  // Position detail modal states
  const [isPositionDetailModalOpen, setIsPositionDetailModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  // Position search
  const [positionSearchKeyword, setPositionSearchKeyword] = useState("")

  // Form states
  const [formData, setFormData] = useState<DepartmentCreateRequest>({
    name: "",
    code: "",
    description: "",
    managerId: undefined,
    parentDepartmentId: undefined
  })

  // Position states
  const [positions, setPositions] = useState<Position[]>([])
  const [positionLoading, setPositionLoading] = useState(false)
  const [positionError, setPositionError] = useState<string | null>(null)

  // Position dialog states
  const [isCreatePositionDialogOpen, setIsCreatePositionDialogOpen] = useState(false)
  const [isEditPositionDialogOpen, setIsEditPositionDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)

  // Position form states
  const [positionFormData, setPositionFormData] = useState<PositionCreateRequest>({
    title: "",
    code: "",
    description: "",
    departmentId: 0,
    level: "STAFF",
    baseSalary: undefined,
    active: true
  })

  // Load departments
  const loadDepartments = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await departmentAPI.getDepartments()
      setDepartments(data)
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Search departments
  const searchDepartments = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await departmentAPI.searchDepartments({
        keyword: searchKeyword.trim() || undefined,
        activeOnly: activeOnly ? true : undefined,
        page: 0,
        size: 100
      })
      setDepartments(result.content)
    } catch (err: any) {
      setError(err.message || "Không thể tìm kiếm phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Create department
  const handleCreateDepartment = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Vui lòng nhập tên và mã phòng ban")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newDepartment = await departmentAPI.createDepartment(formData)
      setDepartments(prev => [...prev, newDepartment])
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || "Không thể tạo phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Update department
  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !formData.name.trim()) {
      setError("Vui lòng nhập tên phòng ban")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: DepartmentUpdateRequest = {
        name: formData.name,
        description: formData.description,
        // Luôn gửi managerId, kể cả khi null (để xóa)
        managerId: formData.managerId !== undefined ? formData.managerId : null,
        // Luôn gửi parentDepartmentId, kể cả khi null (để xóa)
        parentDepartmentId: formData.parentDepartmentId !== undefined ? formData.parentDepartmentId : null,
        active: editingDepartment.active // Giữ nguyên trạng thái hiện tại, có thể thêm toggle sau
      }

      const updatedDepartment = await departmentAPI.updateDepartment(editingDepartment.id, updateData)
      setDepartments(prev => prev.map(dept =>
        dept.id === editingDepartment.id ? updatedDepartment : dept
      ))
      // Refresh selected department if it's the one being edited
      if (selectedDepartment?.id === editingDepartment.id) {
        setSelectedDepartment(updatedDepartment)
      }
      setIsEditDialogOpen(false)
      setEditingDepartment(null)
      resetForm()
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Delete department
  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await departmentAPI.deleteDepartment(id)
      setDepartments(prev => prev.filter(dept => dept.id !== id))
      if (selectedDepartment?.id === id) {
        setIsDetailModalOpen(false)
        setSelectedDepartment(null)
      }
    } catch (err: any) {
      setError(err.message || "Không thể xóa phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Activate department
  const handleActivateDepartment = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await departmentAPI.activateDepartment(id)
      setDepartments(prev => prev.map(dept => dept.id === id ? updated : dept))
      if (selectedDepartment?.id === id) {
        setSelectedDepartment(updated)
      }
    } catch (err: any) {
      setError(err.message || "Không thể kích hoạt phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Deactivate department
  const handleDeactivateDepartment = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa phòng ban này?")) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const updated = await departmentAPI.deactivateDepartment(id)
      setDepartments(prev => prev.map(dept => dept.id === id ? updated : dept))
      if (selectedDepartment?.id === id) {
        setSelectedDepartment(updated)
      }
    } catch (err: any) {
      setError(err.message || "Không thể vô hiệu hóa phòng ban")
    } finally {
      setLoading(false)
    }
  }

  // Assign manager
  const handleAssignManager = async () => {
    if (!assigningManagerId || !selectedManagerId) {
      setError("Vui lòng chọn trưởng phòng")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const updated = await departmentAPI.assignManager(assigningManagerId, selectedManagerId)
      setDepartments(prev => prev.map(dept => dept.id === assigningManagerId ? updated : dept))
      if (selectedDepartment?.id === assigningManagerId) {
        setSelectedDepartment(updated)
      }
      setIsAssignManagerDialogOpen(false)
      setSelectedManagerId(undefined)
      setAssigningManagerId(null)
    } catch (err: any) {
      setError(err.message || "Không thể gán trưởng phòng")
    } finally {
      setLoading(false)
    }
  }

  // Remove manager
  const handleRemoveManager = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa trưởng phòng?")) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const updated = await departmentAPI.removeManager(id)
      setDepartments(prev => prev.map(dept => dept.id === id ? updated : dept))
      if (selectedDepartment?.id === id) {
        setSelectedDepartment(updated)
      }
    } catch (err: any) {
      setError(err.message || "Không thể xóa trưởng phòng")
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      managerId: undefined,
      parentDepartmentId: undefined
    })
  }

  // Open edit dialog
  const openEditDialog = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || "",
      managerId: department.manager?.id || department.managerId,
      parentDepartmentId: department.parentDepartment?.id || department.parentDepartmentId
    })
    setIsEditDialogOpen(true)
  }

  // Open detail modal
  const openDetailModal = (department: Department) => {
    setSelectedDepartment(department)
    setIsDetailModalOpen(true)
  }

  // Close detail modal
  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedDepartment(null)
  }

  // Position detail modal functions
  const openPositionDetailModal = (position: Position) => {
    setSelectedPosition(position)
    setIsPositionDetailModalOpen(true)
  }

  const closePositionDetailModal = () => {
    setIsPositionDetailModalOpen(false)
    setSelectedPosition(null)
  }

  // Load positions
  const loadPositions = async () => {
    setPositionLoading(true)
    setPositionError(null)

    try {
      const data = await positionAPI.getPositions()
      setPositions(data)
    } catch (err: any) {
      setPositionError(err.message || "Không thể tải danh sách chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Search positions
  const searchPositions = async () => {
    setPositionLoading(true)
    setPositionError(null)
    try {
      const result = await positionAPI.searchPositions({
        keyword: positionSearchKeyword.trim() || undefined,
        page: 0,
        size: 100
      })
      setPositions(result.content)
    } catch (err: any) {
      setPositionError(err.message || "Không thể tìm kiếm chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Activate position
  const handleActivatePosition = async (id: number) => {
    setPositionLoading(true)
    setPositionError(null)
    try {
      const updated = await positionAPI.activatePosition(id)
      setPositions(prev => prev.map(pos => pos.id === id ? updated : pos))
      if (selectedPosition?.id === id) {
        setSelectedPosition(updated)
      }
    } catch (err: any) {
      setPositionError(err.message || "Không thể kích hoạt chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Deactivate position
  const handleDeactivatePosition = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa chức vụ này?")) {
      return
    }
    setPositionLoading(true)
    setPositionError(null)
    try {
      const updated = await positionAPI.deactivatePosition(id)
      setPositions(prev => prev.map(pos => pos.id === id ? updated : pos))
      if (selectedPosition?.id === id) {
        setSelectedPosition(updated)
      }
    } catch (err: any) {
      setPositionError(err.message || "Không thể vô hiệu hóa chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Create position
  const handleCreatePosition = async () => {
    if (!positionFormData.title.trim() || !positionFormData.code.trim() || !positionFormData.departmentId) {
      setPositionError("Vui lòng nhập tên chức vụ, mã chức vụ và chọn phòng ban")
      return
    }

    setPositionLoading(true)
    setPositionError(null)

    try {
      const newPosition = await positionAPI.createPosition(positionFormData)
      setPositions(prev => [...prev, newPosition])
      setIsCreatePositionDialogOpen(false)
      resetPositionForm()
    } catch (err: any) {
      setPositionError(err.message || "Không thể tạo chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Update position
  const handleUpdatePosition = async () => {
    if (!editingPosition || !positionFormData.title.trim()) {
      setPositionError("Vui lòng nhập tên chức vụ")
      return
    }

    setPositionLoading(true)
    setPositionError(null)

    try {
      const updateData: PositionUpdateRequest = {
        title: positionFormData.title,
        description: positionFormData.description,
        departmentId: positionFormData.departmentId,
        level: positionFormData.level,
        baseSalary: positionFormData.baseSalary,
        active: positionFormData.active
      }

      const updatedPosition = await positionAPI.updatePosition(editingPosition.id, updateData)
      setPositions(prev => prev.map(pos =>
        pos.id === editingPosition.id ? updatedPosition : pos
      ))

      // Update selected position if it's the one being edited
      if (selectedPosition?.id === editingPosition.id) {
        setSelectedPosition(updatedPosition)
      }

      setIsEditPositionDialogOpen(false)
      setEditingPosition(null)
      resetPositionForm()
    } catch (err: any) {
      setPositionError(err.message || "Không thể cập nhật chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Delete position
  const handleDeletePosition = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chức vụ này?")) {
      return
    }

    setPositionLoading(true)
    setPositionError(null)

    try {
      await positionAPI.deletePosition(id)
      setPositions(prev => prev.filter(pos => pos.id !== id))
    } catch (err: any) {
      setPositionError(err.message || "Không thể xóa chức vụ")
    } finally {
      setPositionLoading(false)
    }
  }

  // Reset position form
  const resetPositionForm = () => {
    setPositionFormData({
      title: "",
      code: "",
      description: "",
      departmentId: 0,
      level: "STAFF",
      baseSalary: undefined,
      active: true
    })
  }

  // Open edit position dialog
  const openEditPositionDialog = (position: Position) => {
    setEditingPosition(position)
    setPositionFormData({
      title: position.title,
      code: position.code,
      description: position.description || "",
      departmentId: position.departmentId,
      level: position.level,
      baseSalary: position.baseSalary,
      active: position.active
    })
    setIsEditPositionDialogOpen(true)
    // Close detail modal if open
    setIsPositionDetailModalOpen(false)
  }

  const getLevelBadge = (level: string) => {
    const colors = {
      "INTERN": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      "STAFF": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "SENIOR_STAFF": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "SUPERVISOR": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "ASSISTANT_MANAGER": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "MANAGER": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "DIRECTOR": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }

  // Load employees for manager selection
  const loadEmployees = async () => {
    setEmployeesLoading(true)
    try {
      const result = await employeeAPI.getAllEmployees(0, 1000)
      setEmployees(result.employees || [])
      // Cập nhật tổng số nhân viên
      setTotalEmployeesCount(result.totalElements || result.employees?.length || 0)
    } catch (err: any) {
      console.error('Error loading employees:', err)
    } finally {
      setEmployeesLoading(false)
    }
  }

  // Load total employees count (lightweight)
  const loadTotalEmployeesCount = async () => {
    setTotalEmployeesLoading(true)
    try {
      const result = await employeeAPI.getAllEmployees(0, 1) // Chỉ lấy 1 để lấy totalElements
      setTotalEmployeesCount(result.totalElements || 0)
    } catch (err: any) {
      console.error('Error loading total employees count:', err)
    } finally {
      setTotalEmployeesLoading(false)
    }
  }

  // Load departments on mount
  useEffect(() => {
    loadDepartments()
    loadEmployees()
    loadTotalEmployeesCount() // Load tổng số nhân viên
  }, [activeOnly])

  // Load positions on mount
  useEffect(() => {
    loadPositions()
  }, [])

  // Search when keyword changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDepartments()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchKeyword, activeOnly])

  // Search positions when keyword changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (positionSearchKeyword.trim()) {
        searchPositions()
      } else {
        loadPositions()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [positionSearchKeyword])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gradient">Phòng ban & Chức vụ</h2>
        <p className="text-muted-foreground">Quản lý cơ cấu tổ chức và vị trí công việc</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng phòng ban</CardTitle>
            <div className="p-2 rounded-full bg-purple-gradient">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingCard showText />
            ) : (
              <div className="text-2xl font-bold text-gradient">{departments.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Phòng ban hoạt động</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
            <div className="p-2 rounded-full bg-rose-gradient">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {totalEmployeesLoading ? (
              <LoadingCard showText />
            ) : (
              <div className="text-2xl font-bold text-gradient">
                {totalEmployeesCount !== null ? totalEmployeesCount.toLocaleString('vi-VN') : '-'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Nhân viên tất cả phòng ban</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chức vụ</CardTitle>
            <div className="p-2 rounded-full bg-coral-gradient">
              <UserCog className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {positionLoading ? (
              <LoadingCard showText />
            ) : (
              <div className="text-2xl font-bold text-gradient">{positions.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Vị trí công việc</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            <div className="p-2 rounded-full bg-beauty-gradient">
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingCard showText />
            ) : (
              <div className="text-2xl font-bold text-gradient">{departments.filter(d => d.active).length}</div>
            )}
            <p className="text-xs text-muted-foreground">Phòng ban đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
          <TabsTrigger value="departments">Phòng ban</TabsTrigger>
          <TabsTrigger value="positions">Chức vụ</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Danh sách phòng ban</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200 border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm phòng ban
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tạo Phòng Ban Mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên phòng ban *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên phòng ban"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Mã phòng ban *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Nhập mã phòng ban"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Nhập mô tả phòng ban"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentDepartment">Phòng ban cha (tùy chọn)</Label>
                    <Select
                      value={formData.parentDepartmentId?.toString() || "none"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, parentDepartmentId: value === "none" ? undefined : parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng ban cha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="managerId">Trưởng phòng (tùy chọn)</Label>
                    <Select
                      value={formData.managerId !== undefined && formData.managerId !== null ? formData.managerId.toString() : "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData(prev => ({ ...prev, managerId: undefined }))
                        } else {
                          const managerId = parseInt(value)
                          if (!isNaN(managerId)) {
                            setFormData(prev => ({ ...prev, managerId: managerId }))
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trưởng phòng" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="none">Không có</SelectItem>
                        {/* Form tạo: hiển thị tất cả nhân viên vì chưa có phòng ban */}
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.fullName} ({emp.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Khi tạo phòng ban mới, có thể chọn bất kỳ nhân viên nào</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleCreateDepartment} disabled={loading}>
                      {loading ? "Đang tạo..." : "Tạo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm phòng ban..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={activeOnly.toString()} onValueChange={(value) => setActiveOnly(value === "true")}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Tất cả</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 flex justify-center py-8">
                <LoadingSpinner size="md" text="Đang tải phòng ban..." />
              </div>
            ) : departments.length === 0 ? (
              <div className="col-span-2">
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Không có phòng ban nào</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              departments.map((dept) => (
                <Card
                  key={dept.id}
                  className="shadow-vibrant hover-glow border-gradient cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => openDetailModal(dept)}
                  title="Click để xem chi tiết phòng ban"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-gradient">{dept.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                      </div>
                      <div className="flex gap-1">
                        {dept.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Vô hiệu hóa"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeactivateDepartment(dept.id)
                            }}
                          >
                            <PowerOff className="h-4 w-4 text-orange-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Kích hoạt"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivateDepartment(dept.id)
                            }}
                          >
                            <Power className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {dept.managerId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xóa trưởng phòng"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveManager(dept.id)
                            }}
                          >
                            <UserMinus className="h-4 w-4 text-red-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Gán trưởng phòng"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAssigningManagerId(dept.id)
                              setIsAssignManagerDialogOpen(true)
                            }}
                          >
                            <UserPlus className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(dept)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDepartment(dept.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mã phòng ban:</span>
                      <Badge variant="outline">{dept.code}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Trạng thái:</span>
                      <Badge variant={dept.active ? "default" : "secondary"}>
                        {dept.active ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tạo ngày:</span>
                      <span className="text-sm">{new Date(dept.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Trưởng phòng:</span>
                      <span className="text-sm font-medium">
                        {dept.managerId ? (
                          (() => {
                            const manager = employees.find(emp => emp.id === dept.managerId)
                            return manager ? `${manager.fullName} (${manager.employeeCode})` : `ID: ${dept.managerId}`
                          })()
                        ) : "Chưa có"}
                      </span>
                    </div>
                    {dept.parentDepartment && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phòng ban cha:</span>
                        <span className="text-sm">{dept.parentDepartment.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa Phòng Ban</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tên phòng ban *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên phòng ban"
                />
              </div>
              <div>
                <Label htmlFor="edit-code">Mã phòng ban</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Mã phòng ban không thể thay đổi</p>
              </div>
              <div>
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Nhập mô tả phòng ban"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-parentDepartmentId">Phòng ban cha</Label>
                <Select
                  value={formData.parentDepartmentId !== undefined && formData.parentDepartmentId !== null ? formData.parentDepartmentId.toString() : "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setFormData(prev => ({ ...prev, parentDepartmentId: undefined }))
                    } else {
                      const parentId = parseInt(value)
                      if (!isNaN(parentId)) {
                        setFormData(prev => ({ ...prev, parentDepartmentId: parentId }))
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban cha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    {departments
                      .filter(dept => dept.id !== editingDepartment?.id)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-managerId">Trưởng phòng</Label>
                <Select
                  value={formData.managerId !== undefined && formData.managerId !== null ? formData.managerId.toString() : "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setFormData(prev => ({ ...prev, managerId: undefined }))
                    } else {
                      const managerId = parseInt(value)
                      if (!isNaN(managerId)) {
                        setFormData(prev => ({ ...prev, managerId: managerId }))
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trưởng phòng" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    <SelectItem value="none">Không có</SelectItem>
                    {editingDepartment ? (
                      // Chỉ hiển thị nhân viên trong phòng ban này
                      employees
                        .filter(emp => emp.departmentId === editingDepartment.id)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.fullName} ({emp.employeeCode})
                          </SelectItem>
                        ))
                    ) : (
                      // Fallback: hiển thị tất cả nếu không có editingDepartment
                      employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fullName} ({emp.employeeCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {editingDepartment && employees.filter(emp => emp.departmentId === editingDepartment.id).length === 0
                    ? "Phòng ban này chưa có nhân viên. Vui lòng thêm nhân viên vào phòng ban trước."
                    : "Chọn \"Không có\" để xóa trưởng phòng"}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleUpdateDepartment} disabled={loading}>
                  {loading ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <TabsContent value="positions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Danh sách chức vụ</h3>
            <Dialog open={isCreatePositionDialogOpen} onOpenChange={setIsCreatePositionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-beauty-gradient hover:shadow-vibrant text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chức vụ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tạo Chức Vụ Mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="position-title">Tên chức vụ *</Label>
                    <Input
                      id="position-title"
                      value={positionFormData.title}
                      onChange={(e) => setPositionFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tên chức vụ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position-code">Mã chức vụ *</Label>
                    <Input
                      id="position-code"
                      value={positionFormData.code}
                      onChange={(e) => setPositionFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Nhập mã chức vụ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position-department">Phòng ban *</Label>
                    <Select
                      value={positionFormData.departmentId.toString()}
                      onValueChange={(value) => setPositionFormData(prev => ({ ...prev, departmentId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="position-level">Cấp độ</Label>
                    <Select
                      value={positionFormData.level}
                      onValueChange={(value: any) => setPositionFormData(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERN">Thực tập sinh</SelectItem>
                        <SelectItem value="STAFF">Nhân viên</SelectItem>
                        <SelectItem value="SENIOR_STAFF">Nhân viên cấp cao</SelectItem>
                        <SelectItem value="SUPERVISOR">Giám sát</SelectItem>
                        <SelectItem value="ASSISTANT_MANAGER">Phó quản lý</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="DIRECTOR">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="position-description">Mô tả</Label>
                    <Textarea
                      id="position-description"
                      value={positionFormData.description}
                      onChange={(e) => setPositionFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Nhập mô tả chức vụ"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position-salary">Lương cơ bản (VNĐ)</Label>
                    <Input
                      id="position-salary"
                      type="number"
                      value={positionFormData.baseSalary || ""}
                      onChange={(e) => setPositionFormData(prev => ({ ...prev, baseSalary: e.target.value ? parseInt(e.target.value) : undefined }))}
                      placeholder="Nhập lương cơ bản"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreatePositionDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleCreatePosition} disabled={positionLoading}>
                      {positionLoading ? "Đang tạo..." : "Tạo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Position Error Alert */}
          {positionError && (
            <Alert variant="destructive">
              <AlertDescription>{positionError}</AlertDescription>
            </Alert>
          )}

          {/* Position Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm chức vụ..."
                  value={positionSearchKeyword}
                  onChange={(e) => setPositionSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên chức vụ</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Cấp độ</TableHead>
                  <TableHead>Mức lương</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <LoadingSpinner size="md" text="Đang tải chức vụ..." />
                    </TableCell>
                  </TableRow>
                ) : positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Không có chức vụ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  positions.map((position) => (
                    <TableRow
                      key={position.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => openPositionDetailModal(position)}
                      title="Click để xem chi tiết chức vụ"
                    >
                      <TableCell className="font-medium">{position.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {position.departmentName ||
                            departments.find(d => d.id === position.departmentId)?.name ||
                            `ID: ${position.departmentId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelBadge(position.level)}>{position.level}</Badge>
                      </TableCell>
                      <TableCell>
                        {position.baseSalary
                          ? `${position.baseSalary.toLocaleString()} VNĐ`
                          : "Chưa cập nhật"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={position.active ? "default" : "secondary"}>
                          {position.active ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {position.active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Vô hiệu hóa"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeactivatePosition(position.id)
                              }}
                            >
                              <PowerOff className="h-4 w-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Kích hoạt"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleActivatePosition(position.id)
                              }}
                            >
                              <Power className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditPositionDialog(position)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePosition(position.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Edit Position Dialog */}
        <Dialog open={isEditPositionDialogOpen} onOpenChange={setIsEditPositionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa Chức Vụ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-position-title">Tên chức vụ *</Label>
                <Input
                  id="edit-position-title"
                  value={positionFormData.title}
                  onChange={(e) => setPositionFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tên chức vụ"
                />
              </div>
              <div>
                <Label htmlFor="edit-position-code">Mã chức vụ</Label>
                <Input
                  id="edit-position-code"
                  value={positionFormData.code}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Mã chức vụ không thể thay đổi</p>
              </div>
              <div>
                <Label htmlFor="edit-position-department">Phòng ban</Label>
                <Select
                  value={positionFormData.departmentId.toString()}
                  onValueChange={(value) => setPositionFormData(prev => ({ ...prev, departmentId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-position-level">Cấp độ</Label>
                <Select
                  value={positionFormData.level}
                  onValueChange={(value: any) => setPositionFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERN">Thực tập sinh</SelectItem>
                    <SelectItem value="STAFF">Nhân viên</SelectItem>
                    <SelectItem value="SENIOR_STAFF">Nhân viên cấp cao</SelectItem>
                    <SelectItem value="SUPERVISOR">Giám sát</SelectItem>
                    <SelectItem value="ASSISTANT_MANAGER">Phó quản lý</SelectItem>
                    <SelectItem value="MANAGER">Quản lý cửa hàng</SelectItem>
                    <SelectItem value="DIRECTOR">Giám đốc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-position-description">Mô tả</Label>
                <Textarea
                  id="edit-position-description"
                  value={positionFormData.description}
                  onChange={(e) => setPositionFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Nhập mô tả chức vụ"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-position-salary">Lương cơ bản (VNĐ)</Label>
                <Input
                  id="edit-position-salary"
                  type="number"
                  value={positionFormData.baseSalary || ""}
                  onChange={(e) => setPositionFormData(prev => ({ ...prev, baseSalary: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="Nhập lương cơ bản"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditPositionDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleUpdatePosition} disabled={positionLoading}>
                  {positionLoading ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Tabs>

      {/* Assign Manager Dialog */}
      <Dialog open={isAssignManagerDialogOpen} onOpenChange={setIsAssignManagerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gán Trưởng Phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="managerId">Trưởng phòng *</Label>
              <Select
                value={selectedManagerId !== undefined ? selectedManagerId.toString() : ""}
                onValueChange={(value) => {
                  const managerId = parseInt(value)
                  if (!isNaN(managerId)) {
                    setSelectedManagerId(managerId)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trưởng phòng" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {employeesLoading ? (
                    <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                  ) : assigningManagerId ? (
                    (() => {
                      const departmentEmployees = employees.filter(emp => emp.departmentId === assigningManagerId)
                      if (departmentEmployees.length === 0) {
                        return <SelectItem value="empty" disabled>Phòng ban này chưa có nhân viên</SelectItem>
                      }
                      return departmentEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fullName} ({emp.employeeCode})
                        </SelectItem>
                      ))
                    })()
                  ) : (
                    <SelectItem value="empty" disabled>Vui lòng chọn phòng ban</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {assigningManagerId
                  ? `Chỉ hiển thị nhân viên trong phòng ban này (${employees.filter(emp => emp.departmentId === assigningManagerId).length} người)`
                  : "Chọn nhân viên sẽ làm trưởng phòng"}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsAssignManagerDialogOpen(false)
                setSelectedManagerId(undefined)
                setAssigningManagerId(null)
              }}>
                Hủy
              </Button>
              <Button onClick={handleAssignManager} disabled={loading || !selectedManagerId}>
                {loading ? "Đang gán..." : "Gán"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Detail Modal */}
      {selectedDepartment && (
        <DepartmentDetailModal
          department={selectedDepartment}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          onEdit={openEditDialog}
          onDelete={handleDeleteDepartment}
        />
      )}

      {/* Position Detail Modal */}
      {selectedPosition && (
        <PositionDetailModal
          position={selectedPosition}
          isOpen={isPositionDetailModalOpen}
          onClose={closePositionDetailModal}
          onEdit={openEditPositionDialog}
          onDelete={handleDeletePosition}
        />
      )}
    </div>
  )
}
