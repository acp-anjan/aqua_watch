import { cn } from '@/lib/utils'

interface PlaceholderCardProps {
  phase:       number
  name:        string
  description: string
  className?:  string
}

export function PlaceholderCard({ phase, name, description, className }: PlaceholderCardProps) {
  const emoji: Record<number, string> = {
    2: '📊', 3: '🔍', 4: '🗺️', 5: '📄', 6: '👥', 7: '✨',
  }

  return (
    <div className={cn(
      'rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center',
      className
    )}>
      <div className="inline-flex h-14 w-14 rounded-full bg-gray-50 items-center justify-center mb-4">
        <span className="text-2xl">{emoji[phase] ?? '🚧'}</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">{name}</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
        🚧 Phase {phase} — Planned
      </div>
    </div>
  )
}
