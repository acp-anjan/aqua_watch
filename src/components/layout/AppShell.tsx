import { type ReactNode } from 'react'
import { Navbar }  from './Navbar'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      {/* Main content — offset for navbar (h-14) and sidebar (w-60) */}
      <main className="ml-60 pt-14 min-h-screen transition-all duration-200">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
