"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ResetPasswordPage } from "../../components/reset-password-page"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  return <ResetPasswordPage token={token} />
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Đang tải...</span>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}