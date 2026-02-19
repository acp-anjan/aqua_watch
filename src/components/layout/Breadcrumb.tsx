import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  path?: string
}

interface BreadcrumbProps {
  items:     BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            {isLast || !item.path ? (
              <span className={cn(isLast ? 'text-gray-900 font-medium' : 'text-gray-500')}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
