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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { TooltipContent } from '../ui/tooltip'
import { logout } from '@/actions/auth.actions'
import { toast } from 'sonner'
import { useGetProfile } from '@/hooks/use-user'
import { Kbd } from '../ui/kbd'
import { AnimatedThemeToggler } from '../magicui/animated-theme-toggler'

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
