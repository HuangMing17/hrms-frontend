"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { CARD_ITEM } from "../../lib/animations"
import { ReactNode } from "react"
import { cn } from "./utils"

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  index?: number
}

/**
 * Animated Card với entrance animation
 * Sử dụng thay cho Card để có animation khi xuất hiện
 * Giữ nguyên tất cả props và styling của Card gốc
 */
export function AnimatedCard({ children, className, index = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      variants={CARD_ITEM}
      initial="initial"
      animate="animate"
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: "easeOut",
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card className={className}>
        {children}
      </Card>
    </motion.div>
  )
}

/**
 * Container cho nhiều AnimatedCard với stagger effect
 */
interface AnimatedCardContainerProps {
  children: ReactNode
  className?: string
}

export function AnimatedCardContainer({ children, className }: AnimatedCardContainerProps) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
          },
        },
      }}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  )
}

