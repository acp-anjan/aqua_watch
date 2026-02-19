import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-blue-100 text-blue-800',
        secondary:   'bg-gray-100 text-gray-700',
        destructive: 'bg-red-100 text-red-800',
        warning:     'bg-orange-100 text-orange-800',
        success:     'bg-green-100 text-green-800',
        hot:         'bg-red-100 text-red-800',
        cold:        'bg-blue-100 text-blue-800',
        outline:     'border border-gray-300 text-gray-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
