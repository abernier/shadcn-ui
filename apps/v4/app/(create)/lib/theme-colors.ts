import { formatHex, oklch } from "culori"

import { getTheme } from "@/registry/config"

/**
 * Convert OKLch color string to hex.
 * 
 * OKLch format: "oklch(L C H)" where L is lightness (0-1), C is chroma, H is hue (0-360)
 */
function oklchToHex(oklchString: string): string | null {
  try {
    // Parse OKLch string: "oklch(0.648 0.2 131.684)"
    const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (!match) return null

    const [, l, c, h] = match.map(Number)
    
    // Convert using culori
    const color = oklch({ mode: "oklch", l, c, h })
    if (!color) return null
    
    return formatHex(color)
  } catch {
    return null
  }
}

/**
 * Get the hex color value for a theme.
 * Uses the primary color from the theme's cssVars (light mode).
 * Falls back to a default color if conversion fails.
 */
export function getThemeHexColor(themeName: string): string {
  const theme = getTheme(themeName)
  
  if (theme?.cssVars?.light?.primary) {
    // Convert OKLch to hex
    const hex = oklchToHex(theme.cssVars.light.primary)
    if (hex) return hex
  }

  // Default fallback
  return "#737373"
}
