'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { BarChart3 } from 'lucide-react'
import { useGetDashboardStats } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'

const chartConfig = {
  executions: {
    label: 'Executions'
  },
  completed: {
    label: 'Completed',
    color: 'var(--chart-2)'
  },
  failed: {
    label: 'Failed',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

export function ProfileAreaChart() {
  const [timeRange, setTimeRange] = React.useState('7d')
  const { data, isLoading } = useGetDashboardStats()

  const chartData = React.useMemo(() => {
    if (!data?.data?.executionsOverTime) return []
    return data.data.executionsOverTime
  }, [data])

  const filteredData = React.useMemo(() => {
    if (!chartData.length) return []

    const now = new Date()
    let daysToSubtract = 90
    if (timeRange === '30d') {
      daysToSubtract = 30
    } else if (timeRange === '7d') {
      daysToSubtract = 7
    }

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [chartData, timeRange])

  const totalCompleted = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.completed, 0)
  }, [filteredData])

  const totalFailed = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.failed, 0)
  }, [filteredData])

  if (isLoading) {
    return (
      <Card className='pt-0'>
        <CardHeader className='flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row'>
          <div className='grid flex-1 gap-1'>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-4 w-4 text-muted-foreground' />
              Activity chart
            </CardTitle>
            <CardDescription>Loading execution data...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='pt-0'>
      <CardHeader className='flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1'>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
            Workflow Executions
          </CardTitle>
          <CardDescription>
            {totalCompleted + totalFailed > 0 ? (
              <>
                {totalCompleted} completed, {totalFailed} failed in selected
                period
              </>
            ) : (
              'No executions in selected period'
            )}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className='hidden w-40 rounded-lg sm:ml-auto sm:flex'
            aria-label='Select a value'
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
        {filteredData.length === 0 ||
        (totalCompleted === 0 && totalFailed === 0) ? (
          <div className='flex h-[250px] items-center justify-center text-muted-foreground'>
            <p>No execution data available</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id='fillCompleted' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--color-completed)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-completed)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id='fillFailed' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--color-failed)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-failed)'
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
                tickFormatter={(value: any) => {
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
                    labelFormatter={(value: any) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    }}
                    indicator='dot'
                  />
                }
              />
              <Area
                dataKey='completed'
                type='natural'
                fill='url(#fillCompleted)'
                stroke='var(--color-completed)'
                stackId='a'
              />
              <Area
                dataKey='failed'
                type='natural'
                fill='url(#fillFailed)'
                stroke='var(--color-failed)'
                stackId='a'
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
