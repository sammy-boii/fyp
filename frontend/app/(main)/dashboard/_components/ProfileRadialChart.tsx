'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import * as Recharts from 'recharts'
import { useGetDashboardStats } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo } from 'react'

type RechartsComponents = {
  RadialBarChart: React.ComponentType<any>
  PolarGrid: React.ComponentType<any>
  RadialBar: React.ComponentType<any>
  PolarRadiusAxis: React.ComponentType<any>
  Label: React.ComponentType<any>
}

const { RadialBarChart, PolarGrid, RadialBar, PolarRadiusAxis, Label } =
  Recharts as unknown as RechartsComponents

const chartConfig = {
  rate: {
    label: 'Success Rate'
  },
  success: {
    label: 'Success',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig

export function ProfileRadialChart() {
  const { data, isLoading } = useGetDashboardStats()

  const successData = useMemo(() => {
    if (!data?.data?.successRate) {
      return { rate: 0, total: 0, completed: 0, failed: 0 }
    }
    return data.data.successRate
  }, [data])

  const chartData = useMemo(() => {
    return [
      { name: 'success', rate: successData.rate, fill: 'var(--color-success)' }
    ]
  }, [successData])

  // Calculate end angle based on success rate (0-100 maps to 0-360)
  const endAngle = (successData.rate / 100) * 360

  if (isLoading) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='items-center pb-0'>
          <CardTitle>Success Rate</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0'>
          <Skeleton className='mx-auto aspect-square max-h-[250px] w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle className='flex items-center gap-2'>
          {successData.rate >= 50 ? (
            <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
          ) : (
            <XCircle className='h-4 w-4 text-muted-foreground' />
          )}
          Success Rate
        </CardTitle>
        <CardDescription>
          {successData.total > 0
            ? 'Workflow execution success rate'
            : 'No executions yet'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px]'
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={endAngle}
            innerRadius={80}
            outerRadius={140}
          >
            <PolarGrid
              gridType='circle'
              radialLines={false}
              stroke='none'
              className='first:fill-muted last:fill-background'
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey='rate' background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }: { viewBox: any }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-4xl font-bold'
                        >
                          {successData.rate}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground'
                        >
                          Success
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-4 leading-none font-medium'>
          <span className='flex items-center gap-1 text-green-300'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            {successData.completed} completed
          </span>
          <span className='flex items-center gap-1 text-red-300'>
            <XCircle className='h-3.5 w-3.5' />
            {successData.failed} failed
          </span>
        </div>
        <div className='text-muted-foreground leading-none'>Last 90 days</div>
      </CardFooter>
    </Card>
  )
}
