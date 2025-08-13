"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Edit, Save, X, Phone, Calendar } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Contact {
  id: string
  name: string
  phoneNumber: string
  isSaved: boolean
  profilePicUrl?: string
  createdAt?: string
}

interface ContactInfoModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function ContactInfoModal({ contact, isOpen, onClose, onUpdate }: ContactInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Resetar estado quando o modal abrir
  useEffect(() => {
    if (isOpen && contact) {
      setEditedName(contact.name || "")
      setIsEditing(false)
      setLoading(false)
    }
  }, [isOpen, contact])

  // Focar no input quando entrar em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 50)
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!contact || !editedName.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: contact.phoneNumber,
          name: editedName.trim(),
        }),
      })

      if (res.ok) {
        toast.success("Contato atualizado com sucesso!")
        setIsEditing(false)
        onUpdate()
      } else {
        toast.error("Falha ao atualizar contato")
      }
    } catch (error) {
      console.error("Failed to update contact:", error)
      toast.error("Erro ao atualizar contato")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNewContact = async () => {
    if (!contact || !editedName.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: contact.phoneNumber,
          name: editedName.trim(),
        }),
      })

      if (res.ok) {
        toast.success("Contato salvo com sucesso!")
        setIsEditing(false)
        onUpdate()
      } else {
        toast.error("Falha ao salvar contato")
      }
    } catch (error) {
      console.error("Failed to save contact:", error)
      toast.error("Erro ao salvar contato")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedName(contact?.name || "")
  }

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (contact?.isSaved) {
        handleSave()
      } else {
        handleSaveNewContact()
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  if (!contact) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informações do Contato</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Foto do Perfil */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 gradient-purple rounded-full flex items-center justify-center shadow-lg">
                {contact.profilePicUrl ? (
                  <img
                    src={contact.profilePicUrl}
                    alt="Foto de Perfil"
                    className="w-24 h-24 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              {!contact.isSaved && (
                <Badge 
                  variant="outline" 
                  className="absolute -top-2 -right-2 text-xs px-2 py-1 border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
                >
                  Não Salvo
                </Badge>
              )}
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome
            </Label>
            {isEditing ? (
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Digite o nome do contato"
                  className="flex-1"
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={contact.isSaved ? handleSave : handleSaveNewContact}
                  disabled={loading || !editedName.trim()}
                  className="px-3"
                  type="button"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-3"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">{contact.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  type="button"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Número do Telefone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>Número do Telefone</span>
            </Label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="font-mono text-sm">{contact.phoneNumber}</span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex space-x-2">
              <Badge 
                variant={contact.isSaved ? "default" : "outline"}
                className={cn(
                  contact.isSaved 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
                )}
              >
                {contact.isSaved ? "Salvo" : "Não Salvo"}
              </Badge>
            </div>
          </div>

          {/* Data de Criação (se disponível) */}
          {contact.createdAt && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Data de Criação</span>
              </Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {new Date(contact.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
              type="button"
            >
              Fechar
            </Button>
            {!contact.isSaved && !isEditing && (
              <Button
                onClick={handleStartEdit}
                disabled={loading}
                className="flex-1"
                type="button"
              >
                Salvar Contato
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
