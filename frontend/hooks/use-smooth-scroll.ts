'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface SmoothScrollEvent {
  progress: number
  scroll: number
  velocity: number
  limit: number
}

interface UseSmoothScrollOptions {
  enabled?: boolean
  onScroll?: (event: SmoothScrollEvent) => void
}

export function useSmoothScroll({
  enabled = true,
  onScroll
}: UseSmoothScrollOptions = {}) {
  const onScrollRef = useRef(onScroll)

  useEffect(() => {
    onScrollRef.current = onScroll
  }, [onScroll])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: true,
      anchors: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.08
    })

    const handleScroll = (event: {
      progress: number
      scroll: number
      velocity: number
      limit: number
    }) => {
      onScrollRef.current?.({
        progress: event.progress,
        scroll: event.scroll,
        velocity: event.velocity,
        limit: event.limit
      })

      ScrollTrigger.update()
    }

    lenis.on('scroll', handleScroll)

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000)
    }

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null

      if (!anchor) {
        return
      }

      const href = anchor.getAttribute('href')

      if (!href || href === '#') {
        return
      }

      const destination = document.querySelector<HTMLElement>(href)

      if (!destination) {
        return
      }

      event.preventDefault()
      lenis.scrollTo(destination, {
        offset: -24,
        duration: 1.12
      })
    }

    document.addEventListener('click', handleAnchorClick)

    gsap.ticker.add(updateLenis)
    gsap.ticker.lagSmoothing(0)

    const onRefresh = () => {
      lenis.resize()
    }

    ScrollTrigger.addEventListener('refresh', onRefresh)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(updateLenis)
      document.removeEventListener('click', handleAnchorClick)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      lenis.off('scroll', handleScroll)
      lenis.destroy()
    }
  }, [enabled])
}
