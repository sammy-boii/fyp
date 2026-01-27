'use client'

import { Moon, SunDim } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

type props = {
  className?: string
}

export const AnimatedThemeToggler = ({ className }: props) => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = resolvedTheme === 'dark'

  const changeTheme = async () => {
    if (!buttonRef.current) return

    const newTheme = isDarkMode ? 'light' : 'dark'

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const y = top + height / 2
    const x = left + width / 2

    const right = window.innerWidth - left
    const bottom = window.innerHeight - top
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom))

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 700,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      }
    )
  }

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className={cn(className)} disabled={true}>
        <Moon size={20} />
      </button>
    )
  }

  return (
    <button ref={buttonRef} onClick={changeTheme} className={cn(className)}>
      {isDarkMode ? <SunDim size={20} /> : <Moon size={20} />}
    </button>
  )
}
