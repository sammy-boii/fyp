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
import { useGetProfile, useUpdateProfile } from '@/hooks/use-user'
import {
  Activity,
  BadgeCheck,
  Link2,
  Pencil,
  ShieldCheck,
  UserRound,
  User,
  Workflow,
  Save,
  Recycle
} from 'lucide-react'
import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { ProfileAreaChart } from './_components/ProfileAreaChart'
import { ProfileRadarChart } from './_components/ProfileRadarChart'
import { ProfileRadialChart } from './_components/ProfileRadialChart'
import { Dropzone } from '@/components/ui/dropzone'
import { uploadCloudinaryImage } from '@/actions/cloudinary.actions'
import { toast } from 'sonner'
import { ProfileSkeleton } from './_components/ProfileSkeleton'

const DashboardPage = () => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [isPending, startTransition] = useTransition()

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [name, setName] = useState('')

  const [avatar, setAvatar] = useState<string | null>(null)

  const { data: profile, isLoading } = useGetProfile()
  const user = profile?.data

  const { mutateAsync } = useUpdateProfile()

  useEffect(() => {
    if (user?.name) setName(user.name)
    if (user?.avatar) setAvatar(user.avatar)
  }, [user?.name, user?.avatar])

  async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault()

    startTransition(async () => {
      if (name.trim().length === 0) {
        toast.error('Name cannot be empty')
        return
      }

      let res

      if (avatarFile) {
        const { data, error } = await uploadCloudinaryImage(avatarFile)

        if (error) {
          toast.error(error)
          return
        }

        res = await mutateAsync({ name, avatar: data.secure_url })
      } else {
        res = await mutateAsync({ name, avatar: user?.avatar ?? null })
      }

      if (res.error) {
        toast.error('An error occured while updating profile: ' + res.error)
        return
      }

      toast.success('Profile updated successfully')
      setAvatarFile(null)
      setAvatarPreview(null)
      setIsEditOpen(false)
    })
  }

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile)
      setAvatarPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setAvatarPreview(user?.avatar || null)
    }
  }, [avatarFile, user?.avatar])

  const workflowCount = user?.workflowsCount ?? 0

  const experienceLabel = useMemo(() => {
    if (workflowCount >= 20) return 'veteran'
    if (workflowCount >= 10) return 'skilled'
    if (workflowCount >= 3) return 'expert'
    return 'novice'
  }, [workflowCount])

  if (isLoading && !user) {
    return <ProfileSkeleton />
  }

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10'>
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage
                src={user?.avatar || undefined}
                alt={user?.name || 'User'}
              />
              <AvatarFallback className='text-lg'>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className='text-2xl font-semibold'>
                {user?.name || 'Your name'}
              </h1>
              <p className='text-sm text-muted-foreground'>
                {user?.email || 'you@example.com'}
              </p>
            </div>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button size='sm' variant='outline' className='gap-2'>
                <Pencil className='h-4 w-4' />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Update your profile details. Changes show up in the preview
                  instantly.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 md:grid-cols-2'>
                <Card className='border-dashed'>
                  <CardHeader className='flex flex-col gap-2'>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <User className='h-5 w-5 text-muted-foreground' />
                      Profile preview
                    </CardTitle>
                    <CardDescription>
                      Live preview of your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='flex flex-col gap-6 min-h-[300px]'>
                    <div className='flex flex-col items-center gap-4 p-4 rounded-lg bg-muted/30'>
                      <Avatar className='h-20 w-20 ring-2 ring-border'>
                        <AvatarImage
                          src={avatarPreview || undefined}
                          alt={name}
                        />
                        <AvatarFallback className='text-lg'>
                          {name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className='text-center'>
                        <h2 className='text-xl wrap-anywhere font-semibold'>
                          {name || 'Your name'}
                        </h2>
                        <p className='text-sm wrap-anywhere text-muted-foreground mt-1'>
                          {user?.email || 'you@example.com'}
                        </p>
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center justify-center gap-3'>
                      <Badge
                        variant='outline'
                        className='flex items-center gap-2 px-3 py-1.5'
                      >
                        <Activity className='h-4 w-4' />
                        Experience:{' '}
                        <span className='capitalize font-medium'>
                          {experienceLabel}
                        </span>
                      </Badge>
                      <Badge
                        variant='secondary'
                        className='flex items-center gap-2 px-3 py-1.5'
                      >
                        <Workflow className='h-4 w-4' />
                        <span className='font-medium'>
                          {workflowCount} Workflows
                        </span>
                      </Badge>
                    </div>
                    <div className='mt-auto pt-4 border-t'>
                      <Button
                        variant='outline'
                        type='button'
                        className='w-full'
                        onClick={() => {
                          if (!user) return
                          setName(user.name ?? '')
                          setAvatarFile(null)
                          setAvatarPreview(user.avatar ?? '')
                        }}
                      >
                        <Recycle />
                        Reset Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <UserRound className='h-5 w-5 text-muted-foreground' />
                      Edit profile
                    </CardTitle>
                    <CardDescription>
                      Changes show up in the preview instantly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                      <div className='space-y-2'>
                        <Label className='flex items-center gap-2 text-sm font-medium'>
                          <User className='h-4 w-4 text-muted-foreground' />
                          Profile Picture
                        </Label>
                        <Dropzone
                          avatar={avatar}
                          onFileSelect={setAvatarFile}
                          preview={avatarPreview || undefined}
                          forcePreview={Boolean(avatarFile)}
                          className='h-32'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='name'
                          className='flex items-center gap-2 text-sm font-medium'
                        >
                          <UserRound className='h-4 w-4 text-muted-foreground' />
                          Name
                        </Label>
                        <Input
                          id='name'
                          placeholder='Enter your name'
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <DialogFooter className='gap-2'>
                        <DialogClose asChild>
                          <Button
                            disabled={isPending}
                            variant='outline'
                            type='button'
                          >
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          className='w-20'
                          disabled={isPending}
                          isLoading={isPending}
                          type='submit'
                        >
                          <Save />
                          Save
                        </Button>
                      </DialogFooter>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <Card className='relative overflow-hidden border-0 shadow-md ring-1 ring-border transition-all duration-300 hover:shadow-md'>
            <CardHeader className='pb-2'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                  <Workflow className='h-5 w-5 text-primary' />
                </div>
                <div>
                  <CardTitle className='text-base'>Workflows</CardTitle>
                  <CardDescription className='text-xs'>
                    Your automations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>{workflowCount}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                Total created by you
              </p>
            </CardContent>
          </Card>
          <Card className='relative overflow-hidden border-0 shadow-md ring-1 ring-border transition-all duration-300 hover:shadow-md'>
            <CardHeader className='pb-2'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10'>
                  <Link2 className='h-5 w-5 text-blue-500' />
                </div>
                <div>
                  <CardTitle className='text-base'>Connected</CardTitle>
                  <CardDescription className='text-xs'>
                    OAuth credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>
                {user?.credentialsCount ?? 0}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Providers linked
              </p>
            </CardContent>
          </Card>
          <Card className='relative overflow-hidden border-0 shadow-md ring-1 ring-border transition-all duration-300 hover:shadow-md'>
            <CardHeader className='pb-2'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10'>
                  <ShieldCheck className='h-5 w-5 text-emerald-500' />
                </div>
                <div>
                  <CardTitle className='text-base'>Profile</CardTitle>
                  <CardDescription className='text-xs'>
                    Account status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-2.5 text-sm'>
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
                <Badge variant={'default'} className='capitalize'>
                  {(() => {
                    if (workflowCount >= 20) return 'veteran'
                    if (workflowCount >= 10) return 'Skilled'
                    if (workflowCount >= 3) return 'Expert'
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
    </div>
  )
}

export default DashboardPage
