import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { AppHeader } from '@/components/navigation/AppHeader'
import { SequenceListPanel } from '@/features/sequences/components/SequenceListPanel'
import { AlignmentPanel } from '@/features/alignments/components/AlignmentPanel'
import { AnnotationInspector } from '@/features/annotations/components/AnnotationInspector'
import { SearchPanel } from '@/features/search/components/SearchPanel'
import { BookmarkPanel } from '@/features/sequences/components/BookmarkPanel'
import { LinearSequenceViewer } from '@/features/sequences/components/LinearSequenceViewer'
import { PlasmidCanvas } from '@/features/sequences/components/PlasmidCanvas'
import { AlignmentViewer } from '@/features/alignments/components/AlignmentViewer'
import { AnalysisDashboard } from '@/features/analysis/components/AnalysisDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { useWorkspaceStore } from '@/features/workspace/useWorkspaceStore'
import { type WorkspaceTab } from '@/types'
import { getParserWorker } from '@/lib/parser-client'
import { sanitizeFeatures } from '@/lib/sequence'
import { downloadTextFile } from '@/lib/utils'
import { exportAlignmentClustal, exportGenBank, exportMultiFasta } from '@/lib/parsers'
import { demoSequences, demoAlignment } from '@/data/sampleData'
import { Badge } from '@/components/ui/badge'
import JSZip from 'jszip'

