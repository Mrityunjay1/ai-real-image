// Simplified version of the toast hook
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const toast = ({ title, description, variant = "default" }: ToastProps) => {
  return sonnerToast(title, {
    description,
    className: variant === "destructive" ? "bg-red-900 text-white" : undefined,
  })
}

