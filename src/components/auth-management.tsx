"use client"

import { useState } from "react"
import { Shield, Users, Key, Plus, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

const roles = [
  { id: 1, name: "Admin", description: "Toàn quyền hệ thống", users: 2, permissions: 15 },
  { id: 2, name: "HR Manager", description: "Quản lý nhân sự", users: 3, permissions: 12 },
  { id: 3, name: "Department Manager", description: "Quản lý phòng ban", users: 8, permissions: 8 },
  { id: 4, name: "Employee", description: "Nhân viên", users: 235, permissions: 4 },
]

const users = [
  { id: 1, name: "Nguyễn Văn Admin", email: "admin@company.com", role: "Admin", status: "Hoạt động", lastLogin: "2024-01-15 09:30" },
  { id: 2, name: "Trần Thị HR", email: "hr@company.com", role: "HR Manager", status: "Hoạt động", lastLogin: "2024-01-15 08:45" },
  { id: 3, name: "Lê Văn Manager", email: "manager@company.com", role: "Department Manager", status: "Hoạt động", lastLogin: "2024-01-14 17:20" },
]

export function AuthManagement() {
  const [activeTab, setActiveTab] = useState("roles")

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gradient">Xác thực & Phân quyền</h2>
        <p className="text-muted-foreground">Quản lý vai trò, quyền hạn và bảo mật tài khoản</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng vai trò</CardTitle>
            <div className="p-2 rounded-full bg-purple-gradient">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">4</div>
            <p className="text-xs text-muted-foreground">Vai trò đã định nghĩa</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
            <div className="p-2 rounded-full bg-rose-gradient">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">248</div>
            <p className="text-xs text-muted-foreground">Đang đăng nhập</p>
          </CardContent>
        </Card>

        <Card className="shadow-vibrant hover-glow border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phiên đăng nhập</CardTitle>
            <div className="p-2 rounded-full bg-beauty-gradient">
              <Key className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">156</div>
            <p className="text-xs text-muted-foreground">Phiên hiện tại</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900">
          <TabsTrigger value="roles" className="data-[state=active]:bg-purple-gradient data-[state=active]:text-white">Quản lý vai trò</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-rose-gradient data-[state=active]:text-white">Người dùng</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-beauty-gradient data-[state=active]:text-white">Bảo mật</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Danh sách vai trò</h3>
            <Button className="bg-purple-gradient hover:shadow-vibrant text-white border-0">
              <Plus className="h-4 w-4 mr-2" />
              Thêm vai trò
            </Button>
          </div>

          <div className="rounded-md border border-gradient shadow-vibrant">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                  <TableHead>Tên vai trò</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số người dùng</TableHead>
                  <TableHead>Quyền hạn</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.users} người</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">{role.permissions} quyền</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quản lý tài khoản</h3>
            <div className="flex gap-2">
              <Input placeholder="Tìm kiếm người dùng..." className="w-64" />
              <Button className="bg-rose-gradient hover:shadow-vibrant text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Thêm người dùng
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-gradient shadow-vibrant">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đăng nhập cuối</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <h3 className="text-lg font-semibold">Cài đặt bảo mật</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-vibrant border-gradient">
              <CardHeader>
                <CardTitle className="text-gradient">Chính sách mật khẩu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Độ dài tối thiểu</Label>
                  <Input value="8" />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian hết hạn (ngày)</Label>
                  <Input value="90" />
                </div>
                <div className="space-y-2">
                  <Label>Số lần đăng nhập sai tối đa</Label>
                  <Input value="5" />
                </div>
                <Button className="w-full bg-purple-gradient hover:shadow-vibrant text-white border-0">Cập nhật chính sách</Button>
              </CardContent>
            </Card>

            <Card className="shadow-vibrant border-gradient">
              <CardHeader>
                <CardTitle className="text-gradient">Xác thực 2 yếu tố</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Trạng thái 2FA</Label>
                  <Select defaultValue="enabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Bật</SelectItem>
                      <SelectItem value="disabled">Tắt</SelectItem>
                      <SelectItem value="optional">Tùy chọn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phương thức xác thực</Label>
                  <Select defaultValue="sms">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="app">Ứng dụng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-beauty-gradient hover:shadow-vibrant text-white border-0">Cập nhật 2FA</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
