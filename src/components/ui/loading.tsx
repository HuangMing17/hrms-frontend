"use client"

import { cn } from "./utils"
import { Loader2 } from "lucide-react"

/**
 * Loading Spinner Component - Reusable spinner for loading states
 */
interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg"
    className?: string
    text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8"
    }

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className={cn("animate-spin text-purple-500", sizeClasses[size])} />
                {text && <p className="text-sm text-muted-foreground">{text}</p>}
            </div>
        </div>
    )
}

/**
 * Loading Card Content - Shows loading state in a card
 */
interface LoadingCardProps {
    className?: string
    showText?: boolean
}

export function LoadingCard({ className, showText = false }: LoadingCardProps) {
    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <LoadingSpinner size="md" />
            {showText && <span className="text-2xl font-bold text-gradient">...</span>}
        </div>
    )
}

/**
 * Loading Table Row - Shows loading state in a table
 */
interface LoadingTableProps {
    colSpan?: number
    message?: string
    className?: string
}

export function LoadingTable({ colSpan = 1, message, className }: LoadingTableProps) {
    return (
        <tr>
            <td colSpan={colSpan} className={cn("text-center py-8", className)}>
                <LoadingSpinner size="md" text={message || "Đang tải dữ liệu..."} />
            </td>
        </tr>
    )
}

/**
 * Loading Page - Full page loading overlay
 */
interface LoadingPageProps {
    message?: string
    className?: string
}

export function LoadingPage({ message = "Đang tải...", className }: LoadingPageProps) {
    return (
        <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-lg text-muted-foreground">{message}</p>
            </div>
        </div>
    )
}

/**
 * Loading Inline - Inline loading indicator
 */
interface LoadingInlineProps {
    size?: "sm" | "md" | "lg"
    className?: string
}

export function LoadingInline({ size = "sm", className }: LoadingInlineProps) {
    return <LoadingSpinner size={size} className={className} />
}

