import { afterEach, describe, expect, it, vi } from "vitest"

import { buildRegistryTheme, DEFAULT_CONFIG } from "@/registry/config"

import {
  fetchExternalTheme,
  getExternalOverrides,
  parseExternalThemeUrl,
  sanitizeExternalCssVars,
} from "./external-theme"

describe("parseExternalThemeUrl", () => {
  it("accepts https URLs", () => {
    expect(
      parseExternalThemeUrl("https://registry.example.com/theme.json")
    ).toBe("https://registry.example.com/theme.json")
  })

  it("accepts http on localhost", () => {
    expect(parseExternalThemeUrl("http://localhost:4000/r/theme.json")).toBe(
      "http://localhost:4000/r/theme.json"
    )
  })

  it("rejects http on other hosts", () => {
    expect(parseExternalThemeUrl("http://example.com/theme.json")).toBeNull()
  })

  it("rejects non-URLs", () => {
    expect(parseExternalThemeUrl("b0")).toBeNull()
    expect(parseExternalThemeUrl("file:///etc/passwd")).toBeNull()
  })
})

describe("sanitizeExternalCssVars", () => {
  it("keeps valid variables", () => {
    expect(
      sanitizeExternalCssVars({
        light: { primary: "oklch(0.6 0.1 200)", radius: "0.5rem" },
        dark: { primary: "oklch(0.7 0.1 200 / 50%)" },
      })
    ).toEqual({
      light: { primary: "oklch(0.6 0.1 200)", radius: "0.5rem" },
      dark: { primary: "oklch(0.7 0.1 200 / 50%)" },
    })
  })

  it("drops values that could escape the declaration", () => {
    expect(
      sanitizeExternalCssVars({
        light: {
          primary: "red;} body{display:none}",
          background: 'white"; @import "evil"',
          foreground: "black\\65 scape",
          accent: "blue",
        },
      })
    ).toEqual({ light: { accent: "blue" } })
  })

  it("drops url() values", () => {
    expect(
      sanitizeExternalCssVars({
        light: { primary: "url(https-evil)", accent: "URL (x)", ring: "blue" },
      })
    ).toEqual({ light: { ring: "blue" } })
  })

  it("drops invalid keys and oversized values", () => {
    expect(
      sanitizeExternalCssVars({
        light: {
          "bad key": "red",
          "also{bad}": "red",
          ok: "a".repeat(300),
          fine: "red",
        },
      })
    ).toEqual({ light: { fine: "red" } })
  })

  it("normalizes key prefixes per block", () => {
    expect(
      sanitizeExternalCssVars({
        theme: { "font-heading": "serif" },
        light: { "--primary": "red" },
      })
    ).toEqual({
      theme: { "--font-heading": "serif" },
      light: { primary: "red" },
    })
  })

  it("returns null when nothing survives", () => {
    expect(sanitizeExternalCssVars({ light: { primary: "red;}" } })).toBeNull()
    expect(sanitizeExternalCssVars(undefined)).toBeNull()
  })
})

describe("getExternalOverrides", () => {
  it("maps defined variables to overridden controls", () => {
    expect(
      getExternalOverrides({
        light: {
          primary: "red",
          background: "white",
          foreground: "black",
          "chart-1": "blue",
          radius: "0.5rem",
          accent: "green",
          "font-sans": "Inter, sans-serif",
        },
        theme: { "--font-heading": "serif" },
      })
    ).toEqual({
      theme: true,
      baseColor: true,
      chartColor: true,
      radius: true,
      menuAccent: true,
      font: true,
      fontHeading: true,
    })
  })

  it("reports nothing overridden without a theme", () => {
    expect(getExternalOverrides(undefined)).toEqual({
      theme: false,
      baseColor: false,
      chartColor: false,
      radius: false,
      menuAccent: false,
      font: false,
      fontHeading: false,
    })
  })

  it("requires both background and foreground for baseColor", () => {
    expect(
      getExternalOverrides({ light: { background: "white" } }).baseColor
    ).toBe(false)
  })
})

