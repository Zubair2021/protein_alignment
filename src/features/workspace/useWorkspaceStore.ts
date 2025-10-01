import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { type WorkspaceTab } from '@/types'

interface WorkspaceState {
  theme: 'light' | 'dark'
  activeTab: WorkspaceTab
  showInspector: boolean
  leftPanelSize: number
  rightPanelSize: number
  sequenceSearch: string
  workspaceName: string
  recentFiles: Array<{ name: string; importedAt: number }>
  setTheme: (theme: WorkspaceState['theme']) => void
  setActiveTab: (tab: WorkspaceTab) => void
  setShowInspector: (visible: boolean) => void
  setLeftPanelSize: (size: number) => void
  setRightPanelSize: (size: number) => void
  setSequenceSearch: (query: string) => void
  addRecentFile: (name: string) => void
  setWorkspaceName: (name: string) => void
}

const STORAGE_KEY = 'helixcanvas.workspace'

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'dark',
        activeTab: 'overview',
        showInspector: true,
        leftPanelSize: 280,
        rightPanelSize: 320,
        sequenceSearch: '',
        workspaceName: 'HelixCanvas Session',
        recentFiles: [],
        setTheme(theme) {
          set({ theme })
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'dark')
          }
        },
        setActiveTab(tab) {
          if (get().activeTab === tab) return
          set({ activeTab: tab })
        },
        setShowInspector(visible) {
          set({ showInspector: visible })
        },
        setLeftPanelSize(size) {
          set({ leftPanelSize: Math.max(200, Math.min(size, 480)) })
        },
        setRightPanelSize(size) {
          set({ rightPanelSize: Math.max(260, Math.min(size, 520)) })
        },
        setSequenceSearch(sequenceSearch) {
          set({ sequenceSearch })
        },
        addRecentFile(name) {
          const recent = get().recentFiles
          set({
            recentFiles: [{ name, importedAt: Date.now() }, ...recent.filter((item) => item.name !== name)].slice(0, 8),
          })
        },
        setWorkspaceName(workspaceName) {
          set({ workspaceName })
        },
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          theme: state.theme,
          activeTab: state.activeTab,
          leftPanelSize: state.leftPanelSize,
          rightPanelSize: state.rightPanelSize,
          workspaceName: state.workspaceName,
          recentFiles: state.recentFiles,
        }),
      },
    ),
  ),
)
