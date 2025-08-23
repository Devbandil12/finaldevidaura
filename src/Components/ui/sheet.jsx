import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "./utils"

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

export const SheetContent = React.forwardRef(({ className, side = "right", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-white p-6 shadow-lg transition-all",
        side === "right" && "inset-y-0 right-0 h-full w-3/4 max-w-sm",
        className
      )}
      {...props}
    />
  </SheetPrimitive.Portal>
))
SheetContent.displayName = "SheetContent"
