'use client'

import { MarsColonyScene } from '@/components/demo/mars-colony-scene'
import { useSmoothScroll } from '@/hooks/use-smooth-scroll'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Bot,
  CircuitBoard,
  Network,
  Radar,
  ShieldCheck,
  Workflow,
  type LucideIcon
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import './demo.css'

gsap.registerPlugin(ScrollTrigger)

interface Capability {
  title: string
  description: string
  icon: LucideIcon
}

interface WorkflowStep {
  title: string
  description: string
}

const capabilityCards: Capability[] = [
  {
    title: 'Adaptive Workflow Graphs',
    description:
      'Build automation maps that rewire themselves in real time as triggers, approvals, and retries evolve.',
    icon: Workflow
  },
  {
    title: 'Signal-Aware Monitoring',
    description:
      'Fuse telemetry streams into one mesh to surface bottlenecks, drift, and execution hotspots before they cascade.',
    icon: Radar
  },
  {
    title: 'Autonomous Safeguards',
    description:
      'Apply policy gates, red-team checks, and rollback plans directly in the delivery pipeline with zero manual handoff.',
    icon: ShieldCheck
  }
]

const workflowSteps: WorkflowStep[] = [
  {
    title: 'Map the intent graph',
    description:
      'Model dependencies, event contracts, and owner boundaries in one canonical topology.'
  },
  {
    title: 'Inject live signals',
    description:
      'Bind each node to operational metrics, queue lag, and anomaly confidence scores.'
  },
  {
    title: 'Automate decision paths',
    description:
      'Branch or recover automatically using policy packs, retry budgets, and approval checkpoints.'
  },
  {
    title: 'Ship with confidence loops',
    description:
      'Continuously validate outcomes against SLOs and optimize each run for the next cycle.'
  }
]

const metrics = [
  {
    value: '97.8%',
    label: 'incident-free execution windows'
  },
  {
    value: '4.2x',
    label: 'faster workflow reconfiguration'
  },
  {
    value: '<120ms',
    label: 'average signal propagation lag'
  }
]

const DEMO_BACKGROUND = 'rgb(4, 10, 23)'
const HERO_TITLE = '"Complexity is inevitable.\nFriction is\noptional."'

