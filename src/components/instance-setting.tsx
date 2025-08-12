"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Settings, Smartphone, RefreshCw, Power, QrCode, Webhook, Zap, Bot, ArrowRight } from "lucide-react"

interface InstanceStatus {
  instanceName: string
  status: "connected" | "disconnected" | "connecting"
  qrCode?: string
}

export function InstanceSettings() {
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)

  const loadInstanceStatus = async () => {
    try {
      const response = await fetch("/api/instance/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInstanceStatus(data)
      }
    } catch (error) {
      console.error("Failed to load instance status:", error)
    }
  }

  const loadWebhookSettings = async () => {
    try {
      const response = await fetch("/api/webhook/settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setWebhookUrl(data.url || "")
      }
    } catch (error) {
      console.error("Failed to load webhook settings:", error)
    }
  }

  const connectInstance = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/instance/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setInstanceStatus(data)
        toast.success("Conectando instância. Escaneie o QR Code para conectar")
      }
    } catch (error) {
      console.error("Failed to connect instance:", error)
      toast.error("Não foi possível conectar a instância")
    } finally {
      setLoading(false)
    }
  }

  const disconnectInstance = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/instance/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        loadInstanceStatus()
        toast.success("A instância foi desconectada com sucesso")
      }
    } catch (error) {
      console.error("Failed to disconnect instance:", error)
      toast.error("Não foi possível desconectar a instância")
    } finally {
      setLoading(false)
    }
  }

  const restartInstance = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/instance/restart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        loadInstanceStatus()
        toast.success("A instância foi reiniciada com sucesso")
      }
    } catch (error) {
      console.error("Failed to restart instance:", error)
      toast.error("Não foi possível reiniciar a instância")
    } finally {
      setLoading(false)
    }
  }

  const updateWebhook = async () => {
    try {
      const response = await fetch("/api/webhook/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ url: webhookUrl }),
      })

      if (response.ok) {
        toast.success("A URL do webhook foi atualizada com sucesso")
      }
    } catch (error) {
      console.error("Failed to update webhook:", error)
      toast.error("Não foi possível atualizar o webhook")
    }
  }

  const transferAllChatsToAI = async () => {
    setTransferLoading(true)
    try {
      const response = await fetch("/api/chats/transfer-all-to-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao transferir chats para Agente IA")
      }
    } catch (error) {
      console.error("Failed to transfer chats to AI:", error)
      toast.error("Erro ao transferir chats para Agente IA")
    } finally {
      setTransferLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "connecting":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "disconnected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado"
      case "connecting":
        return "Conectando"
      case "disconnected":
        return "Desconectado"
      default:
        return "Desconhecido"
    }
  }

  useEffect(() => {
    connectInstance()
    loadWebhookSettings()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 shadow-purple">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-purple">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Configurações da Instância</CardTitle>
              <CardDescription>Gerencie a conexão com o WhatsApp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Instância */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/30 dark:border-purple-800/30">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Status da Conexão</p>
                  <p className="text-sm text-muted-foreground">{instanceStatus?.instanceName || "joaoomni"}</p>
                </div>
              </div>
              <Badge className={getStatusColor(instanceStatus?.status || "disconnected")}>
                {getStatusText(instanceStatus?.status || "disconnected")}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={connectInstance}
                disabled={loading || instanceStatus?.status === "connected"}
                className="gradient-purple hover:opacity-90 shadow-purple"
              >
                <Power className="h-4 w-4 mr-2" />
                Conectar
              </Button>
              <Button
                variant="outline"
                onClick={disconnectInstance}
                disabled={loading || instanceStatus?.status === "disconnected"}
                className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50 bg-transparent"
              >
                <Power className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
              <Button
                variant="outline"
                onClick={restartInstance}
                disabled={loading}
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {instanceStatus?.qrCode && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-semibold text-foreground">QR Code para Conexão</p>
              </div>
              <div className="flex justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-purple-200/30 dark:border-purple-800/30 shadow-sm">
                <img
                  src={instanceStatus.qrCode || "/placeholder.svg"}
                  alt="QR Code"
                  className="max-w-xs rounded-lg shadow-sm"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-lg">
                Escaneie este QR Code com o WhatsApp para conectar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Webhook */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 shadow-purple">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Webhook className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Configurações do Webhook</CardTitle>
              <CardDescription>Configure a URL para receber mensagens em tempo real</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url" className="text-sm font-medium">
              URL do Webhook
            </Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://seu-dominio.com/api/webhook"
              className="border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
            />
          </div>
          <Button onClick={updateWebhook} className="gradient-purple hover:opacity-90 shadow-purple">
            <Zap className="h-4 w-4 mr-2" />
            Atualizar Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Configurações do Agente IA */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 shadow-purple">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Gerenciamento do Agente IA</CardTitle>
              <CardDescription>Gerencie a distribuição de conversas para o Agente IA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-green-200/30 dark:border-green-800/30">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Voltar Chamados para Agente IA</p>
                <p className="text-sm text-muted-foreground">
                  Transfere todas as conversas atuais que não estão com o Agente IA para ele
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Esta ação irá:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Identificar todos os chats que não estão atribuídos ao Agente IA</li>
                  <li>Transferir automaticamente essas conversas para o Agente IA</li>
                  <li>Manter as conversas já atribuídas ao Agente IA inalteradas</li>
                  <li>Atualizar a interface em tempo real</li>
                </ul>
              </div>
              <Button 
                onClick={transferAllChatsToAI}
                disabled={transferLoading}
                className="w-full gradient-green hover:opacity-90 shadow-green"
              >
                {transferLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Transferindo...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Transferir Todos os Chats para Agente IA
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
