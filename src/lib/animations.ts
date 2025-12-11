/**
 * Animation utilities và constants
 * Centralized animation configurations để dễ maintain và consistent
 */

export const ANIMATION_DURATION = {
  FAST: 0.15,      // 150ms - Micro-interactions
  NORMAL: 0.3,     // 300ms - Standard transitions
  SLOW: 0.5,       // 500ms - Complex animations
  VERY_SLOW: 0.8,  // 800ms - Chart animations
} as const

export const ANIMATION_EASING = {
  EASE_OUT: [0.0, 0.0, 0.2, 1.0],      // Entrance animations
  EASE_IN: [0.4, 0.0, 1.0, 1.0],       // Exit animations
  EASE_IN_OUT: [0.4, 0.0, 0.2, 1.0],  // Transitions
  BOUNCE: [0.68, -0.55, 0.265, 1.55],  // Bounce effect
} as const

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: ANIMATION_DURATION.NORMAL, ease: ANIMATION_EASING.EASE_OUT },
} as const

export const MODAL_TRANSITION = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: ANIMATION_DURATION.NORMAL, ease: ANIMATION_EASING.EASE_OUT },
} as const

export const BACKDROP_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ANIMATION_DURATION.FAST },
} as const

export const STAGGER_CONTAINER = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Shake animation for error messages
 */
export const SHAKE_ANIMATION = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
  },
  transition: {
    duration: 0.5,
    ease: "easeInOut",
  },
} as const

/**
 * Page entrance with stagger for forms
 */
export const FORM_ENTRANCE = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const

export const FORM_ITEM_ENTRANCE = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const

/**
 * Table row animations
 */
export const TABLE_ROW_CONTAINER = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0, // Không có delay giữa các rows
        delayChildren: 0, // Không có delay ban đầu
      },
    },
  } as const
  
export const TABLE_ROW_ITEM = {
  initial: { opacity: 0, x: -10 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.2, // Giảm từ 0.3 xuống 0.2 để nhanh hơn
      ease: "easeOut",
    },
  },
} as const

/**
 * Card entrance animations
 */
export const CARD_CONTAINER = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const

export const CARD_ITEM = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
} as const

/**
 * List stagger animations
 */
export const LIST_CONTAINER = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
} as const

export const LIST_ITEM = {
  initial: { opacity: 0, x: -10 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
} as const

/**
 * Chart animations
 */
export const CHART_ANIMATION = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
} as const

/**
 * Bar chart animation - bars grow from bottom
 */
export const BAR_CHART_ANIMATION = {
  initial: { opacity: 0, scaleY: 0 },
  animate: { 
    opacity: 1, 
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
} as const

/**
 * Line chart animation - line draws from left to right
 */
export const LINE_CHART_ANIMATION = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
} as const

/**
 * Pie chart animation - slices appear with stagger
 */
export const PIE_CHART_ANIMATION = {
  initial: { opacity: 0, scale: 0 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
} as const

/**
 * Get animation variants với reduced motion support
 */
export const getAnimationVariants = (variants: typeof PAGE_TRANSITION) => {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
    }
  }
  return variants
}

