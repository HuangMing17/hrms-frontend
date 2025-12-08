"use client"

import { useState } from "react"
import { Eye, EyeOff, Sparkles, Lock, User, TrendingUp, Users, BarChart3 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"
import { useAuth } from "../hooks/useAuth"
import { ForgotPasswordModal } from "./forgot-password-modal"

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login(usernameOrEmail, password)
      onLogin()
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login failed:', error)
    }
  }

  const handleGoogleLogin = async () => {
    clearError()

    try {
      await loginWithGoogle()
      onLogin()
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Google Sign-In failed:', error)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-beauty-gradient rounded-full blur-md opacity-60"></div>
                <div className="relative bg-beauty-gradient p-2.5 rounded-full">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient">GODCosmetics</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 dark:text-white">Đăng nhập</h1>
            <p className="text-muted-foreground">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleTraditionalLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-sm font-medium">
                Tên đăng nhập hoặc Email
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="Nhập tên đăng nhập hoặc email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-gradient hover:opacity-80 transition-opacity font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-beauty-gradient hover:shadow-vibrant text-white border-0 h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-muted-foreground">Hoặc</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 h-12"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
          </Button>

          {/* Create Account */}
          <div className="text-center">
            <button className="text-gradient hover:opacity-80 transition-opacity font-medium">
              Tạo tài khoản mới
            </button>
          </div>


        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-beauty-gradient items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-white text-center max-w-lg">
          {/* Main Title */}
          <div className="mb-8">
            <Sparkles className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl font-bold mb-4">
              Hệ thống Quản lý Nhân sự
            </h2>
            <p className="text-xl opacity-90">
              Quản lý hiệu quả nguồn nhân lực của doanh nghiệp
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-6 mt-12">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl">
              <div className="p-3 bg-white/20 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Quản lý nhân viên</h3>
                <p className="text-sm opacity-80">Theo dõi thông tin và hồ sơ nhân viên toàn diện</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl">
              <div className="p-3 bg-white/20 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Báo cáo & Thống kê</h3>
                <p className="text-sm opacity-80">Phân tích dữ liệu và đưa ra quyết định chính xác</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl">
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Hiệu suất & Đánh giá</h3>
                <p className="text-sm opacity-80">Theo dõi và cải thiện năng suất làm việc</p>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <div className="mt-12 text-sm opacity-75">
            <p>© 2024 GODCosmetics. Bảo mật và riêng tư.</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  )
}
