import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funções utilitárias para notificações toast mais ricas
export const notify = {
  success: (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 4000,
      style: {
        background: 'hsl(142 76% 36%)',
        color: 'white',
        border: '1px solid hsl(142 76% 36%)',
      },
    })
  },

  error: (title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 5000,
      style: {
        background: 'hsl(0 84% 60%)',
        color: 'white',
        border: '1px solid hsl(0 84% 60%)',
      },
    })
  },

  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 4000,
      style: {
        background: 'hsl(38 92% 50%)',
        color: 'white',
        border: '1px solid hsl(38 92% 50%)',
      },
    })
  },

  info: (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 4000,
      style: {
        background: 'hsl(221 83% 53%)',
        color: 'white',
        border: '1px solid hsl(221 83% 53%)',
      },
    })
  },

  // Notificação personalizada para transferência de chat
  chatTransfer: (userName: string, action: 'transferido para' | 'assumido por') => {
    toast.success(`Conversa ${action} ${userName}`, {
      description: `A conversa foi ${action} ${userName} com sucesso.`,
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
      },
    })
  },

  // Notificação para status de mensagem
  messageStatus: (status: 'enviada' | 'entregue' | 'lida' | 'erro') => {
    const config = {
      enviada: { title: 'Mensagem enviada', color: 'hsl(221 83% 53%)' },
      entregue: { title: 'Mensagem entregue', color: 'hsl(38 92% 50%)' },
      lida: { title: 'Mensagem lida', color: 'hsl(142 76% 36%)' },
      erro: { title: 'Erro ao enviar', color: 'hsl(0 84% 60%)' },
    }

    const { title, color } = config[status]
    
    toast(title, {
      description: `Status: ${status}`,
      duration: 2000,
      style: {
        background: color,
        color: 'white',
        border: `1px solid ${color}`,
      },
    })
  },

  // Notificação para ações de IA
  aiAction: (action: 'ativada' | 'desativada' | 'assumindo') => {
    const config = {
      ativada: { title: 'IA Ativada', description: 'Agente IA está ativo e atendendo conversas.' },
      desativada: { title: 'IA Desativada', description: 'Você está assumindo o atendimento manual.' },
      assumindo: { title: 'Assumindo Conversa', description: 'Transferindo conversa para você...' },
    }

    const { title, description } = config[action]
    
    toast.success(title, {
      description,
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
      },
    })
  },

  // Notificação para upload de arquivos
  fileUpload: (fileName: string, status: 'sucesso' | 'erro') => {
    if (status === 'sucesso') {
      toast.success('Arquivo enviado', {
        description: `${fileName} foi enviado com sucesso.`,
        duration: 3000,
      })
    } else {
      toast.error('Erro no upload', {
        description: `Não foi possível enviar ${fileName}.`,
        duration: 4000,
      })
    }
  },

  // Notificação para conexão de instância
  instanceConnection: (status: 'conectando' | 'conectada' | 'desconectada' | 'erro') => {
    const config = {
      conectando: { title: 'Conectando...', description: 'Escaneie o QR Code para conectar', type: 'info' as const },
      conectada: { title: 'Conectado!', description: 'WhatsApp conectado com sucesso', type: 'success' as const },
      desconectada: { title: 'Desconectado', description: 'WhatsApp foi desconectado', type: 'warning' as const },
      erro: { title: 'Erro de Conexão', description: 'Não foi possível conectar o WhatsApp', type: 'error' as const },
    }

    const { title, description, type } = config[status]
    
    toast[type](title, {
      description,
      duration: 4000,
    })
  },
}
