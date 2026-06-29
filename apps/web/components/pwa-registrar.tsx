"use client"

import { useEffect } from "react"

export function PWARegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered successfully with scope:", registration.scope)
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err)
          })
      })
    }
  }, [])

  return null
}
