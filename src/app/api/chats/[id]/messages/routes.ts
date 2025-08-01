import { type NextRequest, NextResponse } from "next/server"

// Mock messages data
const mockMessages: Record<string, any[]> = {
  "1": [
    {
      id: "1",
      content: "Olá, gostaria de informações sobre os produtos",
      type: "text",
      sender: "customer",
      timestamp: "10:25",
    },
    {
      id: "2",
      content: "Olá! Claro, posso te ajudar. Que tipo de produto você está procurando?",
      type: "text",
      sender: "agent",
      timestamp: "10:26",
    },
    {
      id: "3",
      content: "Estou interessado em serviços de corte a laser",
      type: "text",
      sender: "customer",
      timestamp: "10:30",
    },
  ],
  "2": [
    {
      id: "4",
      content: "Obrigado pelo excelente atendimento!",
      type: "text",
      sender: "customer",
      timestamp: "09:10",
    },
    {
      id: "5",
      content: "Foi um prazer ajudar! Qualquer dúvida, estamos aqui.",
      type: "text",
      sender: "agent",
      timestamp: "09:15",
    },
  ],
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const chatId = params.id
    const messages = mockMessages[chatId] || []

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
  }
}
