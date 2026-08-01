"use client"

import * as React from "react"
import useSWR from "swr"

import {
  getExternalOverrides,
  type ExternalTheme,
} from "@/app/(app)/(create)/lib/external-theme"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

async function fetchTheme(themeUrl: string): Promise<ExternalTheme> {
  const response = await fetch(
    `/api/registry-theme?url=${encodeURIComponent(themeUrl)}`
  )
  const json = await response.json().catch(() => null)

  if (!response.ok || !json?.theme) {
    throw new Error(json?.error ?? "Failed to load theme.")
  }

  return json.theme as ExternalTheme
}

// Loads the external theme referenced by ?themeUrl=, if any. Used by both
// the customizer (parent window) and the preview iframe — the fetch goes
// through the same-origin /api/registry-theme proxy in both cases.
export function useExternalTheme() {
  const [params] = useDesignSystemSearchParams()
  const themeUrl = params.themeUrl

  const { data, error, isLoading } = useSWR<ExternalTheme, Error>(
    themeUrl ? ["external-theme", themeUrl] : null,
    () => fetchTheme(themeUrl as string),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  )

  const theme = themeUrl ? (data ?? null) : null

  const overrides = React.useMemo(
    () => getExternalOverrides(theme?.cssVars),
    [theme]
  )

  return {
    themeUrl,
    theme,
    error: themeUrl ? error : undefined,
    isLoading: Boolean(themeUrl) && isLoading,
    overrides,
  }
}
