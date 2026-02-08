'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft, Copy, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.error(error)
  }, [error])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Background glow pulse in
      tl.fromTo(
        glowRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1 }
      )

      // Icon entrance with bounce
      tl.fromTo(
        iconRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(1.7)'
        },
        '-=0.5'
      )

      // Continuous subtle shake on the icon
      gsap.to(iconRef.current, {
        rotation: '+=3',
        yoyo: true,
        repeat: -1,
        duration: 0.15,
        ease: 'sine.inOut',
        delay: 1.5
      })

      // Content stagger in
      tl.fromTo(
        '[data-animate]',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        '-=0.3'
      )

      // Floating particles
      const particles = particlesRef.current?.children
      if (particles) {
        Array.from(particles).forEach((particle, i) => {
          gsap.set(particle, {
            x: gsap.utils.random(-300, 300),
            y: gsap.utils.random(-300, 300),
            scale: gsap.utils.random(0.3, 1),
            opacity: 0
          })
          gsap.to(particle, {
            opacity: gsap.utils.random(0.15, 0.4),
            duration: gsap.utils.random(1, 2),
            delay: gsap.utils.random(0, 1)
          })
          gsap.to(particle, {
            y: `+=${gsap.utils.random(-80, 80)}`,
            x: `+=${gsap.utils.random(-40, 40)}`,
            duration: gsap.utils.random(4, 8),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.2
          })
        })
      }

      // Pulsing glow
      gsap.to(glowRef.current, {
        scale: 1.1,
        opacity: 0.6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const copyDigest = () => {
    if (error.digest) {
      navigator.clipboard.writeText(error.digest)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      ref={containerRef}
      className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4'
    >
      {/* Floating particles */}
      <div
        ref={particlesRef}
        className='pointer-events-none absolute inset-0 overflow-hidden'
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className='absolute left-1/2 top-1/2 size-1.5 rounded-full bg-destructive/40'
          />
        ))}
      </div>

      {/* Background glow */}
      <div
        ref={glowRef}
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-destructive/[0.07] blur-[100px]'
      />

      <div className='relative z-10 flex max-w-lg flex-col items-center text-center'>
        {/* Animated icon */}
        <div ref={iconRef} className='mb-8'>
          <div className='relative'>
            <div className='flex size-20 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 shadow-lg shadow-destructive/5'>
              <AlertTriangle className='size-9 text-destructive' />
            </div>
            {/* Corner accents */}
            <div className='absolute -top-1 -right-1 size-2 rounded-full bg-destructive/50' />
            <div className='absolute -bottom-1 -left-1 size-1.5 rounded-full bg-destructive/30' />
          </div>
        </div>

        {/* Error code */}
        <div data-animate className='mb-4'>
          <span className='text-xs font-semibold uppercase tracking-[0.3em] text-destructive/70'>
            Something went wrong
          </span>
        </div>

        {/* Title */}
        <h1
          data-animate
          className='mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl'
        >
          Unexpected Error
        </h1>

        {/* Description */}
        <p
          data-animate
          className='mb-6 max-w-md text-sm leading-relaxed text-muted-foreground'
        >
          We hit a snag while processing your request. This has been logged and
          we&apos;ll look into it. You can retry or head back home.
        </p>

        {/* Error digest */}
        {error.digest && (
          <div data-animate className='mb-8 w-full max-w-xs'>
            <button
              onClick={copyDigest}
              className='group flex w-full items-center justify-between rounded-lg border border-border/50 bg-muted/50 px-4 py-2.5 text-left transition-colors hover:bg-muted'
            >
              <div className='min-w-0'>
                <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60'>
                  Error ID
                </p>
                <p className='truncate font-mono text-xs text-muted-foreground'>
                  {error.digest}
                </p>
              </div>
              {copied ? (
                <Check className='ml-2 size-3.5 shrink-0 text-primary' />
              ) : (
                <Copy className='ml-2 size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground' />
              )}
            </button>
          </div>
        )}

        {/* Actions */}
        <div data-animate className='flex items-center gap-3'>
          <Button variant='outline' size='sm' asChild className='gap-2 px-4'>
            <Link href='/dashboard'>
              <ArrowLeft className='size-3.5' />
              Go Home
            </Link>
          </Button>
          <Button size='sm' onClick={reset} className='gap-2 px-4'>
            <RefreshCw className='size-3.5' />
            Try Again
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
