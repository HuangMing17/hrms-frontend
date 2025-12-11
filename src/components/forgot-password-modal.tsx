"use client"

import { useState } from "react"
import { Mail, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { authAPI, ForgotPasswordResponse } from "../lib/api"
import { SHAKE_ANIMATION } from "../lib/animations"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response: ForgotPasswordResponse = await authAPI.forgotPassword(email)
      
      // Log request ID for debugging
      if (response.requestId) {
        console.debug(`Forgot password - Request ID: ${response.requestId}`)
      }

      // Handle microservices response format
      console.log('Reset link:', response.data?.resetLink ?? response.resetLink)

      setSuccess(true)
      setEmail("")
    } catch (error: any) {
      // Enhanced error message parsing for microservices format
      let errorMessage = 'Có lỗi xảy ra khi gửi email khôi phục'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
        
        // Log request ID if available for debugging
        if (errorData.requestId) {
          console.debug(`Forgot password error - Request ID: ${errorData.requestId}`)
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {success ? "Email đã được gửi" : "Quên mật khẩu"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {success ? (
            // Success Message
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 dark:text-green-400">
                  Kiểm tra email của bạn
                </h3>
                <p className="text-sm text-muted-foreground">
                  Chúng tôi đã gửi link khôi phục mật khẩu đến email của bạn. 
                  Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                </p>
                <p className="text-xs text-muted-foreground">
                  Không thấy email? Kiểm tra thư mục spam hoặc thử lại sau vài phút.
                </p>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  onClick={handleClose}
                  className="w-full bg-beauty-gradient hover:shadow-vibrant text-white"
                >
                  Đóng
                </Button>
              </motion.div>
            </div>
          ) : (
            // Forgot Password Form
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi link khôi phục mật khẩu đến email của bạn.
                </p>
              </div>

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

                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">
                    Địa chỉ email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <motion.div
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.15 }}
                      className="relative"
                    >
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Nhập địa chỉ email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        disabled={isLoading}
                      />
                    </motion.div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <motion.div
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                    transition={{ duration: 0.15 }}
                    className="flex-1"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="w-full"
                      disabled={isLoading}
                    >
                      Hủy
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={!isLoading && email.trim() ? { scale: 1.02 } : {}}
                    whileTap={!isLoading && email.trim() ? { scale: 0.98 } : {}}
                    transition={{ duration: 0.15 }}
                    className="flex-1"
                  >
                    <Button
                      type="submit"
                      className="w-full bg-beauty-gradient hover:shadow-vibrant text-white"
                      disabled={isLoading || !email.trim()}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang gửi...
                        </div>
                      ) : (
                        "Gửi email"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}