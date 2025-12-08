"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Eye, Calendar, User, Building2, Filter, Copy, Check, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Alert, AlertDescription } from "./ui/alert"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination"
import { LoadingPage, LoadingTable } from "./ui/loading"
import { auditAPI, AuditLogResponse, SearchParams } from "../lib/api/audit"
import { employeeAPI, Employee } from "../lib/api/employee"
import { format } from "date-fns"

export function AuditManagement() {
    const [activeTab, setActiveTab] = useState("logs")

    // Data states
    const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null)

    // UI states
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [pageSize] = useState(20)

    // Filter states for list view
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const [selectedEntity, setSelectedEntity] = useState<string>("")
    const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null)

    // Search states
    const [searchParams, setSearchParams] = useState<SearchParams>({
        page: 0,
        size: 20
    })
    const [searchResults, setSearchResults] = useState<AuditLogResponse[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchCurrentPage, setSearchCurrentPage] = useState(0)
    const [searchTotalPages, setSearchTotalPages] = useState(0)
    const [searchTotalElements, setSearchTotalElements] = useState(0)

    // Stats states
    const [statsFromDate, setStatsFromDate] = useState<string>(() => {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        return date.toISOString().split('T')[0]
    })
    const [statsToDate, setStatsToDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0]
    })
    const [statsData, setStatsData] = useState<any>(null)
    const [statsLoading, setStatsLoading] = useState(false)

    // Dialog states
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [copiedRequestId, setCopiedRequestId] = useState<string | null>(null)

    // Entity types
    const entityTypes = ["Employee", "Payroll", "LeaveRequest", "Department", "Position", "Attendance"]

    // Load employees
    const loadEmployees = async () => {
        try {
            const response = await employeeAPI.getAllEmployees(0, 100)
            setEmployees(response.employees || [])
        } catch (err: any) {
            console.error('Error loading employees:', err)
            setEmployees([])
        }
    }

    // Load audit logs by user
    const loadAuditLogsByUser = async (userId: number, page: number = 0) => {
        setLoading(true)
        setError(null)
        try {
            const result = await auditAPI.getByUser(userId, page, pageSize)
            setAuditLogs(result.content)
            setTotalPages(result.totalPages)
            setTotalElements(result.totalElements)
            setCurrentPage(result.number)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Không thể tải nhật ký kiểm toán")
            setAuditLogs([])
        } finally {
            setLoading(false)
        }
    }

    // Load audit logs by entity
    const loadAuditLogsByEntity = async (entity: string, entityId: number, page: number = 0) => {
        setLoading(true)
        setError(null)
        try {
            const result = await auditAPI.getByEntity(entity, entityId, page, pageSize)
            setAuditLogs(result.content)
            setTotalPages(result.totalPages)
            setTotalElements(result.totalElements)
            setCurrentPage(result.number)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Không thể tải nhật ký kiểm toán")
            setAuditLogs([])
        } finally {
            setLoading(false)
        }
    }

    // Load all audit logs (no filter)
    const loadAllAuditLogs = async (page: number = 0) => {
        setLoading(true)
        setError(null)
        try {
            const result = await auditAPI.search({ page, size: pageSize })
            setAuditLogs(result.content)
            setTotalPages(result.totalPages)
            setTotalElements(result.totalElements)
            setCurrentPage(result.number)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Không thể tải nhật ký kiểm toán")
            setAuditLogs([])
        } finally {
            setLoading(false)
        }
    }

    // Handle filter change
    const handleFilterChange = (page: number = 0) => {
        if (selectedUserId) {
            loadAuditLogsByUser(selectedUserId, page)
        } else if (selectedEntity && selectedEntityId) {
            loadAuditLogsByEntity(selectedEntity, selectedEntityId, page)
        } else {
            // No filter - load all logs
            loadAllAuditLogs(page)
        }
    }

    // Search audit logs
    const handleSearch = async (page: number = 0) => {
        setSearchLoading(true)
        setError(null)
        try {
            const params: SearchParams = {
                ...searchParams,
                page: page,
                size: pageSize
            }
            const result = await auditAPI.search(params)
            setSearchResults(result.content)
            setSearchTotalPages(result.totalPages)
            setSearchTotalElements(result.totalElements)
            setSearchCurrentPage(result.number)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Không thể tìm kiếm")
            setSearchResults([])
        } finally {
            setSearchLoading(false)
        }
    }


    // View log details
    const viewLogDetails = async (log: AuditLogResponse) => {
        try {
            const fullDetails = await auditAPI.getById(log.id)
            setSelectedLog(fullDetails)
            setIsDetailDialogOpen(true)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Không thể tải chi tiết")
        }
    }

    // Copy request ID
    const copyRequestId = (requestId: string) => {
        navigator.clipboard.writeText(requestId)
        setCopiedRequestId(requestId)
        setTimeout(() => setCopiedRequestId(null), 2000)
    }

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss")
        } catch {
            return dateString
        }
    }

    // Effects
    useEffect(() => {
        loadEmployees()
    }, [])

    useEffect(() => {
        if (activeTab === "logs") {
            handleFilterChange(currentPage)
        }
    }, [selectedUserId, selectedEntity, selectedEntityId])

    useEffect(() => {
        if (activeTab === "logs") {
            handleFilterChange(currentPage)
        }
    }, [currentPage])


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

            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold mb-1 text-gradient">Giám sát và bảo mật</h2>
                        <p className="text-muted-foreground">Giám sát hoạt động và bảo mật hệ thống</p>
                    </div>
                    <Button
                        onClick={() => {
                            if (activeTab === "logs") {
                                setCurrentPage(0)
                                handleFilterChange(0)
                            } else if (activeTab === "search") {
                                setSearchCurrentPage(0)
                                handleSearch(0)
                            }
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
                    <TabsTrigger value="logs">
                        <FileText className="h-4 w-4 mr-2" />
                        Nhật ký giám sát
                    </TabsTrigger>
                    <TabsTrigger value="search">
                        <Search className="h-4 w-4 mr-2" />
                        Tìm kiếm
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Nhật ký giám sát */}
                <TabsContent value="logs" className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Lọc theo người dùng</Label>
                                <Select
                                    value={selectedUserId ? selectedUserId.toString() : "__all__"}
                                    onValueChange={(value) => {
                                        if (value === "__all__") {
                                            setSelectedUserId(null)
                                        } else {
                                            setSelectedUserId(parseInt(value))
                                        }
                                        setSelectedEntity("")
                                        setSelectedEntityId(null)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn người dùng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Tất cả</SelectItem>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Lọc theo Entity</Label>
                                <Select
                                    value={selectedEntity || "__all__"}
                                    onValueChange={(value) => {
                                        if (value === "__all__") {
                                            setSelectedEntity("")
                                        } else {
                                            setSelectedEntity(value)
                                        }
                                        setSelectedUserId(null)
                                        if (value === "__all__") setSelectedEntityId(null)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn entity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Tất cả</SelectItem>
                                        {entityTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedEntity && (
                                <div>
                                    <Label>Entity ID</Label>
                                    <Input
                                        type="number"
                                        placeholder="Nhập Entity ID"
                                        value={selectedEntityId || ""}
                                        onChange={(e) => setSelectedEntityId(e.target.value ? parseInt(e.target.value) : null)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <LoadingPage message="Đang tải nhật ký giám sát..." />
                    ) : auditLogs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Không có nhật ký giám sát nào</p>
                        </div>
                    ) : (
                        <>
                            <Card className="shadow-vibrant hover-glow border-gradient">
                                <CardHeader>
                                    <CardTitle>Tổng cộng: {totalElements} nhật ký</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Hành động</TableHead>
                                                    <TableHead>Entity</TableHead>
                                                    <TableHead>Người dùng</TableHead>
                                                    <TableHead>Thời gian</TableHead>
                                                    <TableHead>IP Address</TableHead>
                                                    <TableHead>Thao tác</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {auditLogs.map((log) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="font-medium">{log.id}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{log.action}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {log.entity && log.entityId ? (
                                                                <span>{log.entity} #{log.entityId}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                                <span>{log.username || `ID: ${log.userId}`}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{formatDate(log.occurredAt)}</TableCell>
                                                        <TableCell>
                                                            <span className="text-sm text-muted-foreground">{log.ipAddress || "-"}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => viewLogDetails(log)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Xem
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => {
                                                        const newPage = Math.max(0, currentPage - 1)
                                                        setCurrentPage(newPage)
                                                        handleFilterChange(newPage)
                                                    }}
                                                    className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const page = currentPage < 3 ? i : currentPage - 2 + i
                                                if (page >= totalPages) return null
                                                return (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            onClick={() => {
                                                                setCurrentPage(page)
                                                                handleFilterChange(page)
                                                            }}
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
                                                    onClick={() => {
                                                        const newPage = Math.min(totalPages - 1, currentPage + 1)
                                                        setCurrentPage(newPage)
                                                        handleFilterChange(newPage)
                                                    }}
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

                {/* Tab 2: Tìm kiếm */}
                <TabsContent value="search" className="space-y-4">
                    <Card className="shadow-vibrant hover-glow border-gradient">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Bộ lọc tìm kiếm
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Hành động</Label>
                                    <Input
                                        placeholder="VD: CREATE_EMPLOYEE, UPDATE_PAYROLL"
                                        value={searchParams.action || ""}
                                        onChange={(e) => setSearchParams(prev => ({ ...prev, action: e.target.value || undefined }))}
                                    />
                                </div>

                                <div>
                                    <Label>Người dùng</Label>
                                    <Select
                                        value={searchParams.userId ? searchParams.userId.toString() : "__all__"}
                                        onValueChange={(value) => setSearchParams(prev => ({ ...prev, userId: value === "__all__" ? undefined : parseInt(value) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn người dùng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Tất cả</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                                    {emp.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Entity</Label>
                                    <Select
                                        value={searchParams.entity || "__all__"}
                                        onValueChange={(value) => setSearchParams(prev => ({ ...prev, entity: value === "__all__" ? undefined : value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn entity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Tất cả</SelectItem>
                                            {entityTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Entity ID</Label>
                                    <Input
                                        type="number"
                                        placeholder="Nhập Entity ID"
                                        value={searchParams.entityId || ""}
                                        onChange={(e) => setSearchParams(prev => ({ ...prev, entityId: e.target.value ? parseInt(e.target.value) : undefined }))}
                                    />
                                </div>

                                <div>
                                    <Label>Từ ngày</Label>
                                    <Input
                                        type="datetime-local"
                                        value={searchParams.from ? searchParams.from.substring(0, 16) : ""}
                                        onChange={(e) => setSearchParams(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                                    />
                                </div>

                                <div>
                                    <Label>Đến ngày</Label>
                                    <Input
                                        type="datetime-local"
                                        value={searchParams.to ? searchParams.to.substring(0, 16) : ""}
                                        onChange={(e) => setSearchParams(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Button onClick={() => {
                                    setSearchCurrentPage(0)
                                    handleSearch(0)
                                }} disabled={searchLoading} className="bg-beauty-gradient hover:shadow-vibrant text-white">
                                    <Search className="h-4 w-4 mr-2" />
                                    {searchLoading ? "Đang tìm..." : "Tìm kiếm"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {searchLoading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Đang tìm kiếm...</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Không có kết quả tìm kiếm</p>
                        </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kết quả tìm kiếm: {searchTotalElements} nhật ký</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Hành động</TableHead>
                                                    <TableHead>Entity</TableHead>
                                                    <TableHead>Người dùng</TableHead>
                                                    <TableHead>Thời gian</TableHead>
                                                    <TableHead>Thao tác</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {searchResults.map((log) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="font-medium">{log.id}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{log.action}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {log.entity && log.entityId ? (
                                                                <span>{log.entity} #{log.entityId}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{log.username || `ID: ${log.userId}`}</TableCell>
                                                        <TableCell>{formatDate(log.occurredAt)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => viewLogDetails(log)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Xem
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Search Pagination */}
                            {searchTotalPages > 1 && (
                                <div className="flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => {
                                                        const newPage = Math.max(0, searchCurrentPage - 1)
                                                        handleSearch(newPage)
                                                    }}
                                                    className={searchCurrentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: Math.min(5, searchTotalPages) }, (_, i) => {
                                                const page = searchCurrentPage < 3 ? i : searchCurrentPage - 2 + i
                                                if (page >= searchTotalPages) return null
                                                return (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            onClick={() => {
                                                                handleSearch(page)
                                                            }}
                                                            isActive={searchCurrentPage === page}
                                                            className="cursor-pointer"
                                                        >
                                                            {page + 1}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            })}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => {
                                                        const newPage = Math.min(searchTotalPages - 1, searchCurrentPage + 1)
                                                        handleSearch(newPage)
                                                    }}
                                                    className={searchCurrentPage === searchTotalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chi tiết nhật ký giám sát</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">ID</Label>
                                    <p className="text-sm font-medium">{selectedLog.id}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Hành động</Label>
                                    <p className="text-sm font-medium">
                                        <Badge variant="outline">{selectedLog.action}</Badge>
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Entity</Label>
                                    <p className="text-sm font-medium">
                                        {selectedLog.entity ? `${selectedLog.entity}${selectedLog.entityId ? ` #${selectedLog.entityId}` : ""}` : "-"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Người dùng</Label>
                                    <p className="text-sm font-medium">{selectedLog.username || `ID: ${selectedLog.userId}`}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Thời gian xảy ra</Label>
                                    <p className="text-sm font-medium">{formatDate(selectedLog.occurredAt)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">IP Address</Label>
                                    <p className="text-sm font-medium">{selectedLog.ipAddress || "-"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">User Agent</Label>
                                    <p className="text-sm font-medium text-xs break-all">{selectedLog.userAgent || "-"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Request ID</Label>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-mono">{selectedLog.requestId || "-"}</p>
                                        {selectedLog.requestId && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => copyRequestId(selectedLog.requestId!)}
                                                className="h-6 w-6 p-0"
                                            >
                                                {copiedRequestId === selectedLog.requestId ? (
                                                    <Check className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Ngày tạo</Label>
                                    <p className="text-sm font-medium">{formatDate(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Ngày cập nhật</Label>
                                    <p className="text-sm font-medium">{selectedLog.updatedAt ? formatDate(selectedLog.updatedAt) : "-"}</p>
                                </div>
                            </div>
                            {selectedLog.details && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Chi tiết</Label>
                                    <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-wrap">
                                        {selectedLog.details}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