describe("buildRegistryTheme with external cssVars", () => {
  it("overlays external variables over the built-in theme", () => {
    const theme = buildRegistryTheme(DEFAULT_CONFIG, {
      light: { primary: "oklch(0.5 0.2 30)" },
      dark: { primary: "oklch(0.7 0.2 30)" },
    })

    expect(theme.cssVars.light.primary).toBe("oklch(0.5 0.2 30)")
    expect(theme.cssVars.dark.primary).toBe("oklch(0.7 0.2 30)")
    // Untouched variables still come from the built-in theme.
    expect(theme.cssVars.light.background).toBe(
      buildRegistryTheme(DEFAULT_CONFIG).cssVars.light.background
    )
  })

  it("lets external chart variables win over the chart color override", () => {
    const theme = buildRegistryTheme(
      { ...DEFAULT_CONFIG, chartColor: "blue" },
      { light: { "chart-1": "red" } }
    )

    expect(theme.cssVars.light["chart-1"]).toBe("red")
    // Charts the theme does not define still follow the chart color picker.
    expect(theme.cssVars.light["chart-2"]).toBe(
      buildRegistryTheme({ ...DEFAULT_CONFIG, chartColor: "blue" }).cssVars
        .light["chart-2"]
    )
  })

  it("skips the bold menu accent transform when the theme defines accent", () => {
    const theme = buildRegistryTheme(
      { ...DEFAULT_CONFIG, menuAccent: "bold" },
      { light: { accent: "purple", primary: "red" } }
    )

    expect(theme.cssVars.light.accent).toBe("purple")
  })

  it("derives the bold accent from the external primary", () => {
    const theme = buildRegistryTheme(
      { ...DEFAULT_CONFIG, menuAccent: "bold" },
      { light: { primary: "red" }, dark: { primary: "red" } }
    )

    expect(theme.cssVars.light.accent).toBe("red")
  })

  it("lets the external radius win over the radius picker", () => {
    const theme = buildRegistryTheme(
      { ...DEFAULT_CONFIG, radius: "large" },
      { light: { radius: "2rem" } }
    )

    expect(theme.cssVars.light.radius).toBe("2rem")
  })

  it("is unchanged without external cssVars", () => {
    expect(buildRegistryTheme(DEFAULT_CONFIG)).toEqual(
      buildRegistryTheme(DEFAULT_CONFIG, undefined)
    )
  })
})

describe("fetchExternalTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(response: Response) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response))
  }

  it("returns the sanitized theme surface of a valid registry item", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          name: "midnight",
          title: "Midnight",
          type: "registry:theme",
          files: [{ path: "evil.ts", type: "registry:lib" }],
          cssVars: {
            light: { primary: "red", background: "url(evil)" },
            dark: { primary: "blue" },
          },
        }),
        { status: 200 }
      )
    )

    const result = await fetchExternalTheme(
      "https://registry.example.com/theme.json"
    )

    expect(result).toEqual({
      success: true,
      theme: {
        name: "midnight",
        title: "Midnight",
        type: "registry:theme",
        cssVars: {
          light: { primary: "red" },
          dark: { primary: "blue" },
        },
      },
    })
  })

  it("rejects invalid URLs without fetching", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    const result = await fetchExternalTheme("http://example.com/theme.json")

    expect(result.success).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("reports http errors", async () => {
    stubFetch(new Response("not found", { status: 404 }))

    const result = await fetchExternalTheme(
      "https://registry.example.com/missing.json"
    )

    expect(result).toEqual({
      success: false,
      error: "Failed to fetch theme (HTTP 404).",
      status: 502,
    })
  })

  it("reports non-JSON responses", async () => {
    stubFetch(new Response("<html></html>", { status: 200 }))

    const result = await fetchExternalTheme(
      "https://registry.example.com/theme.json"
    )

    expect(result.success).toBe(false)
  })

  it("reports items that fail the registry item schema", async () => {
    stubFetch(
      new Response(JSON.stringify({ name: "legacy", cssVars: {} }), {
        status: 200,
      })
    )

    const result = await fetchExternalTheme(
      "https://registry.example.com/legacy.json"
    )

    expect(result).toEqual({
      success: false,
      error: "Theme URL did not return a valid registry item.",
      status: 422,
    })
  })

  it("reports items without usable theme variables", async () => {
    stubFetch(
      new Response(JSON.stringify({ name: "empty", type: "registry:theme" }), {
        status: 200,
      })
    )

    const result = await fetchExternalTheme(
      "https://registry.example.com/empty.json"
    )

    expect(result).toEqual({
      success: false,
      error: "This registry item has no usable theme variables.",
      status: 422,
    })
  })
})
