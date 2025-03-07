"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "bg-gray-800 text-gray-100 border border-gray-700",
        descriptionClassName: "text-gray-400 text-sm",
      }}
    />
  )
}

