import { NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

type RouterContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouterContext): Promise<NextResponse> {
  const params = await context.params
  const phoneNumber = params.id

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const caption = (formData.get("caption") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    let mediatype = "document"
    if (file.type.startsWith("image/")) mediatype = "image"
    else if (file.type.startsWith("audio/")) mediatype = "audio"
    else if (file.type.startsWith("video/")) mediatype = "video"

    const evolutionResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/message/sendMedia/${INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVOLUTION_API_KEY ? { apikey: EVOLUTION_API_KEY } : {}),
        },
        body: JSON.stringify({
          number: phoneNumber,
          mediatype,
          mimetype: file.type,
          caption,
          media: base64,
          fileName: file.name,
        }),
      }
    )

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error("Failed to send media via Evolution API:", errorText)
      throw new Error("Failed to send media via Evolution API")
    }

    const evolutionData = await evolutionResponse.json()
    return NextResponse.json({ success: true, data: evolutionData })
  } catch (error) {
    console.error("Failed to send media:", error)
    return NextResponse.json({ error: "Erro ao enviar mídia" }, { status: 500 })
  }
}
