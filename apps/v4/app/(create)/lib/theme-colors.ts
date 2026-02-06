import { colors } from "@/registry/_legacy-colors"

/**
 * Get the hex color value for a theme name.
 * Uses the scale-500 color from the legacy colors registry.
 * Falls back to neutral-500 if the theme name is not found.
 */
export function getThemeHexColor(themeName: string): string {
  const colorPalette = colors[themeName as keyof typeof colors]

  // If the color palette exists and is an array, find the scale-500 color
  if (Array.isArray(colorPalette)) {
    const color500 = colorPalette.find((c) => c.scale === 500)
    if (color500?.hex) {
      return color500.hex
    }
  }

  // Fallback to neutral-500
  const neutralPalette = colors.neutral
  if (Array.isArray(neutralPalette)) {
    const neutral500 = neutralPalette.find((c) => c.scale === 500)
    if (neutral500?.hex) {
      return neutral500.hex
    }
  }

  // Ultimate fallback
  return "#737373"
}
