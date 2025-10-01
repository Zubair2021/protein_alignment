import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatBp = (value: number) => new Intl.NumberFormat('en-US').format(value)

export const downloadTextFile = (filename: string, data: string) => {
  const blob = new Blob([data], { type: 'text/plain;charset=utf-8' })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const toColor = (index: number) => {
  const palette = [
    '#6e40aa',
    '#b31f8b',
    '#e55c00',
    '#f2c94c',
    '#27ae60',
    '#2f80ed',
    '#4c1d95',
    '#f2994a',
  ]
  return palette[index % palette.length]
}

export const assertNever = (value: never): never => {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`)
}
