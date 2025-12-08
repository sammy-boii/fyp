'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useGetProfile } from '@/hooks/use-user'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Activity,
  BadgeCheck,
  Link2,
  Pencil,
  ShieldCheck,
  UserRound,
  Workflow
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ProfileAreaChart } from './_components/ProfileAreaChart'
import { ProfileRadarChart } from './_components/ProfileRadarChart'
import { ProfileRadialChart } from './_components/ProfileRadialChart'

const LoadingState = () => (
  <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10'>
    <div className='flex items-center gap-4'>
      <Skeleton className='h-16 w-16 rounded-full' />
      <div className='space-y-2'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-3 w-48' />
      </div>
    </div>
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <Skeleton className='h-36 rounded-xl' />
      <Skeleton className='h-36 rounded-xl' />
      <Skeleton className='h-36 rounded-xl' />
    </div>
    <Skeleton className='h-80 rounded-xl' />
    <div className='grid gap-4 md:grid-cols-2'>
      <Skeleton className='h-64 rounded-xl' />
      <Skeleton className='h-64 rounded-xl' />
    </div>
  </div>
)

const ProfilePage = () => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    avatar: ''
  })
  const { data: profile, isLoading, isError } = useGetProfile()
  const user = profile?.data

  useEffect(() => {
    if (!user) return
    setFormValues({
      name: user.name ?? '',
      email: user.email ?? '',
      avatar: user.avatar ?? ''
    })
  }, [user])

  const formatDate = (value?: string | Date | null) => {
    if (!value) return 'N/A'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading && !user) {
    return <LoadingState />
  }

  if (isError || profile?.error) {
    return (
      <div className='flex h-full items-center justify-center px-6 py-10 text-center text-sm text-destructive md:px-10'>
        Unable to load your profile right now. Please try again in a moment.
      </div>
    )
  }

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10'>
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage
                src={user?.avatar || ''}
                alt={user?.name || 'User'}
              />
              <AvatarFallback>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className=''>
              <h1 className='text-2xl font-semibold leading-tight'>
                {user?.name || 'Your name'}
              </h1>
              <p className='text-sm text-muted-foreground'>
                {user?.email || 'you@example.com'}
              </p>
            </div>
          </div>

          <Dialog>
            <form>
              <DialogTrigger asChild>
                <Button size='sm' className='gap-2'>
                  <Pencil className='h-4 w-4' />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when
                    you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4'>
                  <div className='grid gap-3'>
                    <Label htmlFor='name-1'>Name</Label>
                    <Input
                      id='name-1'
                      name='name'
                      defaultValue='Pedro Duarte'
                    />
                  </div>
                  <div className='grid gap-3'>
                    <Label htmlFor='username-1'>Username</Label>
                    <Input
                      id='username-1'
                      name='username'
                      defaultValue='@peduarte'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline'>Cancel</Button>
                  </DialogClose>
                  <Button type='submit'>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
        </header>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Workflow className='h-4 w-4 text-muted-foreground' />
                Workflows
              </CardTitle>
              <CardDescription>Most recent 5 workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>
                {user?.workflowCount ?? 0}
              </div>
              <p className='text-sm text-muted-foreground'>
                Total created by you
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Link2 className='h-4 w-4 text-muted-foreground' />
                Connected accounts
              </CardTitle>
              <CardDescription>OAuth credentials saved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>
                {user?.credentials?.length ?? 0}
              </div>
              <p className='text-sm text-muted-foreground'>
                Providers linked to this account
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4 text-muted-foreground' />
                Profile health
              </CardTitle>
              <CardDescription>Quick status at a glance</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-1 text-muted-foreground'>
                  <UserRound className='h-3.5 w-3.5' />
                  Avatar
                </span>
                <Badge variant='outline' className='flex items-center gap-1'>
                  <BadgeCheck className='h-3.5 w-3.5' />
                  {user?.avatar ? 'Set' : 'Not set'}
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-1 text-muted-foreground'>
                  <Activity className='h-3.5 w-3.5' />
                  Experience
                </span>
                <Badge variant='secondary' className='capitalize'>
                  {(() => {
                    const count = user?.workflowCount ?? 0
                    if (count >= 20) return 'veteran'
                    if (count >= 10) return 'pro'
                    if (count >= 3) return 'experienced'
                    return 'novice'
                  })()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <ProfileAreaChart />

        <div className='grid gap-4 md:grid-cols-2'>
          <ProfileRadarChart />
          <ProfileRadialChart />
        </div>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your profile details. Save will call your future backend
              hook.
            </DialogDescription>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault()
              // hook your backend call here
              setIsEditOpen(false)
            }}
          >
            <div className='space-y-1.5'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={formValues.name}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formValues.email}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='avatar'>Avatar URL</Label>
              <Input
                id='avatar'
                type='url'
                placeholder='https://...'
                value={formValues.avatar}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, avatar: e.target.value }))
                }
              />
              <p className='text-xs text-muted-foreground'>
                Paste an image URL. Leave blank to fallback to your initial.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                type='button'
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
