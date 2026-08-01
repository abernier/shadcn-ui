import { describe, expect, it } from "vitest"

import { parsePresetInput } from "./parse-preset-input"

describe("parsePresetInput", () => {
  it("accepts a raw preset code", () => {
    expect(parsePresetInput("b0")).toEqual({ preset: "b0" })
  })

  it("accepts a --preset flag", () => {
    expect(parsePresetInput(" --preset b0 ")).toEqual({ preset: "b0" })
  })

  it("rejects invalid preset input", () => {
    expect(parsePresetInput("open sesame")).toBeNull()
  })

  it("accepts a registry item URL as an external theme", () => {
    expect(parsePresetInput("https://registry.example.com/theme.json")).toEqual(
      { themeUrl: "https://registry.example.com/theme.json" }
    )
  })

  it("accepts a quoted --preset URL", () => {
    expect(
      parsePresetInput('--preset "https://registry.example.com/theme.json"')
    ).toEqual({ themeUrl: "https://registry.example.com/theme.json" })
  })

  it("rejects http URLs on non-loopback hosts", () => {
    expect(
      parsePresetInput("http://registry.example.com/theme.json")
    ).toBeNull()
  })

  it("unpacks an /init URL into preset and themeUrl", () => {
    expect(
      parsePresetInput(
        "https://ui.shadcn.com/init?preset=b0&themeUrl=https%3A%2F%2Fregistry.example.com%2Ftheme.json&base=base"
      )
    ).toEqual({
      preset: "b0",
      themeUrl: "https://registry.example.com/theme.json",
    })
  })

  it("unpacks a /create share URL", () => {
    expect(
      parsePresetInput(
        "https://ui.shadcn.com/create?preset=b2D&item=preview-02"
      )
    ).toEqual({ preset: "b2D" })
  })

  it("treats an /init URL without params as an external theme", () => {
    expect(parsePresetInput("https://ui.shadcn.com/init")).toEqual({
      themeUrl: "https://ui.shadcn.com/init",
    })
  })
})
