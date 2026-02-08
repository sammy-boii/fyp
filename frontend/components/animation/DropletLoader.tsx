'use client'

import { useEffect, useRef } from 'react'

export default function DropletLoader() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Randomize initial positions to avoid perfect synchronization
    const droplets = document.querySelectorAll('.droplet')
    droplets.forEach((drop) => {
      const randomDelay = Math.random() * -10
      ;(drop as HTMLElement).style.animationDelay = `${randomDelay}s`
    })

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const moveX = (clientX - centerX) / 50
      const moveY = (clientY - centerY) / 50

      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="h-full w-full flex items-center justify-center font-['Inter',sans-serif] overflow-hidden">
      {/* SVG Filter */}
      {/* <svg style={{ display: 'none' }}>
        <filter id='grainy-texture'>
          <feTurbulence
            type='fractalNoise'
            baseFrequency='0.65'
            numOctaves='3'
            stitchTiles='stitch'
          />
          <feColorMatrix type='saturate' values='0' />
          <feComponentTransfer>
            <feFuncA type='linear' slope='0.15' />
          </feComponentTransfer>
          <feBlend in='SourceGraphic' mode='multiply' />
        </filter>
      </svg> */}

      {/* Grainy Overlay */}
      {/* <div
        className='absolute w-full h-full inset-0 pointer-events-none z-10 rounded-lg'
        style={{ filter: 'url(#grainy-texture)' }}
      /> */}

      <div className='relative flex flex-col items-center justify-center'>
        {/* SVG Filter */}
        <svg
          xmlns='http://www.w3.org/2000/svg'
          version='1.1'
          style={{ display: 'none' }}
        >
          <defs>
            <filter id='gooey-effect'>
              <feGaussianBlur
                in='SourceGraphic'
                stdDeviation='10'
                result='blur'
              />
              <feColorMatrix
                in='blur'
                mode='matrix'
                values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10'
                result='goo'
              />
              <feBlend in='SourceGraphic' in2='goo' />
            </filter>
          </defs>
        </svg>

        {/* Liquid Container */}
        <div
          ref={containerRef}
          className='relative w-[200px] h-[200px] flex justify-center items-center transition-transform duration-100'
          style={{ filter: "url('#gooey-effect')" }}
        >
          {/* Liquid Base */}
          <div
            className='absolute w-20 h-20 rounded-full z-2'
            style={{
              background:
                'linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 80%, black) 100%)',
              boxShadow:
                '0 0 20px color-mix(in oklch, var(--primary) 40%, transparent)',
              animation: 'pulse 3s ease-in-out infinite'
            }}
          />

          {/* Droplets */}
          <div
            className='droplet absolute w-[30px] h-[30px] rounded-full opacity-80'
            style={{
              background: 'var(--primary)',
              animation: 'orbit 4s linear infinite'
            }}
          />
          <div
            className='droplet absolute w-[25px] h-[25px] rounded-full opacity-80'
            style={{
              background: 'color-mix(in oklch, var(--primary) 85%, black)',
              animation: 'orbit 5.5s linear infinite reverse'
            }}
          />
          <div
            className='droplet absolute w-5 h-5 rounded-full opacity-80'
            style={{
              background: 'color-mix(in oklch, var(--primary) 90%, white)',
              animation: 'vertical-bounce 3s ease-in-out infinite'
            }}
          />
          <div
            className='droplet absolute w-[35px] h-[35px] rounded-full opacity-80'
            style={{
              background: 'color-mix(in oklch, var(--primary) 80%, black)',
              animation: 'horizontal-bounce 4.5s ease-in-out infinite'
            }}
          />
          <div
            className='droplet absolute w-[15px] h-[15px] rounded-full opacity-80'
            style={{
              background: 'color-mix(in oklch, var(--primary) 95%, white)',
              animation: 'chaotic 6s infinite'
            }}
          />
          <div
            className='droplet absolute w-10 h-10 rounded-full opacity-80'
            style={{
              background: 'color-mix(in oklch, var(--primary) 92%, black)',
              animation: 'orbit 7s linear infinite'
            }}
          />
        </div>

        {/* Status Text */}
        <div className='mt-10 flex flex-col items-center gap-3 z-10'>
          <span
            className='text-[0.75rem] font-semibold tracking-[0.3em]'
            style={{
              color: 'var(--primary)',
              textShadow:
                '0 0 10px color-mix(in oklch, var(--primary) 50%, transparent)'
            }}
          >
            INITIALIZING
          </span>
          <div className='w-[140px] h-0.5 bg-white/5 rounded overflow-hidden'>
            <div
              className='w-full h-full'
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--primary), transparent)',
                animation: 'scan 2s linear infinite'
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(70px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(70px) rotate(-360deg);
          }
        }

        @keyframes vertical-bounce {
          0%,
          100% {
            transform: translateY(-80px);
          }
          50% {
            transform: translateY(80px);
          }
        }

        @keyframes horizontal-bounce {
          0%,
          100% {
            transform: translateX(-80px);
          }
          50% {
            transform: translateX(80px);
          }
        }

        @keyframes chaotic {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(60px, -60px);
          }
          50% {
            transform: translate(-40px, 80px);
          }
          75% {
            transform: translate(-70px, -30px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}
