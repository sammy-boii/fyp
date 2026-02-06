'use client'

import type { Table } from '@tanstack/react-table'
import {
  Calendar,
  CheckCircle2,
  Columns3,
  Filter,
  Globe,
  Hand,
  HelpCircle,
  Loader2,
  RotateCcw,
  Search,
  XCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ActivityExecutionRow } from './types'

type FilterOption = {
  label: string
  value: string
  icon?: React.ReactNode
  color?: string
}

const statusOptions: FilterOption[] = [
  {
    label: 'Running',
    value: 'RUNNING',
    icon: <Loader2 className='h-3.5 w-3.5 animate-spin' />,
    color: 'text-amber-500'
  },
  {
    label: 'Completed',
    value: 'COMPLETED',
    icon: <CheckCircle2 className='h-3.5 w-3.5' />,
    color: 'text-emerald-500'
  },
  {
    label: 'Failed',
    value: 'FAILED',
    icon: <XCircle className='h-3.5 w-3.5' />,
    color: 'text-red-500'
  },
  {
    label: 'Cancelled',
    value: 'CANCELLED',
    icon: <XCircle className='h-3.5 w-3.5' />,
    color: 'text-muted-foreground'
  }
]

const triggerOptions: FilterOption[] = [
  {
    label: 'Manual',
    value: 'MANUAL',
    icon: <Hand className='h-3.5 w-3.5' />,
    color: 'text-blue-500'
  },
  {
    label: 'Scheduled',
    value: 'SCHEDULED',
    icon: <Calendar className='h-3.5 w-3.5' />,
    color: 'text-purple-500'
  },
  {
    label: 'Webhook',
    value: 'WEBHOOK',
    icon: <Globe className='h-3.5 w-3.5' />,
    color: 'text-cyan-500'
  },
  {
    label: 'Unknown',
    value: 'UNKNOWN',
    icon: <HelpCircle className='h-3.5 w-3.5' />,
    color: 'text-muted-foreground'
  }
]

export function DataTableToolbar({
  table
}: {
  table: Table<ActivityExecutionRow>
}) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    Boolean(table.getState().globalFilter)

  const filterCount =
    table.getState().columnFilters.reduce((acc, filter) => {
      const value = filter.value as string[] | undefined
      return acc + (Array.isArray(value) ? value.length : 0)
    }, 0) + (table.getState().globalFilter ? 1 : 0)

  return (
    <div className='flex flex-col gap-4 rounded-xl bg-muted/30 p-4 ring-1 ring-border/50 md:flex-row md:items-center md:justify-between'>
      <div className='flex flex-1 flex-wrap items-center gap-3'>
        <div className='relative flex-1 md:max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search workflows, errors...'
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className='h-10 bg-background pl-9 shadow-sm'
          />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <MultiSelectFilter
            title='Status'
            columnId='status'
            options={statusOptions}
            table={table}
          />

          <MultiSelectFilter
            title='Trigger'
            columnId='triggerType'
            options={triggerOptions}
            table={table}
          />

          {isFiltered && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                table.resetColumnFilters()
                table.setGlobalFilter('')
              }}
              className='h-9 gap-1.5 text-muted-foreground hover:text-foreground'
            >
              <RotateCcw className='h-3.5 w-3.5' />
              Reset
              {filterCount > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1 h-5 rounded-full px-1.5 text-[10px]'
                >
                  {filterCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      <ColumnVisibility table={table} />
    </div>
  )
}

function MultiSelectFilter({
  table,
  columnId,
  title,
  options
}: {
  table: Table<ActivityExecutionRow>
  columnId: string
  title: string
  options: FilterOption[]
}) {
  const column = table.getColumn(columnId)
  if (!column) return null

  const selected = (column.getFilterValue() as string[]) ?? []
  const hasSelection = selected.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasSelection ? 'secondary' : 'outline'}
          size='sm'
          className={cn(
            'h-9 gap-2 border-dashed shadow-sm transition-all',
            hasSelection && 'border-primary/50 bg-primary/5'
          )}
        >
          <Filter className='h-3.5 w-3.5' />
          {title}
          {hasSelection && (
            <Badge
              variant='default'
              className='ml-1 h-5 rounded-full px-1.5 text-[10px]'
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-52'>
        <DropdownMenuLabel className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-muted-foreground' />
          Filter by {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const isChecked = selected.includes(option.value)
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isChecked}
              onCheckedChange={(checked) => {
                const next = checked
                  ? [...selected, option.value]
                  : selected.filter((value) => value !== option.value)

                column.setFilterValue(next.length ? next : undefined)
              }}
              className='gap-2'
            >
              <span className={cn('flex items-center gap-2', option.color)}>
                {option.icon}
                {option.label}
              </span>
            </DropdownMenuCheckboxItem>
          )
        })}
        {hasSelection && (
          <>
            <DropdownMenuSeparator />
            <div className='p-1'>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-full justify-start gap-2 text-muted-foreground'
                onClick={() => column.setFilterValue(undefined)}
              >
                <RotateCcw className='h-3.5 w-3.5' />
                Clear filter
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ColumnVisibility({ table }: { table: Table<ActivityExecutionRow> }) {
  const hiddenCount = table
    .getAllColumns()
    .filter((col) => col.getCanHide() && !col.getIsVisible()).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='h-9 gap-2 shadow-sm'>
          <Columns3 className='h-3.5 w-3.5' />
          Columns
          {hiddenCount > 0 && (
            <Badge
              variant='secondary'
              className='ml-1 h-5 rounded-full px-1.5 text-[10px]'
            >
              {hiddenCount} hidden
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        <DropdownMenuLabel className='flex items-center gap-2'>
          <Columns3 className='h-4 w-4 text-muted-foreground' />
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
              className='capitalize'
            >
              {column.id === 'executionId'
                ? 'Execution ID'
                : column.id === 'workflowName'
                  ? 'Workflow'
                  : column.id === 'triggerType'
                    ? 'Trigger'
                    : column.id === 'nodeCount'
                      ? 'Steps'
                      : column.id === 'durationMs'
                        ? 'Duration'
                        : column.id === 'createdAt'
                          ? 'Started'
                          : column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
