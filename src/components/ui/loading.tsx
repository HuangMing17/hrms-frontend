"use client"

import { motion } from "framer-motion"
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
        <motion.div 
            className={cn("flex items-center justify-center", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex flex-col items-center gap-2">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className={cn("text-purple-500", sizeClasses[size])} />
                </motion.div>
                {text && (
                    <motion.p 
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {text}
                    </motion.p>
                )}
            </div>
        </motion.div>
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
        <motion.div 
            className={cn("flex items-center justify-center min-h-[400px]", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div 
                className="flex flex-col items-center gap-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <LoadingSpinner size="lg" />
                <motion.p 
                    className="text-lg text-muted-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {message}
                </motion.p>
            </motion.div>
        </motion.div>
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

