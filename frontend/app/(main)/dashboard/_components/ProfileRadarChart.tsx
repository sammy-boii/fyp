'use client'

import { Activity } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { useGetDashboardStats } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo } from 'react'

const chartConfig = {
  count: {
    label: 'Usage',
    color: 'var(--color-chart-4)'
  }
} satisfies ChartConfig

export function ProfileRadarChart() {
  const { data, isLoading } = useGetDashboardStats()

  const chartData = useMemo(() => {
    if (!data?.data?.actionUsageData) return []
    return data.data.actionUsageData
  }, [data])

  const totalActions = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.count, 0)
  }, [chartData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='items-center'>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-4 w-4 text-muted-foreground' />
            Action Usage
          </CardTitle>
          <CardDescription>Loading action data...</CardDescription>
        </CardHeader>
        <CardContent className='pb-0'>
          <Skeleton className='mx-auto aspect-square max-h-[250px] w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='items-center'>
        <CardTitle className='flex items-center gap-2'>
          <Activity className='h-4 w-4 text-muted-foreground' />
          Action Usage
        </CardTitle>
        <CardDescription>
          {totalActions > 0
            ? 'Most used actions in your workflows'
            : 'No action data available'}
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-0'>
        {chartData.length === 0 ? (
          <div className='flex w-full aspect-square max-h-[250px] items-center justify-center text-center text-muted-foreground'>
            <p>Run workflows to see action usage</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='mx-auto aspect-square max-h-[280px]'
          >
            <RadarChart data={chartData} cx='50%' cy='50%' outerRadius='65%'>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <PolarAngleAxis
                dataKey='action'
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <PolarGrid />
              <Radar
                dataKey='count'
                fill='var(--color-count)'
                fillOpacity={0.6}
                dot={{
                  r: 4,
                  fillOpacity: 1
                }}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          {totalActions} total actions executed
        </div>
        <div className='text-muted-foreground flex items-center gap-2 leading-none'>
          Last 90 days
        </div>
      </CardFooter>
    </Card>
  )
}
