import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/fetchInstances`, {
      headers: {
        apikey: EVOLUTION_API_KEY || "",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch instance status")
    }

    const data = await response.json()
    const instance = data.instances?.find((i: any) => i.instanceName === INSTANCE_NAME)

    return NextResponse.json({
      instanceName: INSTANCE_NAME,
      status: instance?.status || "disconnected",
    })
  } catch (error) {
    console.error("Failed to get instance status:", error)
    return NextResponse.json(
      {
        instanceName: INSTANCE_NAME,
        status: "disconnected",
      },
      { status: 200 },
    )
  }
}
