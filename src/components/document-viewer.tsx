"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Download,
  FileText,
  ImageIcon,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentViewerProps {
  src: string
  fileName: string
  fileType: string
  fileSize?: number
  isOpen: boolean
  onClose: () => void
  caption?: string
}

export function DocumentViewer({ src, fileName, fileType, fileSize, isOpen, onClose, caption }: DocumentViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setIsFullscreen(false)
      setError(null)
      setIsLoading(true)
      generatePreview()
    }
  }, [isOpen, src])

  // Generate preview based on file type
  const generatePreview = async () => {
    try {
      setIsLoading(true)

      // For PDFs, we can use the browser's built-in PDF viewer
      if (fileType.includes("pdf")) {
        setPreviewUrl(src)
        setIsLoading(false)
        return
      }

      // For images, use direct URL
      if (fileType.startsWith("image/")) {
        setPreviewUrl(src)
        setIsLoading(false)
        return
      }

      // For text files, try to fetch and display content
      if (fileType.startsWith("text/") || fileType.includes("json") || fileType.includes("xml")) {
        try {
          const response = await fetch(src)
          const text = await response.text()
          setPreviewUrl(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
        } catch {
          setError("Não foi possível carregar o conteúdo do arquivo")
        }
        setIsLoading(false)
        return
      }

      // For other file types, show file info only
      setPreviewUrl(null)
      setIsLoading(false)
    } catch (err) {
      setError("Erro ao gerar pré-visualização")
      setIsLoading(false)
    }
  }

  // Keyboard shortcuts
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
        case "d":
        case "D":
          e.preventDefault()
          handleDownload()
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Tamanho desconhecido"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
  }

  const getFileIcon = () => {
    if (fileType.startsWith("image/")) return ImageIcon
    if (fileType.includes("pdf")) return FileText
    return File
  }

  const FileIcon = getFileIcon()

  const canPreview = () => {
    return (
      fileType.includes("pdf") ||
      fileType.startsWith("image/") ||
      fileType.startsWith("text/") ||
      fileType.includes("json") ||
      fileType.includes("xml")
    )
  }

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white/70">Carregando pré-visualização...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">{error}</p>
            <Button onClick={handleDownload} variant="outline" className="text-white border-white/20 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Baixar arquivo
            </Button>
          </div>
        </div>
      )
    }

    if (!canPreview() || !previewUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <FileIcon className="h-16 w-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pré-visualização não disponível</h3>
            <p className="text-white/70 mb-4">Este tipo de arquivo não pode ser visualizado no navegador.</p>
            <div className="space-y-2 mb-4">
              <Badge variant="outline" className="text-white border-white/20">
                {fileType}
              </Badge>
              {fileSize && (
                <Badge variant="outline" className="text-white border-white/20 ml-2">
                  {formatFileSize(fileSize)}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleDownload} className="bg-purple-600 hover:bg-purple-700">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                onClick={() => window.open(src, "_blank")}
                variant="outline"
                className="text-white border-white/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // PDF Preview
    if (fileType.includes("pdf")) {
      return (
        <div className="h-full w-full">
          <iframe
            src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0 rounded-lg"
            title={fileName}
          />
        </div>
      )
    }

    // Image Preview
    if (fileType.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center h-full overflow-hidden">
          <img
            src={previewUrl || "/placeholder.svg"}
            alt={fileName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      )
    }

    // Text Preview
    if (fileType.startsWith("text/") || fileType.includes("json") || fileType.includes("xml")) {
      return (
        <ScrollArea className="h-full w-full">
          <div className="p-4">
            <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-lg">
              {previewUrl && decodeURIComponent(previewUrl.split(",")[1])}
            </pre>
          </div>
        </ScrollArea>
      )
    }

    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "p-0 border-0 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm text-white",
          isFullscreen ? "max-w-full max-h-full w-screen h-screen" : "max-w-4xl max-h-[90vh]",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FileIcon className="h-6 w-6 text-purple-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{fileName}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs text-white border-white/20">
                  {fileType}
                </Badge>
                {fileSize && (
                  <Badge variant="outline" className="text-xs text-white border-white/20">
                    {formatFileSize(fileSize)}
                  </Badge>
                )}
              </div>
              {caption && <p className="text-sm text-white/70 truncate mt-1">{caption}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canPreview() && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="text-white hover:bg-white/20"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="text-white hover:bg-white/20"
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                {fileType.startsWith("image/") && (
                  <Button variant="ghost" size="sm" onClick={handleRotate} className="text-white hover:bg-white/20">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-white/20">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={cn("overflow-hidden", isFullscreen ? "h-[calc(100vh-80px)]" : "h-[70vh]")}>
          {renderPreview()}
        </div>

        {/* Footer with shortcuts */}
        <div className="p-2 border-t border-white/10">
          <div className="text-center text-white/50 text-xs">
            <p>
              {canPreview() && "+/-: Zoom • R: Rotate • F: Fullscreen • "}
              D: Download • ESC: Close
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
