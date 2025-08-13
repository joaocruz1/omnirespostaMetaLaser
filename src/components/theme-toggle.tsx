"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const handleThemeToggle = () => {
    if (isAnimating) return // Prevenir múltiplos cliques durante a animação
    
    setIsAnimating(true)
    setTheme(theme === "dark" ? "light" : "dark")
    
    // Reset da animação após 600ms
    setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon"
        className="theme-toggle-button relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] text-gray-600 dark:text-gray-400" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeToggle}
      disabled={isAnimating}
      className="theme-toggle-button relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md group"
    >
      {/* Sol - aparece no tema claro */}
      <Sun 
        className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ease-in-out ${
          theme === "dark" 
            ? "rotate-90 scale-0 opacity-0 text-gray-400" 
            : "rotate-0 scale-100 opacity-100 text-yellow-500"
        }`} 
      />
      
      {/* Lua - aparece no tema escuro */}
      <Moon 
        className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ease-in-out ${
          theme === "dark" 
            ? "rotate-0 scale-100 opacity-100 text-blue-400" 
            : "-rotate-90 scale-0 opacity-0 text-gray-400"
        }`} 
      />
      
      {/* Efeito de brilho durante a transição */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

