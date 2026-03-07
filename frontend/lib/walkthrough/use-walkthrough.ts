'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { driver, type Driver, type DriveStep } from 'driver.js'
import {
  tourStepsByPage,
  resolveTourPage,
  type TourPage,
  sidebarSteps,
  dashboardSteps,
  workflowsSteps,
  credentialsSteps,
  activitySteps
} from './tour-steps'

const STORAGE_PREFIX = 'flux-tour-seen-'

function hasSeenTour(page: string): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(`${STORAGE_PREFIX}${page}`) === '1'
}

function markTourSeen(page: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`${STORAGE_PREFIX}${page}`, '1')
}

export function resetAllTours(): void {
  if (typeof window === 'undefined') return
  const keys = Object.keys(window.localStorage).filter((k) =>
    k.startsWith(STORAGE_PREFIX)
  )
  keys.forEach((k) => window.localStorage.removeItem(k))
}

export function resetTour(page: TourPage): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(`${STORAGE_PREFIX}${page}`)
}

/**
 * Hook that provides walkthrough tour controls for any page.
 */
export function useWalkthrough() {
  const driverRef = useRef<Driver | null>(null)
  const router = useRouter()

  const startTour = useCallback((page: TourPage, force = false) => {
    // Don't show if already seen (unless forced)
    if (!force && hasSeenTour(page)) return

    const steps = tourStepsByPage[page]
    if (!steps || steps.length === 0) return

    // Destroy any existing instance
    if (driverRef.current) {
      driverRef.current.destroy()
    }

    // Small delay to ensure DOM elements are rendered
    requestAnimationFrame(() => {
      // Filter steps to only include those with elements present in DOM
      const availableSteps = steps.filter((step) => {
        if (!step.element) return true
        return document.querySelector(step.element as string) !== null
      })

      if (availableSteps.length === 0) return

      const driverInstance = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        stagePadding: 6,
        stageRadius: 8,
        popoverClass: 'flux-tour-popover',
        steps: availableSteps,
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done ✓',
        onDestroyed: () => {
          markTourSeen(page)
          driverRef.current = null
        }
      })

      driverRef.current = driverInstance
      driverInstance.drive()
    })
  }, [])

  /**
   * Start the full app walkthrough that navigates across pages.
   * Sidebar intro → Dashboard tour → Workflows tour → Credentials tour → Activity tour
   */
  const startFullTour = useCallback(
    (force = false) => {
      if (!force && hasSeenTour('sidebar')) return

      if (driverRef.current) {
        driverRef.current.destroy()
      }

      // The tour sequence: sidebar intro steps, then navigate to each page
      // We build a combined step list with navigation breaks
      const fullSteps: DriveStep[] = [
        // ── Sidebar intro (3 steps) ──
        ...sidebarSteps.slice(0, 3), // Welcome, Navigation, Dashboard link

        // ── Transition to Dashboard ──
        {
          element: '[data-tour="sidebar-dashboard"]',
          popover: {
            title: "Let's visit the Dashboard",
            description:
              "Click Next and we'll navigate to the Dashboard to explore it.",
            side: 'right',
            align: 'center',
            onNextClick: () => {
              router.push('/dashboard')
              // Wait for navigation + render, then advance
              setTimeout(() => {
                driverRef.current?.moveNext()
              }, 800)
            }
          }
        },

        // ── Dashboard steps ──
        ...dashboardSteps,

        // ── Transition to Workflows ──
        {
          element: '[data-tour="sidebar-workflows"]',
          popover: {
            title: 'Next: Workflows',
            description:
              "Let's check out the Workflows page where you build automations.",
            side: 'right',
            align: 'center',
            onNextClick: () => {
              router.push('/workflows')
              setTimeout(() => {
                driverRef.current?.moveNext()
              }, 800)
            }
          }
        },

        // ── Workflows steps ──
        ...workflowsSteps,

        // ── Transition to Credentials ──
        {
          element: '[data-tour="sidebar-credentials"]',
          popover: {
            title: 'Next: Credentials',
            description:
              "Now let's see how you manage third-party connections.",
            side: 'right',
            align: 'center',
            onNextClick: () => {
              router.push('/credentials')
              setTimeout(() => {
                driverRef.current?.moveNext()
              }, 800)
            }
          }
        },

        // ── Credentials steps ──
        ...credentialsSteps,

        // ── Transition to Activity ──
        {
          element: '[data-tour="sidebar-activity"]',
          popover: {
            title: 'Next: Activity',
            description:
              "Finally, let's look at the Activity page for execution monitoring.",
            side: 'right',
            align: 'center',
            onNextClick: () => {
              router.push('/activity')
              setTimeout(() => {
                driverRef.current?.moveNext()
              }, 800)
            }
          }
        },

        // ── Activity steps ──
        ...activitySteps,

        // ── Wrap up ──
        {
          element: '[data-tour="sidebar-help"]',
          popover: {
            title: "You're all set! 🎉",
            description:
              'You can replay the tour for any page by clicking this Help button anytime. Happy automating!',
            side: 'right',
            align: 'end'
          }
        }
      ]

      requestAnimationFrame(() => {
        const availableSteps = fullSteps.filter((step) => {
          if (!step.element) return true
          return document.querySelector(step.element as string) !== null
        })

        if (availableSteps.length === 0) return

        const driverInstance = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          allowClose: true,
          stagePadding: 6,
          stageRadius: 8,
          popoverClass: 'flux-tour-popover',
          steps: fullSteps, // Use full steps; missing elements are handled gracefully
          nextBtnText: 'Next →',
          prevBtnText: '← Back',
          doneBtnText: 'Done ✓',
          onDeselected: () => {
            // After each step, re-check if current step element exists
            // (it may be on a different page now)
          },
          onDestroyed: () => {
            markTourSeen('sidebar')
            markTourSeen('dashboard')
            markTourSeen('workflows')
            markTourSeen('credentials')
            markTourSeen('activity')
            driverRef.current = null
          }
        })

        driverRef.current = driverInstance
        driverInstance.drive()
      })
    },
    [router]
  )

  const startPageTour = useCallback(
    (pathname: string, force = false) => {
      const page = resolveTourPage(pathname)
      if (page) {
        startTour(page, force)
      }
    },
    [startTour]
  )

  const stopTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy()
      driverRef.current = null
    }
  }, [])

  return {
    startTour,
    startFullTour,
    startPageTour,
    stopTour,
    resetAllTours,
    resetTour,
    hasSeenTour
  }
}
