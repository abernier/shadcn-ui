"use client"

import * as React from "react"

import { Checkbox } from "@/registry/new-york-v4/ui/checkbox"
import { Field, FieldLabel } from "@/registry/new-york-v4/ui/field"
import { LockButton } from "@/app/(create)/components/lock-button"
import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerItem,
  PickerTrigger,
} from "@/app/(create)/components/picker"
import { useDesignSystemSearchParams } from "@/app/(create)/lib/search-params"

export function McuPicker({
  isMobile,
  anchorRef,
}: {
  isMobile: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  const [params, setParams] = useDesignSystemSearchParams()

  return (
    <div className="group/picker relative">
      <Picker>
        <PickerTrigger>
          <div className="flex flex-col justify-start text-left">
            <div className="text-muted-foreground text-xs">MCU Palette</div>
            <div className="text-foreground text-sm font-medium">
              {params.useMcu ? "Enabled" : "Disabled"}
            </div>
          </div>
        </PickerTrigger>
        <PickerContent
          anchor={isMobile ? anchorRef : undefined}
          side={isMobile ? "top" : "right"}
          align={isMobile ? "center" : "start"}
        >
          <PickerGroup>
            <PickerItem
              onClick={() => {
                setParams({ useMcu: !params.useMcu })
              }}
            >
              <Field className="flex flex-row items-center gap-2">
                <Checkbox checked={params.useMcu} />
                <FieldLabel className="cursor-pointer">
                  Use MCU Palette
                </FieldLabel>
              </Field>
            </PickerItem>
            <PickerItem className="pointer-events-none opacity-60">
              <div className="flex flex-col justify-start text-xs pointer-coarse:text-sm">
                <div className="text-muted-foreground">
                  Generate Material Design 3 colors from the selected theme
                  color.
                </div>
              </div>
            </PickerItem>
          </PickerGroup>
        </PickerContent>
      </Picker>
      <LockButton
        param="useMcu"
        className="absolute top-1/2 right-4 -translate-y-1/2"
      />
    </div>
  )
}
