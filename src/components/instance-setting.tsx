"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Settings, Smartphone, RefreshCw, Power, QrCode, Webhook, Zap, Bot, ArrowRight, Wifi, WifiOff, Activity } from "lucide-react"

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
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-700 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400 border-0"
      case "connecting":
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-400 border-0"
      case "disconnected":
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400 border-0"
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-800 dark:to-gray-700 dark:text-gray-400 border-0"
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4" />
      case "connecting":
        return <Activity className="h-4 w-4 animate-pulse" />
      case "disconnected":
        return <WifiOff className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  useEffect(() => {
    connectInstance()
    loadWebhookSettings()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-xl theme-smooth">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Configurações da Instância
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                Gerencie a conexão com o WhatsApp
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Instância */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/30 dark:border-purple-800/30 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">Status da Conexão</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{instanceStatus?.instanceName || "joaoomni"}</p>
                </div>
              </div>
              <Badge className={`px-4 py-2 font-medium ${getStatusColor(instanceStatus?.status || "disconnected")}`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(instanceStatus?.status || "disconnected")}
                  <span>{getStatusText(instanceStatus?.status || "disconnected")}</span>
                </div>
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={connectInstance}
                disabled={loading || instanceStatus?.status === "connected"}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Power className="h-4 w-4 mr-2" />
                Conectar
              </Button>
              <Button
                variant="outline"
                onClick={disconnectInstance}
                disabled={loading || instanceStatus?.status === "disconnected"}
                className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50 bg-transparent font-medium"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
              <Button
                variant="outline"
                onClick={restartInstance}
                disabled={loading}
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent font-medium"
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
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">QR Code para Conexão</p>
              </div>
              <div className="flex justify-center p-8 bg-white dark:bg-gray-800 rounded-xl border border-purple-200/30 dark:border-purple-800/30 shadow-lg">
                <img
                  src={instanceStatus.qrCode || "/placeholder.svg"}
                  alt="QR Code"
                  className="max-w-xs rounded-lg shadow-md"
                />
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-xl border border-purple-200/30 dark:border-purple-800/30">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
                  📱 Escaneie este QR Code com o WhatsApp para conectar
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Webhook */}
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-xl theme-smooth">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Webhook className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                Configurações do Webhook
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                Configure a URL para receber mensagens em tempo real
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="webhook-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              URL do Webhook
            </Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://seu-dominio.com/api/webhook"
              className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
            />
          </div>
          <Button 
            onClick={updateWebhook} 
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Zap className="h-4 w-4 mr-2" />
            Atualizar Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Configurações do Agente IA */}
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-xl theme-smooth">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Gerenciamento do Agente IA
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                Gerencie a distribuição de conversas para o Agente IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-green-200/30 dark:border-green-800/30 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">Voltar Chamados para Agente IA</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transfere todas as conversas atuais que não estão com o Agente IA para ele
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg border border-green-200/30 dark:border-green-800/30">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">Esta ação irá:</p>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Identificar todos os chats que não estão atribuídos ao Agente IA</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Transferir automaticamente essas conversas para o Agente IA</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Manter as conversas já atribuídas ao Agente IA inalteradas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Atualizar a interface em tempo real</span>
                  </li>
                </ul>
              </div>
              <Button 
                onClick={transferAllChatsToAI}
                disabled={transferLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-12"
              >
                {transferLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Transferindo...
                  </>
                ) : (
                  <>
                    <Bot className="h-5 w-5 mr-2" />
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

