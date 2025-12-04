'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useGetProfile } from '@/hooks/use-user'
import { updateProfile, changePassword } from '@/actions/user.actions'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { FaUser } from 'react-icons/fa'
import { IoIosMail } from 'react-icons/io'
import { MdLock, MdEdit } from 'react-icons/md'
import * as Recharts from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional()
    .or(z.literal(''))
})

type TProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  })

type TPasswordForm = z.infer<typeof passwordSchema>

// Local aliases so we can safely use Recharts even if type defs lag behind
const AreaChart = (Recharts as any).AreaChart as React.ComponentType<any>
const Area = (Recharts as any).Area as React.ComponentType<any>
const CartesianGrid = Recharts.CartesianGrid as React.ComponentType<any>
const XAxis = Recharts.XAxis as React.ComponentType<any>
const YAxis = Recharts.YAxis as React.ComponentType<any>
const RadarChart = (Recharts as any).RadarChart as React.ComponentType<any>
const Radar = (Recharts as any).Radar as React.ComponentType<any>
const PolarGrid = Recharts.PolarGrid as React.ComponentType<any>
const PolarAngleAxis = Recharts.PolarAngleAxis as React.ComponentType<any>
const PolarRadiusAxis = Recharts.PolarRadiusAxis as React.ComponentType<any>
const PieChart = (Recharts as any).PieChart as React.ComponentType<any>
const Pie = (Recharts as any).Pie as React.ComponentType<any>
const Cell = (Recharts as any).Cell as React.ComponentType<any>
const RadialBarChart = (Recharts as any)
  .RadialBarChart as React.ComponentType<any>
