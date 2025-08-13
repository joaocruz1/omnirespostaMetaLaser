"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Users, UserPlus, Shield, User, MessageSquare, Mail, Calendar } from "lucide-react"
import { UserContactsModal } from "./user-contacts-modal"

interface UserManagementUser {
  id: string
  name: string
  email: string
  role: "admin" | "agent"
  status: "active" | "inactive"
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<UserManagementUser[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserManagementUser | null>(null)
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagementUser | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent" as "admin" | "agent",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingUser ? "Usuário atualizado com sucesso" : "Usuário criado com sucesso")
        setIsDialogOpen(false)
        setEditingUser(null)
        setFormData({ name: "", email: "", password: "", role: "agent" })
        loadUsers()
      } else {
        throw new Error("Failed to save user")
      }
    } catch (error) {
      console.error("Failed to save user:", error)
      toast.error("Não foi possível salvar o usuário")
    }
  }

  const handleEdit = (user: UserManagementUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        toast.success("Usuário excluído com sucesso")
        loadUsers()
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Não foi possível excluir o usuário")
    }
  }

  const handleViewContacts = (user: UserManagementUser) => {
    setSelectedUser(user)
    setContactsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-xl theme-smooth">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Gerenciamento de Usuários
                </CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Gerencie os usuários do sistema
                </CardDescription>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    setFormData({ name: "", email: "", password: "", role: "agent" })
                  }}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2 text-xl">
                    <UserPlus className="h-6 w-6 text-purple-600" />
                    <span>{editingUser ? "Editar Usuário" : "Novo Usuário"}</span>
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {editingUser ? "Edite as informações do usuário" : "Adicione um novo usuário ao sistema"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                      placeholder="usuario@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      className="h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">Função</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "admin" | "agent") => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6">
                      {editingUser ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-6 border border-gray-200/30 dark:border-gray-800/30 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                      user.role === "admin" 
                        ? "bg-gradient-to-br from-purple-600 to-purple-700" 
                        : "bg-gradient-to-br from-blue-500 to-blue-600"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="h-7 w-7 text-white" />
                    ) : (
                      <User className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{user.name}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className={
                          user.role === "admin"
                            ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-300 border-0 px-3 py-1 font-medium"
                            : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 border-0 px-3 py-1 font-medium"
                        }
                      >
                        {user.role === "admin" ? "Administrador" : "Agente"}
                      </Badge>
                      <Badge
                        variant={user.status === "active" ? "default" : "destructive"}
                        className={
                          user.status === "active"
                            ? "bg-gradient-to-r from-green-100 to-green-200 text-green-700 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400 border-0 px-3 py-1 font-medium"
                            : "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400 border-0 px-3 py-1 font-medium"
                        }
                      >
                        {user.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewContacts(user)}
                    className="h-10 px-3 border-blue-200 hover:bg-blue-50 text-blue-600 hover:text-blue-700 dark:border-blue-800 dark:hover:bg-blue-950/50 font-medium"
                    title="Ver contatos"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contatos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="h-10 px-3 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 font-medium"
                    title="Editar usuário"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    className="h-10 px-3 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50 font-medium"
                    title="Excluir usuário"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Contatos do Usuário */}
      {selectedUser && (
        <UserContactsModal
          isOpen={contactsModalOpen}
          onClose={() => {
            setContactsModalOpen(false)
            setSelectedUser(null)
          }}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </div>
  )
}
