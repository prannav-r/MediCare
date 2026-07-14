import * as React from 'react'
import { cn } from '@/lib/utils'

// Skeleton is used for loading states — shows an animated placeholder
// where content will appear, preventing layout shift
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
