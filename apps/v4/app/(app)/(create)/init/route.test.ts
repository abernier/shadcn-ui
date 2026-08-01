import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildRegistryBase,
  DEFAULT_CONFIG,
  POINTER_CURSOR_SELECTOR,
} from "@/registry/config"

import { GET } from "./route"

function createRequest(search = "") {
  const searchParams = new URLSearchParams(
    Object.entries(DEFAULT_CONFIG).map(([key, value]) => [key, String(value)])
  )
  const url = new URL(`http://localhost:4000/init${search}`)

  for (const [key, value] of url.searchParams) {
    searchParams.set(key, value)
  }

  return {
    nextUrl: new URL(`http://localhost:4000/init?${searchParams}`),
  } as Parameters<typeof GET>[0]
}

describe("GET /init", () => {
  it("returns the full registry base when only is omitted", async () => {
    const response = await GET(createRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(buildRegistryBase(DEFAULT_CONFIG))
    expect(json.css["@layer base"][POINTER_CURSOR_SELECTOR]).toBeUndefined()
  })

  it("returns pointer cursor css when pointer is enabled", async () => {
    const response = await GET(createRequest("?pointer=true"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.css["@layer base"][POINTER_CURSOR_SELECTOR]).toEqual({
      cursor: "pointer",
    })
  })

  it("returns a sparse registry base when only is provided", async () => {
    const response = await GET(createRequest("?only=theme"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.type).toBe("registry:base")
    expect(json.config).toEqual({
      menuColor: "default",
      menuAccent: "subtle",
      tailwind: {
        baseColor: "neutral",
      },
    })
    expect(json.cssVars.light).toBeDefined()
    expect(json.cssVars.light.radius).toBe("0.625rem")
    expect(json.dependencies).toBeUndefined()
    expect(json.registryDependencies).toBeUndefined()
  })

  it("rejects unsupported only values", async () => {
    const response = await GET(createRequest("?only=icon"))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe(
      "Invalid only value. Use one or more of: theme, font"
    )
  })

  describe("with a themeUrl", () => {
    const THEME_URL = "https://registry.example.com/theme.json"

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it("merges the external theme into the registry base", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              name: "midnight",
              type: "registry:theme",
              cssVars: {
                light: { primary: "oklch(0.5 0.2 30)" },
                dark: { primary: "oklch(0.7 0.2 30)" },
              },
            }),
            { status: 200 }
          )
        )
      )

      const response = await GET(
        createRequest(`?themeUrl=${encodeURIComponent(THEME_URL)}`)
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.cssVars.light.primary).toBe("oklch(0.5 0.2 30)")
      expect(json.cssVars.dark.primary).toBe("oklch(0.7 0.2 30)")
      // Variables the theme does not define are unchanged.
      expect(json.cssVars.light.background).toBe(
        buildRegistryBase(DEFAULT_CONFIG).cssVars.light.background
      )
    })

    it("drops hostile variables from the external theme", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              name: "hostile",
              type: "registry:theme",
              cssVars: {
                light: {
                  primary: "red;} body{display:none}",
                  accent: "blue",
                },
              },
            }),
            { status: 200 }
          )
        )
      )

      const response = await GET(
        createRequest(`?themeUrl=${encodeURIComponent(THEME_URL)}`)
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.cssVars.light.accent).toBe("blue")
      expect(json.cssVars.light.primary).toBe(
        buildRegistryBase(DEFAULT_CONFIG).cssVars.light.primary
      )
    })

    it("propagates fetch failures with their message", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("gone", { status: 404 }))
      )

      const response = await GET(
        createRequest(`?themeUrl=${encodeURIComponent(THEME_URL)}`)
      )
      const json = await response.json()

      expect(response.status).toBe(502)
      expect(json.error).toBe("Failed to fetch theme (HTTP 404).")
    })
  })
})
