import { Button } from "./ui/button"
import { cn } from "./ui/utils"

interface VibrantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "rose" | "purple" | "beauty" | "coral" | "gold"
  children: React.ReactNode
  className?: string
}

export function VibrantButton({ 
  variant = "beauty", 
  children, 
  className,
  ...props 
}: VibrantButtonProps) {
  const variants = {
    rose: "bg-rose-gradient hover-glow",
    purple: "bg-purple-gradient hover-glow", 
    beauty: "bg-beauty-gradient hover-glow",
    coral: "bg-coral-gradient hover-glow",
    gold: "bg-gold-gradient hover-glow"
  }

  return (
    <Button 
      className={cn(
        "text-white border-0 transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
