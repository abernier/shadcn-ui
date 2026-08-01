import { registryItemSchema, type RegistryItem } from "shadcn/schema"

// External themes come from arbitrary registries and their cssVars end up in
// a <style> tag in the preview and in generated CSS. Keys and values are
// strictly validated: anything that could escape a declaration (`;`, `{`,
// `}`, quotes, backslashes) or trigger a network request (`url(`) is dropped.
// A dropped var is not fatal — the rest of the theme still applies.
const CSS_VAR_KEY_PATTERN = /^-{0,2}[a-zA-Z][a-zA-Z0-9-]*$/
const CSS_VAR_VALUE_PATTERN = /^[a-zA-Z0-9\s.,%#()/*+_-]*$/
const CSS_URL_FUNCTION_PATTERN = /url\s*\(/i
const MAX_CSS_VAR_KEY_LENGTH = 64
const MAX_CSS_VAR_VALUE_LENGTH = 256
const MAX_CSS_VARS_PER_BLOCK = 200
const MAX_RESPONSE_LENGTH = 512 * 1024
const FETCH_TIMEOUT_MS = 10_000

const CHART_VAR_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]

export type ExternalThemeCssVars = NonNullable<RegistryItem["cssVars"]>

export type ExternalTheme = {
  name: string
  title?: string
  type: RegistryItem["type"]
  cssVars: ExternalThemeCssVars
}

export type ExternalThemeOverrides = {
  theme: boolean
  baseColor: boolean
  chartColor: boolean
  radius: boolean
  menuAccent: boolean
  font: boolean
  fontHeading: boolean
}

export type FetchExternalThemeResult =
  | { success: true; theme: ExternalTheme }
  | { success: false; error: string; status: number }

// Accepts https URLs anywhere, plus http on loopback hosts for local
// registries during development. Returns the normalized URL or null.
export function parseExternalThemeUrl(value: string) {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  if (url.protocol === "https:") {
    return url.toString()
  }

  if (url.protocol === "http:" && isLoopbackHostname(url.hostname)) {
    return url.toString()
  }

  return null
}

function isLoopbackHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  )
}

// Basic SSRF hygiene for the server-side fetch: no loopback in production,
// no IP literals, no obviously internal hostnames.
function isBlockedHostname(hostname: string) {
  if (isLoopbackHostname(hostname)) {
    return process.env.NODE_ENV === "production"
  }

  return (
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
    hostname.startsWith("[") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  )
}

function sanitizeCssVarBlock(
  block: Record<string, string> | undefined,
  keyStyle: "plain" | "prefixed"
) {
  if (!block) {
    return undefined
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(block).slice(
    0,
    MAX_CSS_VARS_PER_BLOCK
  )) {
    if (
      typeof value !== "string" ||
      key.length > MAX_CSS_VAR_KEY_LENGTH ||
      !CSS_VAR_KEY_PATTERN.test(key) ||
      value.length > MAX_CSS_VAR_VALUE_LENGTH ||
      !CSS_VAR_VALUE_PATTERN.test(value) ||
      CSS_URL_FUNCTION_PATTERN.test(value)
    ) {
      continue
    }
    // Normalize keys to the convention of their block: light/dark keys are
    // plain ("primary"), theme keys keep the -- prefix ("--font-heading").
    const normalizedKey =
      keyStyle === "prefixed"
        ? key.startsWith("--")
          ? key
          : `--${key}`
        : key.replace(/^--/, "")
    result[normalizedKey] = value
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export function sanitizeExternalCssVars(
  cssVars: RegistryItem["cssVars"]
): ExternalThemeCssVars | null {
  const theme = sanitizeCssVarBlock(cssVars?.theme, "prefixed")
  const light = sanitizeCssVarBlock(cssVars?.light, "plain")
  const dark = sanitizeCssVarBlock(cssVars?.dark, "plain")

  if (!theme && !light && !dark) {
    return null
  }

  return {
    ...(theme && { theme }),
    ...(light && { light }),
    ...(dark && { dark }),
  }
}

// Which customizer controls the external theme takes over, based on the
// variables it defines. Keys are matched across theme/light/dark blocks,
// with the `--` prefix normalized away.
export function getExternalOverrides(
  cssVars?: ExternalThemeCssVars | null
): ExternalThemeOverrides {
  const keys = new Set<string>()
  for (const block of [cssVars?.theme, cssVars?.light, cssVars?.dark]) {
    for (const key of Object.keys(block ?? {})) {
      keys.add(key.replace(/^--/, ""))
    }
  }

  return {
    theme: keys.has("primary"),
    baseColor: keys.has("background") && keys.has("foreground"),
    chartColor: CHART_VAR_KEYS.some((key) => keys.has(key)),
    radius: keys.has("radius"),
    menuAccent: keys.has("accent"),
    font: keys.has("font-sans"),
    fontHeading: keys.has("font-heading"),
  }
}

// Server-side: fetches a registry item URL, validates it against the
// registry item schema and returns only its sanitized theme surface.
export async function fetchExternalTheme(
  rawUrl: string
): Promise<FetchExternalThemeResult> {
  const themeUrl = parseExternalThemeUrl(rawUrl)

  if (!themeUrl) {
    return {
      success: false,
      error: "Invalid theme URL. Use an https registry item URL.",
      status: 400,
    }
  }

  if (isBlockedHostname(new URL(themeUrl).hostname)) {
    return {
      success: false,
      error: "This theme URL host is not allowed.",
      status: 400,
    }
  }

  let response: Response
  try {
    response = await fetch(themeUrl, {
      headers: {
        Accept: "application/vnd.shadcn.v1+json, application/json;q=0.9",
        "User-Agent": "shadcn",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    })
  } catch {
    return {
      success: false,
      error: "Could not reach the theme URL.",
      status: 502,
    }
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to fetch theme (HTTP ${response.status}).`,
      status: 502,
    }
  }

  const text = await response.text()
  if (text.length > MAX_RESPONSE_LENGTH) {
    return { success: false, error: "Theme file is too large.", status: 502 }
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return {
      success: false,
      error: "Theme URL did not return valid JSON.",
      status: 502,
    }
  }

  const parsed = registryItemSchema.safeParse(json)
  if (!parsed.success) {
    return {
      success: false,
      error: "Theme URL did not return a valid registry item.",
      status: 422,
    }
  }

  const cssVars = sanitizeExternalCssVars(parsed.data.cssVars)
  if (!cssVars) {
    return {
      success: false,
      error: "This registry item has no usable theme variables.",
      status: 422,
    }
  }

  return {
    success: true,
    theme: {
      name: parsed.data.name,
      title: parsed.data.title,
      type: parsed.data.type,
      cssVars,
    },
  }
}

// Shared by the init routes: resolves ?themeUrl= into sanitized cssVars.
export async function resolveExternalThemeCssVars(
  searchParams: URLSearchParams
): Promise<
  | { success: true; cssVars?: ExternalThemeCssVars }
  | { success: false; error: string; status: number }
> {
  const themeUrl = searchParams.get("themeUrl")

  if (!themeUrl) {
    return { success: true }
  }

  const result = await fetchExternalTheme(themeUrl)

  if (!result.success) {
    return result
  }

  return { success: true, cssVars: result.theme.cssVars }
}
