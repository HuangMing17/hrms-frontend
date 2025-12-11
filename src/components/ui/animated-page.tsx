"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PAGE_TRANSITION, getAnimationVariants } from "@/lib/animations"
import { ReactNode } from "react"

interface AnimatedPageProps {
  children: ReactNode
  pageKey?: string
  className?: string
}

/**
 * AnimatedPage - Wrapper component cho page transitions
 * Sử dụng để wrap nội dung khi chuyển trang
 */
export function AnimatedPage({ children, pageKey, className }: AnimatedPageProps) {
  const variants = getAnimationVariants(PAGE_TRANSITION)

  return (
    <motion.div
      key={pageKey}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={variants.transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedPageTransition - Component để wrap page content với AnimatePresence
 */
interface AnimatedPageTransitionProps {
  children: ReactNode
  activeView: string
  className?: string
}

export function AnimatedPageTransition({ children, activeView, className }: AnimatedPageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <AnimatedPage pageKey={activeView} className={className}>
        {children}
      </AnimatedPage>
    </AnimatePresence>
  )
}

