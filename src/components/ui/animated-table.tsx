"use client"

import { motion } from "framer-motion"
import { TableBody, TableRow } from "./table"
import { TABLE_ROW_CONTAINER, TABLE_ROW_ITEM } from "../../lib/animations"
import { ReactNode } from "react"
import { cn } from "./utils"

interface AnimatedTableBodyProps {
  children: ReactNode
  className?: string
}

/**
 * Animated TableBody với stagger animation cho các rows
 * Wrap TableBody với motion.tbody để có stagger effect
 */
export function AnimatedTableBody({ children, className }: AnimatedTableBodyProps) {
  return (
    <motion.tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      variants={TABLE_ROW_CONTAINER}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.tbody>
  )
}

interface AnimatedTableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  title?: string
}

/**
 * Animated TableRow với entrance animation
 * Sử dụng thay cho TableRow để có animation khi xuất hiện
 * Giữ nguyên tất cả styling và behavior của TableRow gốc
 */
export function AnimatedTableRow({ children, className, onClick, title }: AnimatedTableRowProps) {
  return (
    <motion.tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      variants={TABLE_ROW_ITEM}
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      title={title}
    >
      {children}
    </motion.tr>
  )
}

