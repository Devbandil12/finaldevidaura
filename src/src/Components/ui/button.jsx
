import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "./utils" // we'll also add this helper

// Button variants using class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800",
        secondary: "bg-gray-200 text-black hover:bg-gray-300",
        outline: "border border-gray-300 text-black hover:bg-gray-100",
        ghost: "hover:bg-gray-100 text-black",
        link: "underline-offset-4 hover:underline text-black",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = "Button"
