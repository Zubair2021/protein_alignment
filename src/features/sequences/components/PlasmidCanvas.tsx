import { useEffect, useMemo, useRef, useState } from 'react'
import { toColor } from '@/lib/utils'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import type { Feature } from '@/types'

interface PlasmidCanvasProps {
  sequenceId: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const PlasmidCanvas = ({ sequenceId }: PlasmidCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sequence = useSequenceStore((state) => state.sequences.find((item) => item.id === sequenceId))
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [hoverFeature, setHoverFeature] = useState<Feature | null>(null)
  const dragState = useRef<{ active: boolean; startAngle: number; initialRotation: number }>({
    active: false,
    startAngle: 0,
    initialRotation: 0,
  })

  const features = useMemo(() => sequence?.features ?? [], [sequence])

  useEffect(() => {
    if (!sequence) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2
    const baseRadius = Math.min(width, height) / 2 - 60
    const radius = baseRadius * scale

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rotation)

    ctx.strokeStyle = '#ffffff40'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()

    features.forEach((feature, index) => {
      const color = feature.color || toColor(index)
      const startAngle = (feature.start / sequence.length) * Math.PI * 2
      const endAngle = (feature.end / sequence.length) * Math.PI * 2
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 18
      ctx.lineCap = 'round'
      ctx.arc(0, 0, radius, startAngle, endAngle)
      ctx.stroke()

      const midAngle = (startAngle + endAngle) / 2
      const labelRadius = radius + 32
      ctx.save()
      ctx.rotate(midAngle)
      ctx.translate(labelRadius, 0)
      ctx.rotate(-midAngle)
      ctx.fillStyle = '#FFFFFFCC'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.textAlign = midAngle > Math.PI / 2 && midAngle < (Math.PI * 3) / 2 ? 'end' : 'start'
      ctx.fillText(feature.name ?? feature.type, 0, 0)
      ctx.restore()
    })

    ctx.restore()
  }, [features, rotation, scale, sequence])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sequence) return

    const getAngleFromEvent = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2
      return Math.atan2(y, x)
    }

    const handlePointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId)
      dragState.current = {
        active: true,
        startAngle: getAngleFromEvent(event),
        initialRotation: rotation,
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2
      const pointerRadius = Math.sqrt(x * x + y * y)
      const baseRadius = Math.min(rect.width, rect.height) / 2 - 60
      const radius = baseRadius * scale

      if (dragState.current.active) {
        const angle = getAngleFromEvent(event)
        const delta = angle - dragState.current.startAngle
        setRotation(dragState.current.initialRotation + delta)
      } else {
        const angle = (Math.atan2(y, x) - rotation + Math.PI * 2) % (Math.PI * 2)
        if (Math.abs(pointerRadius - radius) < 30) {
          const hit = features.find((feature) => {
            const start = (feature.start / sequence.length) * Math.PI * 2
            const end = (feature.end / sequence.length) * Math.PI * 2
            return angle >= start && angle <= end
          })
          setHoverFeature(hit ?? null)
        } else {
          setHoverFeature(null)
        }
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      dragState.current.active = false
      canvas.releasePointerCapture(event.pointerId)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const nextScale = clamp(scale + event.deltaY * -0.001, 0.6, 2.2)
      setScale(nextScale)
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [features, rotation, scale, sequence])

  if (!sequence) {
    return <p className='text-sm text-white/60'>No plasmid map available.</p>
  }

  return (
    <div className='relative flex flex-col items-center gap-3'>
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        className='cursor-grab rounded-2xl border border-white/10 bg-black/20 shadow-lg shadow-primary-500/10 active:cursor-grabbing'
      />
      {hoverFeature ? (
        <div className='absolute top-6 right-6 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs text-white/80 shadow-lg'>
          <p className='text-sm font-semibold text-white'>{hoverFeature.name}</p>
          <p>{hoverFeature.type}</p>
          <p>{hoverFeature.start + 1} – {hoverFeature.end}</p>
        </div>
      ) : null}
      <p className='text-xs text-white/60'>Scroll to zoom · click and drag to rotate · hover to inspect features.</p>
    </div>
  )
}
