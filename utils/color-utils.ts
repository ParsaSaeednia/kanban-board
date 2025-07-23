// Utility function to determine if text should be light or dark based on background color
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace("#", "")

  // Convert to RGB
  const r = Number.parseInt(color.substr(0, 2), 16)
  const g = Number.parseInt(color.substr(2, 2), 16)
  const b = Number.parseInt(color.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? "#1f2937" : "#ffffff"
}

export const cardColors = [
  { name: "Default", value: "#ffffff", label: "White" },
  { name: "Blue", value: "#dbeafe", label: "Light Blue" },
  { name: "Green", value: "#dcfce7", label: "Light Green" },
  { name: "Yellow", value: "#fef3c7", label: "Light Yellow" },
  { name: "Purple", value: "#e9d5ff", label: "Light Purple" },
  { name: "Pink", value: "#fce7f3", label: "Light Pink" },
  { name: "Orange", value: "#fed7aa", label: "Light Orange" },
  { name: "Red", value: "#fecaca", label: "Light Red" },
  { name: "Indigo", value: "#c7d2fe", label: "Light Indigo" },
  { name: "Teal", value: "#ccfbf1", label: "Light Teal" },
  { name: "Dark Blue", value: "#1e40af", label: "Dark Blue" },
  { name: "Dark Green", value: "#166534", label: "Dark Green" },
  { name: "Dark Purple", value: "#7c3aed", label: "Dark Purple" },
  { name: "Dark Red", value: "#dc2626", label: "Dark Red" },
  { name: "Dark Gray", value: "#374151", label: "Dark Gray" },
]
