"use client"

import { motion } from "framer-motion"
import { LIST_CONTAINER, LIST_ITEM } from "../../lib/animations"
import { ReactNode } from "react"
import { cn } from "./utils"

interface AnimatedListContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Animated List Container với stagger animation cho các items
 * Sử dụng để wrap danh sách và tự động animate các children
 */
export function AnimatedListContainer({ children, className }: AnimatedListContainerProps) {
  return (
    <motion.div
      className={className}
      variants={LIST_CONTAINER}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  index?: number
  onClick?: () => void
}

/**
 * Animated List Item với entrance animation
 * Sử dụng để wrap từng item trong list để có animation khi xuất hiện
 */
export function AnimatedListItem({ children, className, index = 0, onClick }: AnimatedListItemProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={LIST_ITEM}
      initial="initial"
      animate="animate"
      transition={{
        delay: index * 0.05,
        duration: 0.25,
        ease: "easeOut",
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

