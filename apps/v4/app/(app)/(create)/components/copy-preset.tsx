"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { copyToClipboardWithMeta } from "@/components/copy-button"
import { Button } from "@/styles/base-nova/ui/button"
import { usePresetCode } from "@/app/(app)/(create)/hooks/use-design-system"
import { useExternalTheme } from "@/app/(app)/(create)/hooks/use-external-theme"
import { getInitUrl } from "@/app/(app)/(create)/lib/init-url"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

export function CopyPreset({ className }: React.ComponentProps<typeof Button>) {
  const [params] = useDesignSystemSearchParams()
  const presetCode = usePresetCode()
  const externalTheme = useExternalTheme()
  const [hasCopied, setHasCopied] = React.useState(false)
  // With an external theme applied, the preset code alone cannot reproduce
  // the screen — copy the /init URL that carries both instead.
  const presetArgument =
    params.themeUrl && !externalTheme.error
      ? `"${getInitUrl(params, presetCode)}"`
      : presetCode
  const label = hasCopied ? "Copied" : `--preset ${presetArgument}`

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const handleCopy = React.useCallback(() => {
    copyToClipboardWithMeta(`--preset ${presetArgument}`, {
      name: "copy_preset_command",
      properties: {
        preset: presetCode,
      },
    })
    setHasCopied(true)
  }, [presetArgument, presetCode])

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      title={label}
      className={cn(
        "touch-manipulation bg-transparent! px-2! py-0! text-sm! transition-none select-none hover:bg-muted! pointer-coarse:h-10!",
        className
      )}
    >
      <span className="block min-w-0 truncate">{label}</span>
    </Button>
  )
}
