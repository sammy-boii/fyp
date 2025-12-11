import { Skeleton } from '@/components/ui/skeleton'

export const ProfileSkeleton = () => (
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
