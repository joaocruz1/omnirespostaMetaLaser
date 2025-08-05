"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
  caption?: string
}

export function ImageViewer({ src, alt, isOpen, onClose, caption }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Reset transformations when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      setIsFullscreen(false)
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "=":
        case "+":
          e.preventDefault()
          handleZoomIn()
          break
        case "-":
          e.preventDefault()
          handleZoomOut()
          break
        case "r":
        case "R":
          e.preventDefault()
          handleRotate()
          break
        case "f":
        case "F":
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.1))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = alt || "image"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "p-0 border-0 bg-black/95 backdrop-blur-sm",
          isFullscreen ? "max-w-full max-h-full w-screen h-screen" : "max-w-4xl max-h-[90vh]",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
              disabled={scale <= 0.1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
              disabled={scale >= 5}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button variant="ghost" size="sm" onClick={handleRotate} className="text-white hover:bg-white/20">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-white/20">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image container */}
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden",
            isFullscreen ? "h-screen" : "h-[70vh]",
            scale > 1 ? "cursor-grab" : "cursor-zoom-in",
            isDragging ? "cursor-grabbing" : "",
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={scale === 1 ? handleZoomIn : undefined}
        >
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>

        {/* Caption */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <p className="text-white text-sm text-center">{caption}</p>
          </div>
        )}

        {/* Help text */}
        <div className="absolute bottom-4 right-4 text-white/60 text-xs">
          <div className="bg-black/30 rounded px-2 py-1">
            <p>Scroll: Zoom • Drag: Pan • R: Rotate • F: Fullscreen</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
