'use client'

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
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

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles
} from 'lucide-react'

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

// Menu items.
const items = [
  {
    title: 'Home',
    url: '/',
    icon: Home
  },
  {
    title: 'Inbox',
    url: '/inbox',
    icon: Inbox
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: Calendar
  },
  {
    title: 'Search',
    url: '/search',
    icon: Search
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings
  }
]

export function AppSidebar() {
  const pathName = usePathname()

  const { data } = useGetProfile()

  return (
    <Sidebar collapsible='icon' className='group'>
      <SidebarHeader className='relative'>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link className='flex items-center gap-2 p-2 relative' href='/'>
              {/* Zap icon only visible when collapsed & not hovered */}
              <ZapIcon
                className='
          !size-5 transition-all duration-300
          group-data-[state=collapsed]:opacity-100
          group-data-[state=collapsed]:group-hover:opacity-0
          group-data-[state=expanded]:opacity-100
        '
              />
              {/* Sidebar title only visible when expanded */}
              <span className='font-bold group-data-[state=expanded]:block hidden'>
                Acme Inc.
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathName === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
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
            avatar: data?.data?.avatar || 'https://github.com/shadcn.png'
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
        <Kbd className='!bg-transparent !text-foreground'>Ctrl + B</Kbd>
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
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  const router = useRouter()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size='lg'>
              <Avatar className='h-8 w-8 rounded-lg grayscale'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
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
                  <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
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
