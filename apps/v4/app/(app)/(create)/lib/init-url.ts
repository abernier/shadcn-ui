import { type DesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"

// Builds the /init URL that fully describes the current configuration,
// external theme included. The CLI accepts a URL wherever it accepts a
// preset code and installs the merged registry:base item this URL returns.
export function getInitUrl(
  params: DesignSystemSearchParams,
  presetCode: string
) {
  const searchParams = new URLSearchParams({ preset: presetCode })

  if (params.themeUrl) {
    searchParams.set("themeUrl", params.themeUrl)
  }

  searchParams.set("base", params.base)

  if (params.template && params.template !== "next") {
    searchParams.set("template", params.template)
  }

  if (params.rtl) {
    searchParams.set("rtl", "true")
  }

  if (params.pointer) {
    searchParams.set("pointer", "true")
  }

  return `${ORIGIN}/init?${searchParams.toString()}`
}
