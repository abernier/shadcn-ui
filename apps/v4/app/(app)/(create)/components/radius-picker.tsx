"use client"

import * as React from "react"

import { RADII, type RadiusValue } from "@/registry/config"
import { LockButton } from "@/app/(app)/(create)/components/lock-button"
import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerRadioGroup,
  PickerRadioItem,
  PickerSeparator,
  PickerTrigger,
} from "@/app/(app)/(create)/components/picker"
import { usePreviewOverride } from "@/app/(app)/(create)/components/preview-override"
import { useExternalTheme } from "@/app/(app)/(create)/hooks/use-external-theme"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"

export function RadiusPicker({
  isMobile,
  anchorRef,
}: {
  isMobile: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  const [params, setParams] = useDesignSystemSearchParams()
  const { setOverride, clearOverride } = usePreviewOverride()
  const externalTheme = useExternalTheme()
  const isOverridden = externalTheme.overrides.radius
  const externalThemeName =
    externalTheme.theme?.title ?? externalTheme.theme?.name
  const isRadiusLocked =
    params.style === "lyra" || params.style === "sera" || isOverridden
  const selectedRadiusName =
    params.style === "lyra" || params.style === "sera" ? "none" : params.radius

  const currentRadius = RADII.find(
    (radius) => radius.name === selectedRadiusName
  )
  const defaultRadius = RADII.find((radius) => radius.name === "default")
  const otherRadii = RADII.filter((radius) => radius.name !== "default")

  return (
    <div className="group/picker relative">
      <Picker
        onOpenChange={(open) => {
          if (!open) {
            clearOverride()
          }
        }}
      >
        <PickerTrigger
          disabled={isRadiusLocked}
          title={isOverridden ? `Set by ${externalThemeName}` : undefined}
        >
          <div className="flex flex-col justify-start text-left">
            <div className="text-xs text-muted-foreground">Radius</div>
            <div className="truncate text-sm font-medium text-foreground">
              {isOverridden ? externalThemeName : currentRadius?.label}
            </div>
          </div>
          <div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 rotate-90 items-center justify-center text-base text-foreground select-none md:right-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="text-foreground"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 20v-5C4 8.925 8.925 4 15 4h5"
              />
            </svg>
          </div>
        </PickerTrigger>
        <PickerContent
          anchor={isMobile ? anchorRef : undefined}
          side={isMobile ? "top" : "right"}
          align={isMobile ? "center" : "start"}
          onMouseLeave={clearOverride}
        >
          <PickerRadioGroup
            value={currentRadius?.name}
            onValueChange={(value) => {
              if (isRadiusLocked) {
                return
              }
              setParams({ radius: value as RadiusValue })
            }}
            onItemPreview={
              isMobile || isRadiusLocked
                ? undefined
                : (value) => setOverride({ radius: value as RadiusValue })
            }
          >
            <PickerGroup>
              {defaultRadius && (
                <PickerRadioItem
                  key={defaultRadius.name}
                  value={defaultRadius.name}
                  closeOnClick={isMobile}
                >
                  {defaultRadius.label}
                </PickerRadioItem>
              )}
            </PickerGroup>
            <PickerSeparator />
            <PickerGroup>
              {otherRadii.map((radius) => (
                <PickerRadioItem
                  key={radius.name}
                  value={radius.name}
                  closeOnClick={isMobile}
                  disabled={params.style === "rhea" && radius.name === "large"}
                >
                  {radius.label}
                </PickerRadioItem>
              ))}
            </PickerGroup>
          </PickerRadioGroup>
        </PickerContent>
      </Picker>
      <LockButton
        param="radius"
        className="absolute top-1/2 right-8 -translate-y-1/2"
      />
    </div>
  )
}
