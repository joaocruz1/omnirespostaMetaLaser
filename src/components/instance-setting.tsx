"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Settings, Smartphone, RefreshCw, Power, QrCode } from "lucide-react"

interface InstanceStatus {
  instanceName: string
  status: "connected" | "disconnected" | "connecting"
  qrCode?: string
}

export function InstanceSettings() {
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")

  useEffect(() => {
    loadInstanceStatus()
    loadWebhookSettings()
  }, [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default"
      case "connecting":
        return "secondary"
      case "disconnected":
        return "destructive"
      default:
        return "secondary"
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações da Instância</span>
          </CardTitle>
          <CardDescription>Gerencie a conexão com o WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Instância */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-medium">Status da Conexão</p>
                  <p className="text-sm text-muted-foreground">{instanceStatus?.instanceName || "joaoomni"}</p>
                </div>
              </div>
              <Badge variant={getStatusColor(instanceStatus?.status || "disconnected")}>
                {getStatusText(instanceStatus?.status || "disconnected")}
              </Badge>
            </div>

            <div className="flex space-x-2">
              <Button onClick={connectInstance} disabled={loading || instanceStatus?.status === "connected"}>
                <Power className="h-4 w-4 mr-2" />
                Conectar
              </Button>
              <Button
                variant="outline"
                onClick={disconnectInstance}
                disabled={loading || instanceStatus?.status === "disconnected"}
              >
                <Power className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
              <Button variant="outline" onClick={restartInstance} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {instanceStatus?.qrCode && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <p className="font-medium">QR Code para Conexão</p>
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={instanceStatus.qrCode || "/placeholder.svg"} alt="QR Code" className="max-w-xs" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Escaneie este QR Code com o WhatsApp para conectar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Webhook</CardTitle>
          <CardDescription>Configure a URL para receber mensagens em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://seu-dominio.com/api/webhook"
            />
          </div>
          <Button onClick={updateWebhook}>Atualizar Webhook</Button>
        </CardContent>
      </Card>
    </div>
  )
}