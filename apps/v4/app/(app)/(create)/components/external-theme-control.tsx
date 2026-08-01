"use client"

import * as React from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/styles/base-nova/ui/button"
import { useExternalTheme } from "@/app/(app)/(create)/hooks/use-external-theme"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

// Shown when an external theme URL is applied: the theme name and its host,
// or why it failed to load, plus a remove button. Removing it restores the
// underlying preset configuration untouched.
export function ExternalThemeControl() {
  const [, setParams] = useDesignSystemSearchParams()
  const { theme, error, isLoading, themeUrl } = useExternalTheme()

  if (!themeUrl) {
    return null
  }

  let hostname: string | null = null
  try {
    hostname = new URL(themeUrl).hostname
  } catch {}

  return (
    <div className="relative w-36 shrink-0 rounded-xl p-3 ring-1 ring-foreground/10 select-none md:w-full md:rounded-lg md:px-2.5 md:py-2">
      <div className="flex flex-col justify-start pr-6 text-left">
        <div className="text-xs text-muted-foreground">Theme URL</div>
        {error ? (
          <div
            className="truncate text-sm font-medium text-destructive"
            title={error.message}
          >
            {error.message}
          </div>
        ) : (
          <div
            className="truncate text-sm font-medium text-foreground"
            title={themeUrl}
          >
            {isLoading ? "Loading…" : (theme?.title ?? theme?.name)}
            {hostname && !isLoading ? (
              <span className="text-muted-foreground"> · {hostname}</span>
            ) : null}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Remove theme"
        title="Remove theme"
        className="absolute top-1/2 right-2 -translate-y-1/2"
        onClick={() => setParams({ themeUrl: null })}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </Button>
    </div>
  )
}
