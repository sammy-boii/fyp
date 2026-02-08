'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const numbersRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Grid lines appear
      const gridLines = gridRef.current?.children
      if (gridLines) {
        tl.fromTo(
          Array.from(gridLines),
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.8,
            stagger: { each: 0.05, from: 'center' }
          }
        )
      }

      // Background glow
      tl.fromTo(
        glowRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2 },
        '-=0.5'
      )

      // 404 numbers — each digit drops in
      const digits = numbersRef.current?.children
      if (digits) {
        tl.fromTo(
          Array.from(digits),
          { y: -120, opacity: 0, scale: 0.5, rotationX: 90 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotationX: 0,
            duration: 0.7,
            ease: 'back.out(1.4)',
            stagger: 0.12
          },
          '-=0.6'
        )
      }

      // Content stagger
      tl.fromTo(
        '[data-animate]',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
        '-=0.3'
      )

      // Orbit rotation
      gsap.to(orbitRef.current, {
        rotation: 360,
        duration: 30,
        repeat: -1,
        ease: 'none'
      })

      // Glow pulse
      gsap.to(glowRef.current, {
        scale: 1.15,
        opacity: 0.5,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })

      // Subtle float on 404
      gsap.to(numbersRef.current, {
        y: -8,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.5
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4'
    >
      {/* Decorative grid */}
      <div
        ref={gridRef}
        className='pointer-events-none absolute inset-0 flex flex-col justify-between overflow-hidden px-8 py-8 opacity-[0.04]'
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='h-px w-full origin-center bg-foreground' />
        ))}
      </div>

      {/* Background glow */}
      <div
        ref={glowRef}
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/6 blur-[120px]'
      />

      {/* Orbiting ring */}
      <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
        <div ref={orbitRef} className='relative size-80 sm:size-[400px]'>
          {/* Ring */}
          <div className='absolute inset-0 rounded-full border border-dashed border-border/30' />
          {/* Orbiting dots */}
          <div className='absolute -top-1 left-1/2 -translate-x-1/2 size-2 rounded-full bg-primary/40' />
          <div className='absolute top-1/2 -right-1 -translate-y-1/2 size-1.5 rounded-full bg-primary/25' />
          <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary/30' />
          <div className='absolute top-1/2 -left-1 -translate-y-1/2 size-1.5 rounded-full bg-primary/20' />
        </div>
      </div>

      <div className='relative z-10 flex max-w-lg flex-col items-center text-center'>
        {/* 404 */}
        <div ref={numbersRef} className='mb-6 flex items-center gap-2 sm:gap-4'>
          <span className='text-[7rem] font-black leading-none tracking-tighter text-foreground/10 sm:text-[9rem]'>
            4
          </span>
          <span className='relative text-[7rem] font-black leading-none tracking-tighter text-primary/20 sm:text-[9rem]'>
            0{/* Inner glow on the 0 */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='size-10 rounded-full bg-primary/10 blur-xl sm:size-14' />
            </div>
          </span>
          <span className='text-[7rem] font-black leading-none tracking-tighter text-foreground/10 sm:text-[9rem]'>
            4
          </span>
        </div>

        {/* Search icon */}
        <div data-animate className='mb-5'>
          <div className='flex size-12 items-center justify-center rounded-xl border border-border/50 bg-muted/40 shadow-sm'>
            <Search className='size-5 text-muted-foreground/60' />
          </div>
        </div>

        {/* Label */}
        <div data-animate className='mb-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.3em] text-primary/60'>
            Page not found
          </span>
        </div>

        {/* Title */}
        <h1
          data-animate
          className='mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'
        >
          Lost in the workflow
        </h1>

        {/* Description */}
        <p
          data-animate
          className='mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground'
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div data-animate className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='gap-2 px-4'
          >
            <ArrowLeft className='size-3.5' />
            Go Back
          </Button>
          <Button size='sm' asChild className='gap-2 px-4'>
            <Link href='/dashboard'>
              <Home className='size-3.5' />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Decorative bottom line */}
        <div
          data-animate
          className='mt-12 h-px w-24 bg-linear-to-r from-transparent via-border to-transparent'
        />
      </div>
    </div>
  )
}
