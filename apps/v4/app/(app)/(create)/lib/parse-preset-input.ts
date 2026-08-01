import { isPresetCode } from "shadcn/preset"

import { parseExternalThemeUrl } from "@/app/(app)/(create)/lib/external-theme"

const PRESET_FLAG_PATTERN = /^--preset\b\s+(.+)$/i
const QUOTED_PATTERN = /^(["'])(.*)\1$/

export type ParsedPresetInput = {
  preset?: string
  themeUrl?: string
}

// Accepts everywhere a preset code is accepted, mirroring the CLI:
// - a preset code ("b0"), with or without a leading `--preset `
// - a registry item URL, applied as an external theme
// - a /create or /init URL, unpacked into its preset code and theme URL
export function parsePresetInput(value: string): ParsedPresetInput | null {
  const input = value.trim()

  if (!input) {
    return null
  }

  let preset = input.match(PRESET_FLAG_PATTERN)?.[1]?.trim() ?? input
  preset = preset.match(QUOTED_PATTERN)?.[2] ?? preset

  if (isPresetCode(preset)) {
    return { preset }
  }

  const themeUrl = parseExternalThemeUrl(preset)

  if (!themeUrl) {
    return null
  }

  return unpackCreateUrl(themeUrl) ?? { themeUrl }
}

// Copy Preset emits `--preset "<origin>/init?preset=…&themeUrl=…"` and Share
// emits `/create?preset=…&themeUrl=…` — pasting either back restores both.
function unpackCreateUrl(value: string): ParsedPresetInput | null {
  const url = new URL(value)

  if (url.pathname !== "/init" && url.pathname !== "/create") {
    return null
  }

  const preset = url.searchParams.get("preset")
  const themeUrl = url.searchParams.get("themeUrl")
  const result: ParsedPresetInput = {}

  if (preset && isPresetCode(preset)) {
    result.preset = preset
  }

  if (themeUrl && parseExternalThemeUrl(themeUrl)) {
    result.themeUrl = themeUrl
  }

  return result.preset || result.themeUrl ? result : null
}
