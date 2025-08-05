"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Play, FileText, ImageIcon, Volume2, MapPin, ExternalLink, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageViewer } from "./image-viewer"
import { AudioPlayer } from "./audio-player"
import { DocumentViewer } from "./document-viewer"

interface MessageMediaProps {
  messageId: string
  chatId: string
  type: "image" | "audio" | "video" | "document" | "location"
  content: string
  className?: string
}

export function MessageMedia({ messageId, chatId, type, content, className }: MessageMediaProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)

  const loadMedia = async () => {
    if (mediaUrl || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/chats/${chatId}/media/${messageId}`)

      if (!response.ok) {
        throw new Error("Falha ao carregar mídia")
      }

      const data = await response.json()
      setMediaUrl(data.mediaUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mídia")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadMedia = () => {
    if (!mediaUrl) return

    const link = document.createElement("a")
    link.href = mediaUrl
    link.download = `media_${messageId}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || ""
  }

  const getFileType = (filename: string) => {
    const ext = getFileExtension(filename)
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      json: "application/json",
      xml: "application/xml",
      csv: "text/csv",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
    }
    return mimeTypes[ext] || "application/octet-stream"
  }

  const renderMediaContent = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <FileText className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">Erro ao carregar mídia</span>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      )
    }

    if (!mediaUrl) {
      const icons = {
        image: ImageIcon,
        audio: Volume2,
        video: Play,
        document: FileText,
        location: MapPin,
      }
      const Icon = icons[type]

      return (
        <Button variant="outline" size="sm" onClick={loadMedia} className="flex items-center space-x-2 bg-transparent">
          <Icon className="h-4 w-4" />
          <span>
            Carregar{" "}
            {type === "image"
              ? "imagem"
              : type === "audio"
                ? "áudio"
                : type === "video"
                  ? "vídeo"
                  : type === "location"
                    ? "localização"
                    : "documento"}
          </span>
        </Button>
      )
    }

    switch (type) {
      case "image":
        return (
          <>
            <div className="relative group">
              <img
                src={mediaUrl || "/placeholder.svg"}
                alt="Imagem"
                className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageViewer(true)}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  downloadMedia()
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="h-3 w-3" />
              </Button>
              {content && <p className="text-sm mt-2">{content}</p>}
            </div>
            <ImageViewer
              src={mediaUrl || "/placeholder.svg"}
              alt={content || "Imagem"}
              isOpen={showImageViewer}
              onClose={() => setShowImageViewer(false)}
              caption={content}
            />
          </>
        )

      case "audio":
        return (
          <>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAudioPlayer(true)}
                className="flex items-center space-x-2 p-0 h-auto hover:bg-transparent"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Mensagem de áudio</p>
                  <p className="text-xs text-gray-500">Clique para reproduzir</p>
                </div>
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadMedia} className="ml-auto">
                <Download className="h-3 w-3" />
              </Button>
            </div>
            <AudioPlayer
              src={mediaUrl || ""}
              title={content || "Áudio"}
              isOpen={showAudioPlayer}
              onClose={() => setShowAudioPlayer(false)}
              caption={content}
            />
          </>
        )

      case "video":
        return (
          <div className="relative group max-w-xs">
            <video src={mediaUrl} controls className="w-full max-h-64 rounded-lg" preload="metadata" />
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadMedia}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="h-3 w-3" />
            </Button>
            {content && content !== "[Vídeo]" && <p className="text-sm mt-2">{content}</p>}
          </div>
        )

      case "document":
        return (
          <>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{content || "Documento"}</p>
                <p className="text-xs text-gray-500 truncate">
                  {getFileExtension(content || "documento").toUpperCase()} • Clique para visualizar
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocumentViewer(true)}
                    className="p-0 h-auto text-purple-600 hover:text-purple-700"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="text-xs">Visualizar</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={downloadMedia} className="p-0 h-auto">
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Baixar</span>
                  </Button>
                </div>
              </div>
            </div>
            <DocumentViewer
              src={mediaUrl || ""}
              fileName={content || "documento"}
              fileType={getFileType(content || "documento")}
              isOpen={showDocumentViewer}
              onClose={() => setShowDocumentViewer(false)}
              caption={content}
            />
          </>
        )

      case "location":
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-xs">
            <MapPin className="h-8 w-8 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Localização</p>
              {content && <p className="text-xs text-gray-500 truncate">{content}</p>}
              {mediaUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(mediaUrl, "_blank")}
                  className="mt-1 p-0 h-auto"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span className="text-xs">Ver no mapa</span>
                </Button>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return <div className={cn("inline-block", className)}>{renderMediaContent()}</div>
}
