interface WorkspaceLayoutProps {
  header: React.ReactNode
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  children: React.ReactNode
}

export const WorkspaceLayout = ({ header, leftPanel, rightPanel, children }: WorkspaceLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-[#0b1230] to-[#050816] text-white">
    {header}
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden w-[280px] shrink-0 border-r border-white/5 bg-white/5/20 p-4 lg:block">
        {leftPanel}
      </aside>
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
      <aside className="hidden w-[320px] shrink-0 border-l border-white/5 bg-white/5/20 p-4 xl:block">
        {rightPanel}
      </aside>
    </div>
  </div>
)
