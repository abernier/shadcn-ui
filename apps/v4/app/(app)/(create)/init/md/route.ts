import { type NextRequest } from "next/server"
import { track } from "@vercel/analytics/server"

import { buildInstructions } from "@/app/(app)/(create)/lib/build-instructions"
import { resolveExternalThemeCssVars } from "@/app/(app)/(create)/lib/external-theme"
import { parseDesignSystemConfig } from "@/app/(app)/(create)/lib/parse-config"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const result = parseDesignSystemConfig(searchParams)

    if (!result.success) {
      return new Response(result.error, { status: 400 })
    }

    const externalResult = await resolveExternalThemeCssVars(searchParams)
    if (!externalResult.success) {
      return new Response(externalResult.error, {
        status: externalResult.status,
      })
    }

    track("create_app_manual", result.data)

    const markdown = buildInstructions(result.data, externalResult.cssVars)

    return new Response(markdown, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "An unknown error occurred",
      { status: 500 }
    )
  }
}
