import { useEffect, useMemo, useState } from 'react'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { getAnalysisWorker } from '@/lib/workers'
import { formatBp } from '@/lib/utils'

interface GcPoint {
  position: number
  gcPercent: number
}

interface OrfSummary {
  frame: number
  start: number
  end: number
  length: number
  protein: string
}

const enzymes = [
  { name: 'EcoRI', sequence: 'GAATTC' },
  { name: 'BamHI', sequence: 'GGATCC' },
  { name: 'HindIII', sequence: 'AAGCTT' },
  { name: 'NotI', sequence: 'GCGGCCGC' },
  { name: 'XhoI', sequence: 'CTCGAG' },
]

export const AnalysisDashboard = () => {
  const sequences = useSequenceStore((state) => state.sequences)
  const activeSequenceId = useSequenceStore((state) => state.activeSequenceId)
  const activeSequence = useMemo(() => sequences.find((sequence) => sequence.id === activeSequenceId), [sequences, activeSequenceId])

  const [gcPoints, setGcPoints] = useState<GcPoint[]>([])
  const [orfs, setOrfs] = useState<OrfSummary[]>([])
  const [translation, setTranslation] = useState('')
  const [comparisonId, setComparisonId] = useState<string | undefined>(undefined)
  const [identityResult, setIdentityResult] = useState<{ matches: number; identity: number; length: number } | null>(null)
  const [dotPlot, setDotPlot] = useState<Array<{ x: number; y: number; score: number }>>([])
  const [windowSize, setWindowSize] = useState(200)
  const [restrictionSites, setRestrictionSites] = useState<Array<{ enzyme: string; position: number }>>([])

  useEffect(() => {
    if (!activeSequence) return
    let cancelled = false
    const runAnalysis = async () => {
      const worker = await getAnalysisWorker()
      const [gcResult, orfResult, translationResult] = await Promise.all([
        worker.gc(activeSequence.residues, windowSize),
        worker.orfs(activeSequence.residues, 90),
        worker.translate(activeSequence.residues, 0),
      ])
      const restrictionResult: Array<{ enzyme: string; position: number }> = []
      const upper = activeSequence.residues.toUpperCase()
      enzymes.forEach((enzyme) => {
        let index = upper.indexOf(enzyme.sequence)
        while (index !== -1) {
          restrictionResult.push({ enzyme: enzyme.name, position: index + 1 })
          index = upper.indexOf(enzyme.sequence, index + 1)
        }
      })
      setRestrictionSites(restrictionResult)
      if (cancelled) return
      setGcPoints(gcResult)
      setOrfs(orfResult)
      setTranslation(translationResult)
      if (comparisonId) {
        const other = sequences.find((sequence) => sequence.id === comparisonId)
        if (other) {
          const result = await worker.pairwiseIdentity(activeSequence.residues, other.residues)
          if (!cancelled) setIdentityResult(result)
          const dotPlotResult = await worker.dotPlot(activeSequence.residues, other.residues, 30)
          if (!cancelled) setDotPlot(dotPlotResult)
        }
      } else {
        setIdentityResult(null)
        setDotPlot([])
      }
    }
    runAnalysis()
    return () => {
      cancelled = true
    }
  }, [activeSequence, comparisonId, sequences, windowSize])

  if (!activeSequence) {
    return <p className="text-sm text-white/60">Load a sequence to unlock analysis tools.</p>
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">GC Content</h3>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Window</span>
            <Select value={String(windowSize)} onChange={(event) => setWindowSize(Number(event.target.value))} className="w-24">
              {[100, 200, 400, 800].map((size) => (
                <option key={size} value={size}>
                  {size} bp
                </option>
              ))}
            </Select>
          </div>
        </div>
        <GcChart points={gcPoints} length={activeSequence.length} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Open Reading Frames</h3>
            <Badge tone="info">Frame + strand</Badge>
          </div>
          <ScrollArea className="mt-3 max-h-64 space-y-2">
            {orfs.map((orf) => (
              <div key={`${orf.frame}-${orf.start}`} className="rounded-lg border border-white/5 bg-white/5 p-3 text-xs text-white/80">
                <div className="flex items-center justify-between text-sm text-white">
                  <span>Frame {orf.frame + 1}</span>
                  <span>{formatBp(orf.length)} bp</span>
                </div>
                <p className="text-white/60">{orf.start + 1} – {orf.end}</p>
                <p className="mt-2 font-mono text-white/70">{orf.protein.slice(0, 60)}{orf.protein.length > 60 ? '…' : ''}</p>
              </div>
            ))}
            {!orfs.length && <p className="text-xs text-white/60">No ORFs detected (min length 90bp).</p>}
          </ScrollArea>
        </section>
        <section className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-white">Translation Preview</h3>
          <ScrollArea className="mt-3 max-h-64 rounded-lg border border-white/5 bg-black/20 p-3 font-mono text-xs leading-relaxed text-primary-50">
            {translation || 'No translation available.'}
          </ScrollArea>
        </section>
      </div>

      <section className="rounded-2xl border border-white/5 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Pairwise Identity</h3>
            <p className="text-xs text-white/60">Compares the active sequence against another loaded sequence entirely in the browser.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Select
              value={comparisonId ?? ''}
              onChange={(event) => setComparisonId(event.target.value || undefined)}
              className="w-48"
            >
              <option value="">Select comparison</option>
              {sequences
                .filter((sequence) => sequence.id !== activeSequence.id)
                .map((sequence) => (
                  <option key={sequence.id} value={sequence.id}>
                    {sequence.name}
                  </option>
                ))}
            </Select>
            <Button
              variant="outline"
              onClick={() => setComparisonId(undefined)}
              disabled={!comparisonId}
            >
              Clear
            </Button>
          </div>
        </div>
        {identityResult ? (
          <div className="mt-4 grid gap-2 rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-white/80 md:grid-cols-3">
            <div>
              <p className="text-white/50">Matches</p>
              <p className="text-lg font-semibold text-white">{formatBp(identityResult.matches)}</p>
            </div>
            <div>
              <p className="text-white/50">Identity</p>
              <p className="text-lg font-semibold text-white">{identityResult.identity.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-white/50">Aligned length</p>
              <p className="text-lg font-semibold text-white">{formatBp(identityResult.length)} bp</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-white/60">Select another sequence to compute pairwise identity using WebAssembly scoring.</p>
        )}
        {dotPlot.length ? (
          <DotPlot points={dotPlot} referenceLength={activeSequence.length} queryLength={sequences.find((sequence) => sequence.id === comparisonId)?.length ?? 0} />
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/5 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white">Restriction Map</h3>
        <p className="text-xs text-white/60">Curated enzyme set rendered locally without design suggestions.</p>
        <div className="mt-3 grid gap-2 text-xs text-white/70 md:grid-cols-2">
          {restrictionSites.map((site) => (
            <div key={`${site.enzyme}-${site.position}`} className="rounded border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-sm font-semibold text-white">{site.enzyme}</p>
              <p>Cut: {site.position}</p>
            </div>
          ))}
          {!restrictionSites.length && <p className="text-xs text-white/60">No cut sites detected for the curated panel.</p>}
        </div>
      </section>
    </div>
  )
}


const GcChart = ({ points, length }: { points: GcPoint[]; length: number }) => {
  if (!points.length) {
    return <p className="mt-4 text-xs text-white/50">Not enough data to compute GC content.</p>
  }
  const maxGc = 100
  const width = 720
  const height = 220
  const path = points
    .map((point, index) => {
      const x = (point.position / length) * width
      const y = height - (point.gcPercent / maxGc) * height
      return `${index === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full rounded-lg border border-white/5 bg-black/20">
      <defs>
        <linearGradient id="gcGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2f80ed" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2f80ed" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill="url(#gcGradient)" opacity={0.4} />
      <path d={path} fill="none" stroke="#2f80ed" strokeWidth={2} />
      <g stroke="#ffffff10">
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line key={fraction} x1={0} x2={width} y1={height * fraction} y2={height * fraction} />
        ))}
      </g>
    </svg>
  )
}

const DotPlot = ({
  points,
  referenceLength,
  queryLength,
}: {
  points: Array<{ x: number; y: number; score: number }>
  referenceLength: number
  queryLength: number
}) => {
  const width = 300
  const height = 300
  const circles = points.map((point, index) => {
    const x = (point.x / referenceLength) * width
    const y = (point.y / queryLength) * height
    const opacity = Math.min(1, point.score)
    return <circle key={index} cx={x} cy={y} r={2} fill={`rgba(99, 102, 241, ${opacity})`} />
  })
  return (
    <div className="mt-4">
      <h4 className="text-xs uppercase tracking-[0.2em] text-white/50">Dot Plot</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30">
        {circles}
        <rect x={0} y={0} width={width} height={height} fill="none" stroke="#ffffff20" strokeWidth={1} />
      </svg>
    </div>
  )
}
