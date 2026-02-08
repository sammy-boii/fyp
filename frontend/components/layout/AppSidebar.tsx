'use client'

import {
  Activity,
  KeyRound,
  LayoutDashboard,
  Workflow,
  ZapIcon,
  PanelLeft
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { BadgeCheck, ChevronsUpDown, LogOut } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { TooltipContent } from '../ui/tooltip'
import { logout } from '@/actions/auth.actions'
import { toast } from 'sonner'
import { useGetProfile } from '@/hooks/use-user'
import { Kbd } from '../ui/kbd'
import { AnimatedThemeToggler } from '../magicui/animated-theme-toggler'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Palette } from 'lucide-react'

// Menu items.
const mainItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & stats'
  },
  {
    title: 'Workflows',
    url: '/workflows',
    icon: Workflow,
    description: 'Automations'
  },
  {
    title: 'Credentials',
    url: '/credentials',
    icon: KeyRound,
    description: 'API keys & OAuth'
  },
  {
    title: 'Activity',
    url: '/activity',
    icon: Activity,
    description: 'Execution logs'
  }
]

export function AppSidebar() {
  const pathName = usePathname()

  const { data } = useGetProfile()

  const isActive = (url: string) => {
    return (
      pathName === url ||
      (pathName.startsWith(url) && pathName[url.length] === '/')
    )
  }

  return (
    <Sidebar collapsible='icon' className='group'>
      <SidebarHeader className='relative'>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link className='flex items-center gap-2.5 p-2 relative' href='/'>
              <div className='relative'>
                <ZapIcon
                  className='
                    size-5! transition-all duration-300
                    group-data-[state=collapsed]:opacity-100
                    group-data-[state=collapsed]:group-hover:opacity-0
                    group-data-[state=expanded]:opacity-100
                    text-primary
                  '
                />
                <div className='absolute -inset-1 bg-primary/20 rounded-md blur-sm -z-10 group-data-[state=collapsed]:group-hover:opacity-0 transition-opacity' />
              </div>
              <span className='font-bold text-lg tracking-tight group-data-[state=expanded]:block hidden'>
                Flux
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarToggle />
      </SidebarHeader>

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className='text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold'>
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={isActive(item.url) ? 'text-white' : ''}
                  >
                    {item.url === '/activity' ? (
                      <a href={item.url}>
                        <item.icon className='size-4' />
                        <span>{item.title}</span>
                      </a>
                    ) : (
                      <Link href={item.url}>
                        <item.icon className='size-4' />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: data?.data?.name || 'Anonymous',
            email: data?.data?.email || 'm@example.com',
            avatar: data?.data?.avatar || undefined
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function SidebarToggle() {
  const { toggleSidebar, open } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className='
          absolute top-2 right-2 z-10 flex items-center justify-center
          w-8 h-8 rounded-md
          transition-all duration-300
          hover:bg-accent hover:text-accent-foreground
          group-data-[state=collapsed]:opacity-0
          group-data-[state=collapsed]:group-hover:opacity-100
        '
      aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <TooltipTrigger asChild>
        <PanelLeft className='size-4 transition-transform duration-300 ' />
      </TooltipTrigger>
      <TooltipContent className='bg-muted'>
        <Kbd className='bg-transparent! text-foreground!'>Ctrl + B</Kbd>
      </TooltipContent>
    </button>
  )
}

function NavUser({
  user
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()

  const router = useRouter()
  const fallbackInitial = user.name?.charAt(0)?.toUpperCase() || 'U'
  const defaultAccent = '#22c55e'
  const [accentColor, setAccentColor] = useState(defaultAccent)

  const accentForeground = useMemo(() => {
    const hex = accentColor.replace('#', '')
    if (hex.length !== 6) return '#0a0a0a'
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 0.6 ? '#0a0a0a' : '#ffffff'
  }, [accentColor])

  useEffect(() => {
    const stored = window.localStorage.getItem('app-accent-color')
    if (stored) {
      setAccentColor(stored)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', accentColor)
    root.style.setProperty('--sidebar-primary', accentColor)
    root.style.setProperty('--primary-foreground', accentForeground)
    root.style.setProperty('--sidebar-primary-foreground', accentForeground)
    window.localStorage.setItem('app-accent-color', accentColor)
  }, [accentColor, accentForeground])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className='hover:bg-accent active:text-accent-foreground hover:text-accent-foreground active:bg-accent'
              size='lg'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='rounded-lg text-foreground'>
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.name}</span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-lg'>
                    {fallbackInitial}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={'/dashboard'}>
                  <BadgeCheck />
                  Account
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <AnimatedThemeToggler className='flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none' />
              </DropdownMenuItem>

              <AccentColorPicker
                accentColor={accentColor}
                onColorChange={setAccentColor}
                defaultAccent={defaultAccent}
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={async () => {
                await logout()
                toast.success('Logged out successfully')
                router.replace('/login')
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const presetColors = [
  { color: '#22c55e', label: 'Green' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#a855f7', label: 'Purple' },
  { color: '#f97316', label: 'Orange' },
  { color: '#ef4444', label: 'Red' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#eab308', label: 'Yellow' }
]

function AccentColorPicker({
  accentColor,
  onColorChange,
  defaultAccent
}: {
  accentColor: string
  onColorChange: (color: string) => void
  defaultAccent: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const isCustom = !presetColors.some(
    (p) => p.color.toLowerCase() === accentColor.toLowerCase()
  )

  function AccentColorDot() {
    return (
      <span
        className='ml-auto size-3 rounded-full border border-border/50 shadow-sm'
        style={{ backgroundColor: accentColor }}
      />
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger replace={AccentColorDot} className='gap-2'>
        <Palette className='size-4 text-muted-foreground' />
        <span>Accent color</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='min-w-[200px] p-3'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
            Theme
          </span>
          <button
            onClick={() => onColorChange(defaultAccent)}
            className='text-[11px] cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors'
          >
            Reset
          </button>
        </div>
        <div className='grid grid-cols-4 gap-2'>
          {presetColors.map(({ color, label }) => (
            <button
              key={color}
              aria-label={label}
              onClick={() => onColorChange(color)}
              className='group/swatch relative cursor-pointer size-8 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              style={{ backgroundColor: color }}
            >
              {accentColor.toLowerCase() === color.toLowerCase() && (
                <span className='absolute inset-0 flex items-center justify-center'>
                  <svg
                    className='size-3 text-white drop-shadow-sm'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='3'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
        <div className='mt-3 pt-3 border-t border-border/50'>
          <div className='relative'>
            <button
              onClick={() => inputRef.current?.click()}
              className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent'
            >
              <span
                className='size-4 rounded-full border border-dashed border-muted-foreground/40'
                style={{ background: isCustom ? accentColor : undefined }}
              >
                {!isCustom && (
                  <span className='flex items-center justify-center h-full text-[9px] text-muted-foreground'>
                    +
                  </span>
                )}
              </span>
              <span className='text-muted-foreground'>
                {isCustom ? accentColor.toUpperCase() : 'Custom color…'}
              </span>
            </button>
            <input
              ref={inputRef}
              type='color'
              value={accentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className='absolute inset-0 size-full cursor-pointer opacity-0'
              tabIndex={-1}
            />
          </div>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
