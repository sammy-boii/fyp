'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Image from 'next/image'
import aiIcon from '@/public/ai.svg'

interface AIPromptInputProps {
  onSend?: (value: string) => void
  placeholder?: string
}

export default function AIPromptInput({
  onSend,
  placeholder = 'Ask AI to help with your workflow...'
}: AIPromptInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const morphBtnRef = useRef<HTMLButtonElement>(null)
  const btnIconRef = useRef<HTMLDivElement>(null)
  const inputBorderRef = useRef<SVGRectElement>(null)
  const inputBgRef = useRef<HTMLDivElement>(null)
  const inputFieldRef = useRef<HTMLInputElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const isExpandedRef = useRef(false)

  useEffect(() => {
    isExpandedRef.current = isExpanded
  }, [isExpanded])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isExpandedRef.current &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        collapseInput()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const expandInput = () => {
    if (isExpanded) {
      if (!inputValue.trim()) return
      sendMessage()
      return
    }

    setIsExpanded(true)

    const tl = gsap.timeline()

    // Move button from bottom-right to bottom center (right side of input)
    tl.to(
      morphBtnRef.current,
      {
        right: 'calc(50% - 246px)',
        rotation: 180,
        scale: 0.75,
        duration: 0.6,
        ease: 'power2.inOut'
      },
      0
    )

    // Scale down the icon briefly during rotation
    tl.to(
      btnIconRef.current,
      {
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in'
      },
      0
    )

    // Show cursor dot at center position
    tl.set(
      cursorDotRef.current,
      {
        left: '50%',
        top: 26,
        opacity: 1
      },
      0.3
    )

    // Draw the border stroke
    tl.to(
      inputBorderRef.current,
      {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: 'power2.out'
      },
      0.3
    )

    // Hide cursor dot
    tl.to(
      cursorDotRef.current,
      {
        opacity: 0,
        scale: 0,
        duration: 0.2
      },
      1.0
    )

    // Fill in the background with a radial expansion
    tl.fromTo(
      inputBgRef.current,
      {
        clipPath: 'circle(0% at 90% 50%)',
        opacity: 1
      },
      {
        clipPath: 'circle(150% at 90% 50%)',
        duration: 0.5,
        ease: 'power2.out'
      },
      0.4
    )

    // Show input field with typing effect
    tl.to(
      inputFieldRef.current,
      {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          inputFieldRef.current?.focus()
        }
      },
      0.7
    )

    // Bring back the icon
    tl.to(
      btnIconRef.current,
      {
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      },
      0.5
    )
  }

  const sendMessage = () => {
    const value = inputFieldRef.current?.value.trim()
    if (!value) return

    onSend?.(value)

    const tl = gsap.timeline()

    // Pulse send button
    tl.to(morphBtnRef.current, {
      scale: 0.85,
      duration: 0.1
    }).to(morphBtnRef.current, {
      scale: 1,
      duration: 0.2,
      ease: 'back.out(2)'
    })

    // Fade out input field
    tl.to(
      inputFieldRef.current,
      {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power2.in'
      },
      0.2
    )

    // Collapse background
    tl.to(
      inputBgRef.current,
      {
        clipPath: 'circle(0% at 90% 50%)',
        duration: 0.5,
        ease: 'power2.in'
      },
      0.3
    )

    // Erase the border (reverse drawing)
    tl.to(
      inputBorderRef.current,
      {
        strokeDashoffset: -1400,
        duration: 0.8,
        ease: 'power2.in'
      },
      0.5
    )

    // Morph button back to original position (bottom right of page)
    tl.to(
      morphBtnRef.current,
      {
        right: 16,
        rotation: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power2.inOut'
      },
      0.9
    )

    // Scale icon back
    tl.to(
      btnIconRef.current,
      {
        scale: 1,
        duration: 0.3,
        ease: 'back.out(2)'
      },
      1.3
    )

    tl.add(() => {
      setIsExpanded(false)
      setInputValue('')
      if (inputFieldRef.current) {
        inputFieldRef.current.value = ''
      }
      gsap.set(inputFieldRef.current, { x: 0, opacity: 0 })
      gsap.set(inputBorderRef.current, { strokeDashoffset: 1400 })
      gsap.set(inputBgRef.current, {
        clipPath: 'circle(0% at 90% 50%)',
        opacity: 0
      })
      gsap.set(morphBtnRef.current, { rotation: 0 })
    }, 1.5)
  }

  const collapseInput = () => {
    const tl = gsap.timeline()

    tl.to(inputFieldRef.current, {
      opacity: 0,
      x: 20,
      duration: 0.3,
      ease: 'power2.in'
    })

    tl.to(
      inputBgRef.current,
      {
        clipPath: 'circle(0% at 90% 50%)',
        duration: 0.5,
        ease: 'power2.in'
      },
      0.1
    )

    tl.to(
      inputBorderRef.current,
      {
        strokeDashoffset: -1400,
        duration: 0.8,
        ease: 'power2.in'
      },
      0.2
    )

    tl.to(
      morphBtnRef.current,
      {
        right: 16,
        rotation: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power2.inOut'
      },
      0.6
    )

    tl.to(
      btnIconRef.current,
      {
        scale: 1,
        duration: 0.3,
        ease: 'back.out(2)'
      },
      1.0
    )

    tl.add(() => {
      setIsExpanded(false)
      setInputValue('')
      if (inputFieldRef.current) {
        inputFieldRef.current.value = ''
      }
      gsap.set(inputFieldRef.current, { x: 0, opacity: 0 })
      gsap.set(inputBorderRef.current, { strokeDashoffset: 1400 })
      gsap.set(inputBgRef.current, {
        clipPath: 'circle(0% at 90% 50%)',
        opacity: 0
      })
      gsap.set(morphBtnRef.current, { rotation: 0 })
    }, 1.2)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      sendMessage()
    }
    if (e.key === 'Escape') {
      collapseInput()
    }
  }

  const isButtonDisabled = isExpanded && !inputValue.trim()

  return (
    <div
      ref={containerRef}
      className='absolute inset-0 pointer-events-none z-50'
      onClick={(e) => e.stopPropagation()}
    >
      {/* Morphing Button - starts at bottom right of page (same X as plus button) */}
      <button
        ref={morphBtnRef}
        onClick={expandInput}
        disabled={isButtonDisabled}
        className={`absolute bottom-4 right-4 size-12 rounded-full border-none flex bg-primary items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-200 z-10 pointer-events-auto ${
          isButtonDisabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:scale-105 active:scale-95'
        }`}
      >
        <div ref={btnIconRef} className='size-5'>
          <Image
            src={aiIcon}
            alt='AI'
            width={24}
            height={24}
            className='w-full h-full brightness-0 invert'
          />
        </div>
      </button>

      {/* Input Wrapper - centered at bottom */}
      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 w-[500px] h-12 pointer-events-none'>
        <svg
          width='100%'
          height='100%'
          className='absolute top-0 left-0 overflow-visible'
        >
          <rect
            ref={inputBorderRef}
            x='1.5'
            y='1.5'
            width='calc(100% - 3px)'
            height='41'
            rx='10'
            ry='10'
            className='fill-none stroke-muted-foreground/50 stroke-2'
            strokeDasharray='1400'
            strokeDashoffset='1400'
          />
        </svg>
        <div
          ref={inputBgRef}
          className='absolute top-0 left-0 w-full h-full bg-background/95 backdrop-blur-sm border border-muted-foreground/30 rounded-[10px] opacity-0 shadow-xl'
        />
        <input
          ref={inputFieldRef}
          type='text'
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className='absolute top-0 left-0 w-[calc(100%-50px)] h-full border-none outline-none bg-transparent px-4 text-sm text-foreground opacity-0 pointer-events-auto placeholder:text-muted-foreground'
        />
      </div>

      {/* Cursor Dot */}
      <div
        ref={cursorDotRef}
        className='absolute w-2 h-2 bg-primary rounded-full opacity-0 shadow-[0_0_15px_hsl(var(--primary)/0.9),0_0_5px_hsl(var(--primary)/0.6)] z-5'
      />
    </div>
  )
}
