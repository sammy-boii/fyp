'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useWalkthrough } from '@/lib/walkthrough'
import 'driver.js/dist/driver.css'
import '@/lib/walkthrough/walkthrough.css'

/**
 * Auto-starts the sidebar tour on first visit, and page-specific tours
 * when navigating to each page for the first time.
 * Mount this once inside the main layout (within SidebarProvider).
 */
export function WalkthroughProvider() {
  const pathname = usePathname()
  const { startFullTour, startPageTour, hasSeenTour } = useWalkthrough()
  const hasTriggeredSidebar = useRef(false)
  const lastPathname = useRef<string | null>(null)

  // On first mount, show full app tour (navigates across pages automatically)
  useEffect(() => {
    if (hasTriggeredSidebar.current) return
    hasTriggeredSidebar.current = true

    // Delay to ensure sidebar is rendered
    const timer = setTimeout(() => {
      if (!hasSeenTour('sidebar')) {
        startFullTour()
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [startFullTour, hasSeenTour])

  // On page navigation, auto-start page tour if not seen
  useEffect(() => {
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname

    // Don't auto-start page tour if sidebar tour hasn't been seen yet
    // (it will play first)
    if (!hasSeenTour('sidebar')) return

    const timer = setTimeout(() => {
      startPageTour(pathname)
    }, 600)

    return () => clearTimeout(timer)
  }, [pathname, startPageTour, hasSeenTour])

  return null
}