const RadialBar = (Recharts as any).RadialBar as React.ComponentType<any>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { data: profileResult, isLoading } = useGetProfile()

  const user = profileResult?.data

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isEditingAccount, setIsEditingAccount] = useState(false)

  const profileForm = useForm<TProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      avatar: user?.avatar ?? ''
    }
  })

  const passwordForm = useForm<TPasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (result) => {
      if (result.error) {
        toast.error(result.error.message)
        return
      }

      toast.success('Profile updated successfully')
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => {
      toast.error('Failed to update profile')
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message)
        return
      }

      toast.success('Password updated successfully')
      passwordForm.reset()
    },
    onError: () => {
      toast.error('Failed to update password')
    }
  })

  async function onSubmitProfile(data: TProfileForm) {
    if (!user) return
    setIsSavingProfile(true)
    await updateProfileMutation.mutateAsync({
      name: data.name,
      avatar: data.avatar || null
    })
    setIsSavingProfile(false)
  }

  async function onSubmitPassword(data: TPasswordForm) {
    setIsSavingPassword(true)
    await changePasswordMutation.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })
    setIsSavingPassword(false)
  }

  const avatarPreview: string =
    profileForm.watch('avatar') ||
    user?.avatar ||
    'https://github.com/shadcn.png'

  // Radar, pie, and radial chart demo data
  const radarData = [
    { metric: 'Automation', score: 95 },
    { metric: 'Reliability', score: 88 },
    { metric: 'Scalability', score: 80 },
    { metric: 'Security', score: 92 },
    { metric: 'Integrations', score: 86 }
  ]

  const pieData = [
    { name: 'Active', value: 45 },
    { name: 'Paused', value: 25 },
    { name: 'Draft', value: 18 },
    { name: 'Archived', value: 12 }
  ]

  const radialData = [{ name: 'Usage', value: 72, fill: '#a855f7' }]

  return (
    <div className='w-full h-full flex items-start justify-center p-6 md:p-8'>
      <div className='w-full max-w-6xl space-y-6'>
        {/* Top profile header */}
        <Card>
          <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <Avatar className='h-16 w-16 rounded-xl'>
                  <AvatarImage src={avatarPreview} alt={user?.name ?? 'User'} />
                  <AvatarFallback className='rounded-xl'>
                    {(user?.name ?? 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Profile picture upload – logic can be wired later */}
                <label className='absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-sm transition hover:bg-accent'>
                  <MdEdit className='h-3.5 w-3.5 text-muted-foreground' />
                  <input type='file' accept='image/*' className='hidden' />
                </label>
              </div>
              <div>
                <CardTitle className='text-primary text-xl md:text-2xl'>
                  {user?.name ?? 'Your profile'}
                </CardTitle>
                <CardDescription className='flex items-center gap-2 mt-1'>
                  <IoIosMail className='text-muted-foreground' size={14} />
                  <span>{user?.email ?? 'm@example.com'}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile details – display vs edit */}
        <Card>
          <CardHeader className='flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-1'>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>
                View and edit your basic account information.
              </CardDescription>
            </div>
            <Button
              type='button'
              size='icon'
              variant={isEditingAccount ? 'default' : 'outline'}
              className='shrink-0'
              onClick={() => setIsEditingAccount((prev) => !prev)}
            >
              <MdEdit className='h-4 w-4' />
            </Button>
          </CardHeader>
          <CardContent className='space-y-6'>
            {!isEditingAccount ? (
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Name
                  </p>
                  <p className='mt-1 text-sm font-medium'>
                    {user?.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Email
                  </p>
                  <p className='mt-1 text-sm font-medium'>
                    {user?.email || 'm@example.com'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Avatar URL
                  </p>
                  <p className='mt-1 text-sm font-medium truncate'>
                    {user?.avatar || 'Using default avatar'}
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-8'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground mb-3'>
                    Profile
                  </p>
                  <Form {...profileForm}>
                    <form
                      className='grid gap-4 md:grid-cols-2'
                      onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                    >
                      <FormField
                        control={profileForm.control}
                        name='name'
                        render={({ field }) => (
                          <FormItem className='md:col-span-1'>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <div className='relative group'>
                                <FaUser
                                  size={15}
                                  className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[10px]'
                                />
                                <Input
                                  className='pl-10'
                                  placeholder='John Doe'
                                  {...field}
                                  disabled={isSavingProfile || isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name='avatar'
                        render={({ field }) => (
                          <FormItem className='md:col-span-1'>
                            <FormLabel>Profile picture URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='https://example.com/avatar.png'
                                {...field}
                                disabled={isSavingProfile || isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='md:col-span-2 flex items-center justify-end gap-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          className='w-full md:w-auto'
                          onClick={() => {
                            profileForm.reset({
                              name: user?.name ?? '',
                              avatar: user?.avatar ?? ''
                            })
                            setIsEditingAccount(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type='submit'
                          disabled={isSavingProfile || isLoading}
                          className={cn('w-full md:w-auto')}
                        >
                          Save changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>

                <Separator />

                <div>
                  <p className='text-xs font-medium text-muted-foreground mb-3'>
                    Password
                  </p>
                  <Form {...passwordForm}>
                    <form
                      className='grid gap-4 md:grid-cols-3'
                      onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                    >
                      <FormField
                        control={passwordForm.control}
                        name='currentPassword'
                        render={({ field }) => (
                          <FormItem className='md:col-span-1'>
                            <FormLabel>Current password</FormLabel>
                            <FormControl>
                              <div className='relative group'>
                                <MdLock
                                  size={18}
                                  className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                                />
                                <Input
                                  type='password'
                                  className='pl-10'
                                  placeholder='Enter current password'
                                  {...field}
                                  disabled={isSavingPassword}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name='newPassword'
                        render={({ field }) => (
                          <FormItem className='md:col-span-1'>
                            <FormLabel>New password</FormLabel>
                            <FormControl>
                              <div className='relative group'>
                                <MdLock
                                  size={18}
                                  className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                                />
                                <Input
                                  type='password'
                                  className='pl-10'
                                  placeholder='Enter new password'
                                  {...field}
                                  disabled={isSavingPassword}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name='confirmPassword'
                        render={({ field }) => (
                          <FormItem className='md:col-span-1'>
                            <FormLabel>Confirm new password</FormLabel>
                            <FormControl>
                              <div className='relative group'>
                                <MdLock
                                  size={18}
                                  className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                                />
                                <Input
                                  type='password'
                                  className='pl-10'
                                  placeholder='Confirm new password'
                                  {...field}
                                  disabled={isSavingPassword}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='md:col-span-3 flex items-center justify-end gap-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          className={cn('w-full md:w-auto')}
                          onClick={() => {
                            passwordForm.reset()
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          type='submit'
                          variant='outline'
                          disabled={isSavingPassword}
                          className={cn('w-full md:w-auto')}
                        >
                          Update password
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full-width interactive area chart */}
        <ProfileAreaChart />

        {/* Bottom analytics: radar, pie, radial charts */}
        <div className='grid gap-6 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>Capability radar</CardTitle>
              <CardDescription>
                How your workspace scores across key dimensions.
              </CardDescription>
            </CardHeader>
            <CardContent className='h-72'>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey='metric' />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name='Score'
                  dataKey='score'
                  stroke='#a855f7'
                  fill='#a855f7'
                  fillOpacity={0.35}
                />
              </RadarChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow states</CardTitle>
              <CardDescription>Distribution of your workflows.</CardDescription>
            </CardHeader>
            <CardContent className='h-72'>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => {
                    const colors = ['#a855f7', '#c4b5fd', '#f97316', '#22c55e']
                    return (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    )
                  })}
                </Pie>
              </PieChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage radial</CardTitle>
              <CardDescription>Overall workspace activity.</CardDescription>
            </CardHeader>
            <CardContent className='h-72 flex items-center justify-center'>
              <RadialBarChart
                width={220}
                height={220}
                cx='50%'
                cy='50%'
                innerRadius={70}
                outerRadius={100}
                barSize={14}
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background
                  clockWise
                  dataKey='value'
                  cornerRadius={999}
                />
              </RadialBarChart>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Full-width interactive area chart copied from the provided example, adapted to local aliases
const profileChartData = [
  { date: '2024-04-01', desktop: 222, mobile: 150 },
  { date: '2024-04-02', desktop: 97, mobile: 180 },
  { date: '2024-04-03', desktop: 167, mobile: 120 },
  { date: '2024-04-04', desktop: 242, mobile: 260 },
  { date: '2024-04-05', desktop: 373, mobile: 290 },
  { date: '2024-04-06', desktop: 301, mobile: 340 },
  { date: '2024-04-07', desktop: 245, mobile: 180 },
  { date: '2024-04-08', desktop: 409, mobile: 320 },
  { date: '2024-04-09', desktop: 59, mobile: 110 },
  { date: '2024-04-10', desktop: 261, mobile: 190 },
  { date: '2024-04-11', desktop: 327, mobile: 350 },
  { date: '2024-04-12', desktop: 292, mobile: 210 },
  { date: '2024-04-13', desktop: 342, mobile: 380 },
  { date: '2024-04-14', desktop: 137, mobile: 220 },
  { date: '2024-04-15', desktop: 120, mobile: 170 },
  { date: '2024-04-16', desktop: 138, mobile: 190 },
  { date: '2024-04-17', desktop: 446, mobile: 360 },
  { date: '2024-04-18', desktop: 364, mobile: 410 },
  { date: '2024-04-19', desktop: 243, mobile: 180 },
  { date: '2024-04-20', desktop: 89, mobile: 150 },
  { date: '2024-04-21', desktop: 137, mobile: 200 },
  { date: '2024-04-22', desktop: 224, mobile: 170 },
  { date: '2024-04-23', desktop: 138, mobile: 230 },
  { date: '2024-04-24', desktop: 387, mobile: 290 },
  { date: '2024-04-25', desktop: 215, mobile: 250 },
  { date: '2024-04-26', desktop: 75, mobile: 130 },
  { date: '2024-04-27', desktop: 383, mobile: 420 },
  { date: '2024-04-28', desktop: 122, mobile: 180 },
  { date: '2024-04-29', desktop: 315, mobile: 240 },
  { date: '2024-04-30', desktop: 454, mobile: 380 },
  { date: '2024-05-01', desktop: 165, mobile: 220 },
  { date: '2024-05-02', desktop: 293, mobile: 310 },
  { date: '2024-05-03', desktop: 247, mobile: 190 },
  { date: '2024-05-04', desktop: 385, mobile: 420 },
  { date: '2024-05-05', desktop: 481, mobile: 390 },
  { date: '2024-05-06', desktop: 498, mobile: 520 },
  { date: '2024-05-07', desktop: 388, mobile: 300 },
  { date: '2024-05-08', desktop: 149, mobile: 210 },
  { date: '2024-05-09', desktop: 227, mobile: 180 },
  { date: '2024-05-10', desktop: 293, mobile: 330 },
  { date: '2024-05-11', desktop: 335, mobile: 270 },
  { date: '2024-05-12', desktop: 197, mobile: 240 },
  { date: '2024-05-13', desktop: 197, mobile: 160 },
  { date: '2024-05-14', desktop: 448, mobile: 490 },
  { date: '2024-05-15', desktop: 473, mobile: 380 },
  { date: '2024-05-16', desktop: 338, mobile: 400 },
  { date: '2024-05-17', desktop: 499, mobile: 420 },
  { date: '2024-05-18', desktop: 315, mobile: 350 },
  { date: '2024-05-19', desktop: 235, mobile: 180 },
  { date: '2024-05-20', desktop: 177, mobile: 230 },
  { date: '2024-05-21', desktop: 82, mobile: 140 },
  { date: '2024-05-22', desktop: 81, mobile: 120 },
  { date: '2024-05-23', desktop: 252, mobile: 290 },
  { date: '2024-05-24', desktop: 294, mobile: 220 },
  { date: '2024-05-25', desktop: 201, mobile: 250 },
  { date: '2024-05-26', desktop: 213, mobile: 170 },
  { date: '2024-05-27', desktop: 420, mobile: 460 },
  { date: '2024-05-28', desktop: 233, mobile: 190 },
  { date: '2024-05-29', desktop: 78, mobile: 130 },
  { date: '2024-05-30', desktop: 340, mobile: 280 },
  { date: '2024-05-31', desktop: 178, mobile: 230 },
  { date: '2024-06-01', desktop: 178, mobile: 200 },
  { date: '2024-06-02', desktop: 470, mobile: 410 },
  { date: '2024-06-03', desktop: 103, mobile: 160 },
  { date: '2024-06-04', desktop: 439, mobile: 380 },
  { date: '2024-06-05', desktop: 88, mobile: 140 },
  { date: '2024-06-06', desktop: 294, mobile: 250 },
  { date: '2024-06-07', desktop: 323, mobile: 370 },
  { date: '2024-06-08', desktop: 385, mobile: 320 },
  { date: '2024-06-09', desktop: 438, mobile: 480 },
  { date: '2024-06-10', desktop: 155, mobile: 200 },
  { date: '2024-06-11', desktop: 92, mobile: 150 },
  { date: '2024-06-12', desktop: 492, mobile: 420 },
  { date: '2024-06-13', desktop: 81, mobile: 130 },
  { date: '2024-06-14', desktop: 426, mobile: 380 },
  { date: '2024-06-15', desktop: 307, mobile: 350 },
  { date: '2024-06-16', desktop: 371, mobile: 310 },
  { date: '2024-06-17', desktop: 475, mobile: 520 },
  { date: '2024-06-18', desktop: 107, mobile: 170 },
  { date: '2024-06-19', desktop: 341, mobile: 290 },
  { date: '2024-06-20', desktop: 408, mobile: 450 },
  { date: '2024-06-21', desktop: 169, mobile: 210 },
  { date: '2024-06-22', desktop: 317, mobile: 270 },
  { date: '2024-06-23', desktop: 480, mobile: 530 },
  { date: '2024-06-24', desktop: 132, mobile: 180 },
  { date: '2024-06-25', desktop: 141, mobile: 190 },
  { date: '2024-06-26', desktop: 434, mobile: 380 },
  { date: '2024-06-27', desktop: 448, mobile: 490 },
  { date: '2024-06-28', desktop: 149, mobile: 200 },
  { date: '2024-06-29', desktop: 103, mobile: 160 },
  { date: '2024-06-30', desktop: 446, mobile: 400 }
]

const profileChartConfig: ChartConfig = {
  visitors: {
    label: 'Visitors'
  },
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)'
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)'
  }
}

function ProfileAreaChart() {
  const [timeRange, setTimeRange] = useState('90d')

  const filteredData = profileChartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date('2024-06-30')

    let daysToSubtract = 90
    if (timeRange === '30d') {
      daysToSubtract = 30
    } else if (timeRange === '7d') {
      daysToSubtract = 7
    }

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return date >= startDate
  })

  return (
    <Card className='pt-0'>
      <CardHeader className='flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1'>
          <CardTitle>Workspace traffic</CardTitle>
          <CardDescription>
            Showing desktop and mobile visits over time.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className='hidden w-[160px] rounded-lg sm:ml-auto sm:flex'
            aria-label='Select a time range'
          >
            <SelectValue placeholder='Last 3 months' />
          </SelectTrigger>
          <SelectContent className='rounded-xl'>
            <SelectItem value='90d' className='rounded-lg'>
              Last 3 months
            </SelectItem>
            <SelectItem value='30d' className='rounded-lg'>
              Last 30 days
            </SelectItem>
            <SelectItem value='7d' className='rounded-lg'>
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={profileChartConfig}
          className='aspect-auto h-[260px] w-full md:h-[320px]'
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id='fillDesktop' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-desktop)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-desktop)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillMobile' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-mobile)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-mobile)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric'
                      }
                    )
                  }}
                  indicator='dot'
                />
              }
            />
            <Area
              dataKey='mobile'
              type='natural'
              fill='url(#fillMobile)'
              stroke='var(--color-mobile)'
              stackId='a'
            />
            <Area
              dataKey='desktop'
              type='natural'
              fill='url(#fillDesktop)'
              stroke='var(--color-desktop)'
              stackId='a'
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
