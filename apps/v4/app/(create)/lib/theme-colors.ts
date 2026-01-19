// Mapping of theme names to their approximate hex colors
// These are derived from the primary colors in each theme
export const THEME_HEX_COLORS: Record<string, string> = {
  neutral: "#3a3a3a",
  stone: "#44403c",
  zinc: "#3f3f46",
  gray: "#374151",
  amber: "#d97706",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  emerald: "#10b981",
  fuchsia: "#d946ef",
  green: "#22c55e",
  indigo: "#6366f1",
  lime: "#84cc16",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
  red: "#ef4444",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  yellow: "#eab308",
}

export function getThemeHexColor(themeName: string): string {
  return THEME_HEX_COLORS[themeName] || THEME_HEX_COLORS.neutral
}
