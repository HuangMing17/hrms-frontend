"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button, ButtonProps, buttonVariants } from "./button"
import { cn } from "./utils"

interface AnimatedButtonProps extends Omit<ButtonProps, 'asChild'> {
  /**
   * Enable scale animation on click
   * @default true
   */
  enableClickAnimation?: boolean
  /**
   * Enable hover animation
   * @default true
   */
  enableHoverAnimation?: boolean
}

/**
 * AnimatedButton - Button component với hover và click animations
 * Wraps Button component với Framer Motion animations
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    enableClickAnimation = true,
    enableHoverAnimation = true,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <motion.div
        whileHover={!disabled && enableHoverAnimation ? { scale: 1.05 } : {}}
        whileTap={!disabled && enableClickAnimation ? { scale: 0.98 } : {}}
        transition={{ duration: 0.15 }}
        className="inline-block"
      >
        <Button
          ref={ref}
          className={cn(
            "transition-all duration-200",
            enableHoverAnimation && !disabled && "hover:shadow-lg",
            className
          )}
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"

export { AnimatedButton, buttonVariants }