export default function DemoPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)

  const [reducedMotion, setReducedMotion] = useState(false)

  const setScrollProgress = useCallback((value: number) => {
    const normalized = Math.min(Math.max(value, 0), 1)
    scrollProgressRef.current = normalized
    rootRef.current?.style.setProperty(
      '--demo-scroll-progress',
      normalized.toFixed(4)
    )
  }, [])

  const handleStartDemo = useCallback(() => {
    const firstSection = document.getElementById('capabilities')
    if (!firstSection) {
      return
    }
    firstSection.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    })
  }, [reducedMotion])

  useSmoothScroll({
    enabled: true,
    onScroll: ({ progress }) => {
      setScrollProgress(progress)
    }
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const updateMotionPreference = () => {
      setReducedMotion(mediaQuery.matches)
    }

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  useEffect(() => {
    const updateNativeScrollProgress = () => {
      const scrollTop = window.scrollY || window.pageYOffset
      const limit = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      )

      setScrollProgress(scrollTop / limit)
    }

    updateNativeScrollProgress()
    window.addEventListener('scroll', updateNativeScrollProgress, {
      passive: true
    })
    window.addEventListener('resize', updateNativeScrollProgress)

    return () => {
      window.removeEventListener('scroll', updateNativeScrollProgress)
      window.removeEventListener('resize', updateNativeScrollProgress)
    }
  }, [setScrollProgress])

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const typewriterTimers: number[] = []

    const clearTypewriterTimers = () => {
      while (typewriterTimers.length > 0) {
        const timer = typewriterTimers.pop()

        if (timer !== undefined) {
          window.clearTimeout(timer)
        }
      }
    }

    const ctx = gsap.context(() => {
      const motionScale = reducedMotion ? 0.45 : 1
      const introTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      const heroTypeTarget = root.querySelector<HTMLElement>(
        '[data-demo-hero-type]'
      )

      const runTypewriter = () => {
        if (!heroTypeTarget) {
          return
        }

        clearTypewriterTimers()

        let visibleChars = 0
        heroTypeTarget.textContent = ''
        heroTypeTarget.classList.add('is-typing')

        const typeNext = () => {
          visibleChars += 1
          heroTypeTarget.textContent = HERO_TITLE.slice(0, visibleChars)

          if (visibleChars >= HERO_TITLE.length) {
            heroTypeTarget.classList.remove('is-typing')
            return
          }

          const currentChar = HERO_TITLE[visibleChars - 1]
          const baseDelay = 24 + Math.random() * 42
          const punctuationDelay = /[.,!?;:]/.test(currentChar) ? 170 : 0
          const newlineDelay = currentChar === '\n' ? 220 : 0
          const spaceDelay = currentChar === ' ' ? 12 : 0
          const timeout = window.setTimeout(
            typeNext,
            baseDelay + punctuationDelay + newlineDelay + spaceDelay
          )
          typewriterTimers.push(timeout)
        }

        const initialTimeout = window.setTimeout(typeNext, 120)
        typewriterTimers.push(initialTimeout)
      }

      introTimeline
        .fromTo(
          '[data-demo-intro="kicker"]',
          {
            autoAlpha: 0,
            y: -18 * motionScale,
            filter: 'blur(10px)',
            letterSpacing: '0.34em'
          },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            letterSpacing: '0.2em',
            duration: 0.72
          }
        )
        .fromTo(
          '[data-demo-hero-title]',
          {
            autoAlpha: 0,
            y: 24 * motionScale,
            filter: 'blur(12px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.82
          },
          '-=0.28'
        )
        .add(() => {
          runTypewriter()
        }, '-=0.04')
        .to(
          {},
          {
            duration: reducedMotion ? 0.01 : 2.7
          },
          '<'
        )
        .fromTo(
          '[data-demo-hero-line]',
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.95 },
          '-=1.95'
        )
        .fromTo(
          '[data-demo-intro="copy"]',
          {
            autoAlpha: 0,
            y: 26 * motionScale,
            x: -16 * motionScale,
            filter: 'blur(8px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.8
          },
          '-=1.35'
        )

      const revealElements =
        gsap.utils.toArray<HTMLElement>('[data-demo-reveal]')
      revealElements.forEach((element, index) => {
        const variant = element.dataset.demoReveal
        const trigger = {
          trigger: element,
          start: 'top 86%'
        }

        if (variant === 'heading') {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 30 * motionScale,
              x: (index % 2 === 0 ? -20 : 20) * motionScale,
              filter: 'blur(10px)'
            },
            {
              autoAlpha: 1,
              y: 0,
              x: 0,
              filter: 'blur(0px)',
              duration: 0.88,
              ease: 'power3.out',
              scrollTrigger: trigger
            }
          )
          return
        }

        if (variant === 'strip') {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 22 * motionScale,
              scale: 0.97
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.76,
              ease: 'power2.out',
              scrollTrigger: trigger
            }
          )
          return
        }

        if (variant === 'cta') {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 34 * motionScale,
              clipPath: 'inset(0 0 100% 0)'
            },
            {
              autoAlpha: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.92,
              ease: 'power3.out',
              scrollTrigger: trigger
            }
          )
          return
        }

        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            y: 34 * motionScale
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: trigger
          }
        )
      })

      const cardElements = gsap.utils.toArray<HTMLElement>('[data-demo-card]')
      cardElements.forEach((element, index) => {
        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            y: (32 + (index % 3) * 8) * motionScale,
            x: (index % 2 === 0 ? -12 : 12) * motionScale,
            rotateX: (index % 3 === 0 ? 14 : 9) * motionScale,
            rotateY: (index % 2 === 0 ? -6 : 6) * motionScale,
            filter: 'blur(8px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            rotateX: 0,
            rotateY: 0,
            filter: 'blur(0px)',
            duration: 0.82 + (index % 3) * 0.06,
            delay: index * 0.04,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 85%'
            }
          }
        )
      })

      const parallaxElements = gsap.utils.toArray<HTMLElement>(
        '[data-demo-parallax]'
      )

      parallaxElements.forEach((element, index) => {
        const baseDistance = index % 2 === 0 ? -24 : 24
        const distance = baseDistance * motionScale

        gsap.to(element, {
          y: distance,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        })
      })
    }, root)

    return () => {
      clearTypewriterTimers()
      ctx.revert()
    }
  }, [reducedMotion])

  return (
    <div
      ref={rootRef}
      className='demo-page'
      style={{ backgroundColor: DEMO_BACKGROUND }}
    >
      <div className='demo-background' aria-hidden='true'>
        <MarsColonyScene
          progressRef={scrollProgressRef}
          reducedMotion={reducedMotion}
          onStartDemo={handleStartDemo}
        />
        <div className='demo-vignette' />
      </div>

      <aside className='demo-scroll-indicator' aria-hidden='true'>
        <div className='demo-scroll-track'>
          <div className='demo-scroll-dot' data-demo-scroll-dot />
        </div>
      </aside>

      <main className='demo-content'>
        <section className='demo-section demo-hero' data-demo-section>
          <p className='demo-kicker' data-demo-intro='kicker'>
            LIVE WORKFLOW CONTROL
          </p>

          <h1
            className='demo-hero-title'
            data-demo-hero-title
            data-demo-parallax
            aria-label='Complexity is inevitable. Friction is optional.'
          >
            <span className='demo-hero-type' data-demo-hero-type />
          </h1>

          <div className='demo-hero-line' data-demo-hero-line />

          <p
            className='demo-hero-copy'
            data-demo-intro='copy'
            data-demo-parallax
          >
            Orchestrate, monitor, and adapt critical pipelines in one runtime
            surface built for speed.
          </p>
        </section>

        <section
          id='capabilities'
          className='demo-section demo-section-large'
          data-demo-section
        >
          <div className='demo-section-heading' data-demo-reveal='heading'>
            <p className='demo-kicker'>CAPABILITIES</p>
            <h2 data-demo-parallax>
              Purpose-built for high-context workflow systems
            </h2>
          </div>

          <div className='demo-card-grid'>
            {capabilityCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.title} className='demo-card' data-demo-card>
                  <div className='demo-icon-badge'>
                    <Icon className='size-5 text-primary' />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section
          id='workflow'
          className='demo-section demo-section-large'
          data-demo-section
        >
          <div className='demo-section-heading' data-demo-reveal='heading'>
            <p className='demo-kicker'>EXECUTION BLUEPRINT</p>
            <h2 data-demo-parallax>
              From intent to autonomous operation in four loops
            </h2>
          </div>

          <div className='demo-workflow-grid'>
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className='demo-workflow-item'
                data-demo-card
              >
                <div className='demo-workflow-index'>0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>

          <div className='demo-feature-strip' data-demo-reveal='strip'>
            <div>
              <CircuitBoard className='size-5 text-primary' />
              <p>Constraint-aware orchestration graph</p>
            </div>
            <div>
              <Network className='size-5 text-primary' />
              <p>Cross-team dependency visibility</p>
            </div>
            <div>
              <Bot className='size-5 text-primary' />
              <p>AI-assisted remediation routing</p>
            </div>
          </div>
        </section>

        <section
          id='results'
          className='demo-section demo-section-large'
          data-demo-section
        >
          <div className='demo-section-heading' data-demo-reveal='heading'>
            <p className='demo-kicker'>OPERATIONAL IMPACT</p>
            <h2 data-demo-parallax>
              Numbers that hold under production pressure
            </h2>
          </div>

          <div className='demo-metric-grid'>
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className='demo-metric'
                data-demo-card
              >
                <h3>{metric.value}</h3>
                <p>{metric.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='demo-finale-space' aria-hidden='true' />
      </main>
    </div>
  )
}