export const WorkspacePage = () => {
  const [isDragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const hydrate = useSequenceStore((state) => state.hydrate)
  const initialized = useSequenceStore((state) => state.initialized)
  const sequences = useSequenceStore((state) => state.sequences)
  const addSequences = useSequenceStore((state) => state.addSequences)
  const updateSequence = useSequenceStore((state) => state.updateSequence)
  const addAlignment = useSequenceStore((state) => state.addAlignment)
  const activeSequenceId = useSequenceStore((state) => state.activeSequenceId)

  const activeTab = useWorkspaceStore((state) => state.activeTab)
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab)
  const addRecentFile = useWorkspaceStore((state) => state.addRecentFile)

  const activeSequence = useMemo(
    () => sequences.find((sequence) => sequence.id === activeSequenceId),
    [sequences, activeSequenceId],
  )

  useEffect(() => {
    if (!initialized) {
      void hydrate()
    }
  }, [hydrate, initialized])

  useEffect(() => {
    if (initialized && !sequences.length) {
      void addSequences(demoSequences)
      void addAlignment(demoAlignment)
    }
  }, [initialized, sequences.length, addSequences, addAlignment])


  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setActiveTab('analysis')
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '1') setActiveTab('overview')
      if ((event.ctrlKey || event.metaKey) && event.key === '2') setActiveTab('linear-viewer')
      if ((event.ctrlKey || event.metaKey) && event.key === '3') setActiveTab('plasmid')
      if ((event.ctrlKey || event.metaKey) && event.key === '4') setActiveTab('alignment')
      if ((event.ctrlKey || event.metaKey) && event.key === '5') setActiveTab('analysis')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setActiveTab])
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const worker = await getParserWorker()
      for (const file of Array.from(files)) {
        const text = await file.text()
        const name = file.name
        addRecentFile(name)
        if (/\.zip$/i.test(name)) {
          const zip = await JSZip.loadAsync(file)
          const sequencesEntry = zip.file('sequences.json')
          const alignmentsEntry = zip.file('alignments.json')
          if (sequencesEntry) {
            const json = JSON.parse(await sequencesEntry.async('string'))
            await addSequences(json)
          }
          if (alignmentsEntry) {
            const json = JSON.parse(await alignmentsEntry.async('string'))
            for (const alignment of json) {
              await addAlignment(alignment)
            }
          }
          continue
        }
        if (/\.(gff|gff3)$/i.test(name)) {
          const features = await worker.parseGff(text)
          if (activeSequence) {
            const sanitized = sanitizeFeatures(features, activeSequence.length)
            await updateSequence(activeSequence.id, {
              features: [...activeSequence.features, ...sanitized],
            })
          }
          continue
        }
        if (/\.csv$/i.test(name) && activeSequence) {
          const annotations = await worker.parseAnnotationsCsv(activeSequence.id, text)
          await useSequenceStore.getState().addAnnotations(activeSequence.id, annotations)
          continue
        }
        const result = await worker.parseFile(name, text)
        if (result.sequences.length) {
          await addSequences(result.sequences)
        }
        if (result.alignments.length) {
          for (const alignment of result.alignments) {
            await addAlignment(alignment)
          }
        }
      }
    },
    [addSequences, addAlignment, updateSequence, addRecentFile, activeSequence],
  )

  const handleExport = () => {
    if (!sequences.length) return
    const fasta = exportMultiFasta(sequences)
    downloadTextFile('helixcanvas_sequences.fasta', fasta)
  }

  const exportActiveGenBank = () => {
    if (!activeSequence) return
    downloadTextFile(`${activeSequence.name.replace(/\s+/g, '_')}.gb`, exportGenBank(activeSequence))
  }

  const handleAlignmentExport = () => {
    const alignment = useSequenceStore.getState().alignments[0]
    if (!alignment) return
    downloadTextFile('helixcanvas_alignment.clustal', exportAlignmentClustal(alignment))
  }

  const exportWorkspaceZip = async () => {
    const state = useSequenceStore.getState()
    const zip = new JSZip()
    zip.file('sequences.json', JSON.stringify(state.sequences, null, 2))
    zip.file('alignments.json', JSON.stringify(state.alignments, null, 2))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'helixcanvas_workspace.zip'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const leftPanel = (
    <div className='flex h-full flex-col gap-6'>
      <SequenceListPanel onImport={() => fileInputRef.current?.click()} />
      <div>
        <h3 className='text-xs uppercase tracking-[0.3em] text-white/50'>Alignments</h3>
        <AlignmentPanel />
      </div>
    </div>
  )

  const rightPanel = (
    <div className='flex h-full flex-col gap-6'>
      <AnnotationInspector />
      <SearchPanel />
      <BookmarkPanel />
    </div>
  )

  const mainContent = (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void handleFiles(event.dataTransfer.files)
      }}
      className={`rounded-3xl border border-white/5 bg-white/5 p-6 shadow-panel ${isDragging ? 'border-primary-400/70 bg-primary-500/10' : ''}`}
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)}>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='linear-viewer'>Linear Viewer</TabsTrigger>
          <TabsTrigger value='plasmid'>Plasmid</TabsTrigger>
          <TabsTrigger value='alignment'>Alignment</TabsTrigger>
          <TabsTrigger value='analysis'>Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value='overview'>
          <div className='grid gap-4 text-sm text-white/80 md:grid-cols-2'>
            <div className='rounded-2xl border border-white/5 bg-black/30 p-5'>
              <h3 className='text-lg font-semibold text-white'>Welcome to HelixCanvas</h3>
              <p className='mt-2 text-white/60'>Drag and drop sequence or alignment files to begin. All processing stays in your browser.</p>
              <div className='mt-4 flex flex-wrap gap-2'>
                <Button variant='outline' onClick={() => fileInputRef.current?.click()}>
                  Import Files
                </Button>
                <Button variant='ghost' onClick={() => void addSequences(demoSequences)}>
                  Load Demo Sequences
                </Button>
                <Button variant='ghost' onClick={() => void addAlignment(demoAlignment)}>
                  Load Demo Alignment
                </Button>
              </div>
              <div className='mt-4 space-y-2 text-xs text-white/60'>
                <p>Supported imports: FASTA, GenBank, EMBL, GFF3, CLUSTAL, MAF, Stockholm, CSV annotations.</p>
                <p>Exports avoid actionable lab instructions and focus on visualization-ready data.</p>
              </div>
            </div>
            <div className='rounded-2xl border border-white/5 bg-black/30 p-5'>
              <h3 className='text-lg font-semibold text-white'>Workspace Snapshot</h3>
              <ul className='mt-3 space-y-2 text-xs text-white/60'>
                <li><Badge tone='info'>{sequences.length}</Badge> sequences currently loaded.</li>
                <li>Active sequence: {activeSequence?.name ?? 'None selected'}.</li>
                <li>Annotation history persists locally via IndexedDB—no cloud storage needed.</li>
              </ul>
              <div className='mt-4 flex gap-2'>
                <Button variant='ghost' onClick={handleExport}>
                  Export FASTA
                </Button>
                <Button variant='ghost' onClick={handleAlignmentExport}>
                  Export Alignment
                </Button>
                <Button variant='ghost' onClick={exportActiveGenBank} disabled={!activeSequence}>
                  Export GenBank
                </Button>
                <Button variant='ghost' onClick={() => void exportWorkspaceZip()}>
                  Export Zip
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value='linear-viewer'>
          {activeSequence ? <LinearSequenceViewer sequenceId={activeSequence.id} /> : <p className='text-sm text-white/60'>Choose a sequence to render the linear viewer.</p>}
        </TabsContent>
        <TabsContent value='plasmid'>
          {activeSequence?.circular ? <PlasmidCanvas sequenceId={activeSequence.id} /> : <p className='text-sm text-white/60'>Select a circular sequence to view the plasmid map.</p>}
        </TabsContent>
        <TabsContent value='alignment'>
          <AlignmentViewer />
        </TabsContent>
        <TabsContent value='analysis'>
          <AnalysisDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        hidden
        multiple
        onChange={(event) => {
          const files = event.target.files
          if (files) void handleFiles(files)
        }}
      />
      <WorkspaceLayout
        header={<AppHeader onImportClick={() => fileInputRef.current?.click()} onExportClick={handleExport} />}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      >
        {mainContent}
      </WorkspaceLayout>
    </>
  )
}
