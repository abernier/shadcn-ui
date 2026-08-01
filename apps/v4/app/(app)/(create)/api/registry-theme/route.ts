import { NextResponse, type NextRequest } from "next/server"

import { fetchExternalTheme } from "@/app/(app)/(create)/lib/external-theme"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter." },
      { status: 400 }
    )
  }

  const result = await fetchExternalTheme(url)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(
    { theme: result.theme },
    { headers: { "Cache-Control": "public, max-age=300" } }
  )
}
