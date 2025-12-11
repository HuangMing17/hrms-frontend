"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Input, InputProps } from "./input"
import { Label, LabelProps } from "./label"
import { cn } from "./utils"

interface AnimatedInputProps extends Omit<InputProps, 'id'> {
  /**
   * Label text (optional)
   */
  label?: string
  /**
   * Error message to display
   */
  error?: string
  /**
   * Show label animation on focus
   */
  animatedLabel?: boolean
  /**
   * Input id (required for label association)
   */
  id?: string
}

/**
 * AnimatedInput - Input component với focus animations và error states
 */
export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, label, error, animatedLabel = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    React.useEffect(() => {
      if (props.value || props.defaultValue) {
        setHasValue(true)
      }
    }, [props.value, props.defaultValue])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
      if (!e.target.value) {
        setHasValue(false)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <motion.div
            initial={false}
            animate={{
              scale: isFocused || hasValue ? 0.9 : 1,
              y: isFocused || hasValue ? -4 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Label
              htmlFor={props.id}
              className={cn(
                "absolute left-3 top-2 text-sm transition-colors",
                isFocused ? "text-primary" : "text-muted-foreground",
                error && "text-destructive"
              )}
            >
              {label}
            </Label>
          </motion.div>
        )}
        <motion.div
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          <Input
            ref={ref}
            className={cn(
              "transition-all duration-200",
              label && "pt-6",
              error && "border-destructive focus-visible:ring-destructive/20",
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-invalid={!!error}
            {...props}
          />
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

AnimatedInput.displayName = "AnimatedInput"

export { AnimatedInput }

