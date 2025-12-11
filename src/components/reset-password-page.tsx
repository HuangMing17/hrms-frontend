"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { cn } from "./ui/utils"
import { authAPI, ValidateResetTokenResponse, ResetPasswordResponse } from "../lib/api"
import { SHAKE_ANIMATION, PAGE_TRANSITION } from "../lib/animations"

interface ResetPasswordPageProps {
  token: string
}

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError('Token không hợp lệ')
        setIsValidating(false)
        return
      }

      try {
        const response: ValidateResetTokenResponse = await authAPI.validateResetToken(token)
        
        if (response.requestId) {
          console.debug(`Validate token - Request ID: ${response.requestId}`)
        }

        // Handle microservices response format
        const isValid = response.data?.valid ?? response.valid
        const message = response.data?.message ?? response.message

        if (isValid) {
          setTokenValid(true)
        } else {
          setValidationError(message || 'Token không hợp lệ hoặc đã hết hạn')
        }
      } catch (error: any) {
        let errorMessage = 'Không thể xác thực token'
        
        if (error.response?.data) {
          const errorData = error.response.data
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
          
          if (errorData.requestId) {
            console.debug(`Validate token error - Request ID: ${errorData.requestId}`)
          }
        }
        
        setValidationError(errorMessage)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  // Password validation
  const validatePasswords = () => {
    if (newPassword.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự"
    }
    if (newPassword !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    const passwordError = validatePasswords()
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsLoading(true)

    try {
      const response: ResetPasswordResponse = await authAPI.resetPassword(token, newPassword)
      
      if (response.requestId) {
        console.debug(`Reset password - Request ID: ${response.requestId}`)
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
      
    } catch (error: any) {
      let errorMessage = 'Có lỗi xảy ra khi đặt lại mật khẩu'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
        
        if (errorData.requestId) {
          console.debug(`Reset password error - Request ID: ${errorData.requestId}`)
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/')
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground">Đang xác thực token...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-700 dark:text-red-400">Token không hợp lệ</CardTitle>
            <CardDescription>
              {validationError || 'Link khôi phục mật khẩu không hợp lệ hoặc đã hết hạn'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                onClick={handleBackToLogin}
                className="w-full bg-beauty-gradient hover:shadow-vibrant text-white"
              >
                Quay lại đăng nhập
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-700 dark:text-green-400">Thành công!</CardTitle>
            <CardDescription>
              Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển đến trang đăng nhập trong giây lát.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                onClick={handleBackToLogin}
                className="w-full bg-beauty-gradient hover:shadow-vibrant text-white"
              >
                Đăng nhập ngay
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reset password form
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu mới để hoàn tất quá trình khôi phục
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: [0, -10, 10, -10, 10, 0],
                  }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className="relative"
                >
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    disabled={isLoading}
                  />
                </motion.div>
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className="relative"
                >
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "pl-10 pr-10 h-11",
                      confirmPassword && newPassword !== confirmPassword && "border-destructive focus-visible:ring-destructive/20"
                    )}
                    required
                    disabled={isLoading}
                    aria-invalid={confirmPassword && newPassword !== confirmPassword}
                  />
                </motion.div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {confirmPassword && newPassword !== confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                  >
                    Mật khẩu xác nhận không khớp
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password requirements */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Mật khẩu phải:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={newPassword.length >= 6 ? "text-green-600" : ""}>
                  Có ít nhất 6 ký tự
                </li>
                <li className={newPassword === confirmPassword && newPassword.length > 0 ? "text-green-600" : ""}>
                  Khớp với mật khẩu xác nhận
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={!isLoading && newPassword && confirmPassword ? { scale: 1.02 } : {}}
              whileTap={!isLoading && newPassword && confirmPassword ? { scale: 0.98 } : {}}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                className="w-full bg-beauty-gradient hover:shadow-vibrant text-white h-11"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang cập nhật...
                  </div>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </Button>
            </motion.div>

            {/* Back to Login */}
            <motion.div
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToLogin}
                className="w-full"
                disabled={isLoading}
              >
                Quay lại đăng nhập
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}