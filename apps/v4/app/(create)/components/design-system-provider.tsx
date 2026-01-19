"use client"

import * as React from "react"
import { Mcu } from "react-mcu"

import {
  buildRegistryTheme,
  DEFAULT_CONFIG,
  type DesignSystemConfig,
} from "@/registry/config"
import { useIframeMessageListener } from "@/app/(create)/hooks/use-iframe-sync"
import { FONTS } from "@/app/(create)/lib/fonts"
import { useDesignSystemSearchParams } from "@/app/(create)/lib/search-params"
import { getThemeHexColor } from "@/app/(create)/lib/theme-colors"

export function DesignSystemProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    { style, theme, font, baseColor, menuAccent, menuColor, radius, useMcu },
    setSearchParams,
  ] = useDesignSystemSearchParams({
    shallow: true, // No need to go through the server…
    history: "replace", // …or push updates into the iframe history.
  })
  useIframeMessageListener("design-system-params", setSearchParams)
  const [isReady, setIsReady] = React.useState(false)

  // Use useLayoutEffect for synchronous style updates to prevent flash.
  React.useLayoutEffect(() => {
    if (!style || !theme || !font || !baseColor) {
      return
    }

    const body = document.body

    // Update style class in place (remove old, add new).
    body.classList.forEach((className) => {
      if (className.startsWith("style-")) {
        body.classList.remove(className)
      }
    })
    body.classList.add(`style-${style}`)

    // Update base color class in place.
    body.classList.forEach((className) => {
      if (className.startsWith("base-color-")) {
        body.classList.remove(className)
      }
    })
    body.classList.add(`base-color-${baseColor}`)

    // Update font.
    const selectedFont = FONTS.find((f) => f.value === font)
    if (selectedFont) {
      const fontFamily = selectedFont.font.style.fontFamily
      document.documentElement.style.setProperty("--font-sans", fontFamily)
    }

    setIsReady(true)
  }, [style, theme, font, baseColor])

  const registryTheme = React.useMemo(() => {
    if (!baseColor || !theme || !menuAccent || !radius) {
      return null
    }

    const config: DesignSystemConfig = {
      ...DEFAULT_CONFIG,
      baseColor,
      theme,
      menuAccent,
      radius,
    }

    return buildRegistryTheme(config)
  }, [baseColor, theme, menuAccent, radius])

  // Use useLayoutEffect for synchronous CSS var updates.
  React.useLayoutEffect(() => {
    if (!registryTheme || !registryTheme.cssVars) {
      return
    }

    const styleId = "design-system-theme-vars"
    let styleElement = document.getElementById(
      styleId
    ) as HTMLStyleElement | null

    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    const {
      light: lightVars,
      dark: darkVars,
      theme: themeVars,
    } = registryTheme.cssVars

    let cssText = ":root {\n"
    // Add theme vars (shared across light/dark).
    if (themeVars) {
      Object.entries(themeVars).forEach(([key, value]) => {
        if (value) {
          cssText += `  --${key}: ${value};\n`
        }
      })
    }
    // Add light mode vars.
    if (lightVars) {
      Object.entries(lightVars).forEach(([key, value]) => {
        if (value) {
          cssText += `  --${key}: ${value};\n`
        }
      })
    }
    cssText += "}\n\n"

    cssText += ".dark {\n"
    if (darkVars) {
      Object.entries(darkVars).forEach(([key, value]) => {
        if (value) {
          cssText += `  --${key}: ${value};\n`
        }
      })
    }
    cssText += "}\n"

    // Add MCU color mapping if useMcu is enabled
    if (useMcu) {
      cssText += `
:root, .dark {
  --background: var(--mcu-surface);
  --foreground: var(--mcu-on-surface);
  --card: var(--mcu-surface-container-low);
  --card-foreground: var(--mcu-on-surface);
  --popover: var(--mcu-surface-container-high);
  --popover-foreground: var(--mcu-on-surface);
  --primary: var(--mcu-primary);
  --primary-foreground: var(--mcu-on-primary);
  --secondary: var(--mcu-secondary-container);
  --secondary-foreground: var(--mcu-on-secondary-container);
  --muted: var(--mcu-surface-container-highest);
  --muted-foreground: var(--mcu-on-surface-variant);
  --accent: var(--mcu-secondary-container);
  --accent-foreground: var(--mcu-on-secondary-container);
  --destructive: var(--mcu-error);
  --destructive-foreground: var(--mcu-on-error);
  --border: var(--mcu-outline-variant);
  --input: var(--mcu-outline);
  --ring: var(--mcu-primary);
  --chart-1: var(--mcu-primary-fixed);
  --chart-2: var(--mcu-secondary-fixed);
  --chart-3: var(--mcu-tertiary-fixed);
  --chart-4: var(--mcu-primary-fixed-dim);
  --chart-5: var(--mcu-secondary-fixed-dim);
  --sidebar: var(--mcu-surface-container-low);
  --sidebar-foreground: var(--mcu-on-surface);
  --sidebar-primary: var(--mcu-primary);
  --sidebar-primary-foreground: var(--mcu-on-primary);
  --sidebar-accent: var(--mcu-secondary-container);
  --sidebar-accent-foreground: var(--mcu-on-secondary-container);
  --sidebar-border: var(--mcu-outline-variant);
  --sidebar-ring: var(--mcu-primary);
}
`
    }

    styleElement.textContent = cssText
  }, [registryTheme, useMcu])

  // Handle menu color inversion by adding/removing dark class to elements with cn-menu-target.
  React.useEffect(() => {
    if (!menuColor) {
      return
    }

    const updateMenuElements = () => {
      const menuElements = document.querySelectorAll(".cn-menu-target")
      menuElements.forEach((element) => {
        if (menuColor === "inverted") {
          element.classList.add("dark")
        } else {
          element.classList.remove("dark")
        }
      })
    }

    // Update existing menu elements.
    updateMenuElements()

    // Watch for new menu elements being added to the DOM.
    const observer = new MutationObserver(() => {
      updateMenuElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [menuColor])

  if (!isReady) {
    return null
  }

  const content = <>{children}</>

  // Wrap with MCU provider if enabled
  if (useMcu && theme) {
    const sourceColor = getThemeHexColor(theme)
    return (
      <Mcu source={sourceColor} scheme="vibrant" contrast={0}>
        {content}
      </Mcu>
    )
  }

  return content
}
