"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { generateRandomPreset, isPresetCode } from "shadcn/preset"

import { parseExternalThemeUrl } from "@/app/(app)/(create)/lib/external-theme"
import { getPresetCode } from "@/app/(app)/(create)/lib/preset-code"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

export function PresetHandler() {
  const router = useRouter()
  const [params, setParams] = useDesignSystemSearchParams()
  const hasConverted = React.useRef(false)

  React.useEffect(() => {
    if (params.preset === "random") {
      router.replace(`/create?preset=${generateRandomPreset()}`)
    }
  }, [params.preset, router])

  React.useEffect(() => {
    if (hasConverted.current) {
      return
    }
    hasConverted.current = true

    if (!params.preset || params.preset === "random") {
      return
    }

    if (isPresetCode(params.preset)) {
      return
    }

    // CLI parity: a registry item URL is accepted wherever a preset code is.
    // Use router.replace like the random branch — writing the default preset
    // code through setParams would drop it from the URL (clearOnDefault) and
    // re-trigger the initial preset sync, which would erase themeUrl.
    const themeUrl = parseExternalThemeUrl(params.preset)
    if (themeUrl) {
      const nextSearchParams = new URLSearchParams(window.location.search)
      nextSearchParams.set("preset", getPresetCode(params))
      nextSearchParams.set("themeUrl", themeUrl)
      router.replace(`/create?${nextSearchParams.toString()}`)
      return
    }

    setParams({ base: params.base })
  }, [params, router, setParams])

  return null
}
