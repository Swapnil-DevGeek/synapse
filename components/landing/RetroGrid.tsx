'use client'

import { cn } from '@/lib/utils'

interface RetroGridProps {
  className?: string
}

export function RetroGrid({ className }: RetroGridProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]',
        className
      )}
    >
      <div className="absolute inset-0 [transform:rotateX(35deg)]">
        <div
          className="animate-grid [background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1px,transparent_0)] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90%" />
    </div>
  )
} 