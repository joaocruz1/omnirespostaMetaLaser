"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown } from "lucide-react"
import { MessageMedia } from "./message-media"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  type: "text" | "image" | "audio" | "document" | "location" | "video"
  sender: "agent" | "customer"
  timestamp: string
  hasMedia?: boolean
}

interface MessageListProps {
  chatId: string
  className?: string
}

export function MessageList({ chatId, className }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  const loadMessages = async (pageNum = 1, append = false) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/chats/${chatId}/messages?page=${pageNum}&limit=50`)

      if (!response.ok) {
        throw new Error("Falha ao carregar mensagens")
      }

      const data = await response.json()

      if (append) {
        setMessages((prev) => [...data.messages, ...prev])
      } else {
        setMessages(data.messages)
        setShouldScrollToBottom(true)
      }

      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreMessages = () => {
    if (hasMore && !isLoading) {
      loadMessages(page + 1, true)
    }
  }

  useEffect(() => {
    if (chatId) {
      setMessages([])
      setPage(1)
      setHasMore(true)
      loadMessages(1, false)
    }
  }, [chatId])

  useEffect(() => {
    if (shouldScrollToBottom && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
        setShouldScrollToBottom(false)
      }
    }
  }, [messages, shouldScrollToBottom])

  const scrollToBottom = () => {
    setShouldScrollToBottom(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erro ao carregar mensagens</p>
          <Button onClick={() => loadMessages(1, false)} variant="outline" size="sm">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {hasMore && (
            <div className="text-center">
              <Button onClick={loadMoreMessages} disabled={isLoading} variant="outline" size="sm">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mensagens anteriores"
                )}
              </Button>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.sender === "agent" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-3 py-2",
                  message.sender === "agent"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                )}
              >
                {message.hasMedia && message.type !== "text" ? (
                  <MessageMedia messageId={message.id} chatId={chatId} type={message.type} content={message.content} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                <p
                  className={cn(
                    "text-xs mt-1",
                    message.sender === "agent" ? "text-purple-100" : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}

          {isLoading && page === 1 && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </ScrollArea>

      <Button
        onClick={scrollToBottom}
        className="absolute bottom-4 right-4 rounded-full w-10 h-10 p-0 shadow-lg"
        variant="secondary"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
