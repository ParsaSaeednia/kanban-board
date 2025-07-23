"use client"

import { cardColors } from "../utils/color-utils"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Card Color</Label>
      <div className="grid grid-cols-5 gap-2">
        {cardColors.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onColorChange(color.value)}
            className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
              selectedColor === color.value
                ? "border-slate-900 ring-2 ring-slate-300"
                : "border-slate-200 hover:border-slate-400"
            }`}
            style={{ backgroundColor: color.value }}
            title={color.label}
          />
        ))}
      </div>
    </div>
  )
}
