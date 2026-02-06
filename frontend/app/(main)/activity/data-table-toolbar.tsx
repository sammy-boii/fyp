'use client'

import type { Table } from '@tanstack/react-table'
import { Filter, SlidersHorizontal, X } from 'lucide-react'

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
}

const statusOptions: FilterOption[] = [
  { label: 'Running', value: 'RUNNING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Cancelled', value: 'CANCELLED' }
]

const triggerOptions: FilterOption[] = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: 'Unknown', value: 'UNKNOWN' }
]

export function DataTableToolbar({
  table
}: {
  table: Table<ActivityExecutionRow>
}) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    Boolean(table.getState().globalFilter)

  return (
    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='Search executions, workflows, or errors...'
          value={(table.getState().globalFilter as string) ?? ''}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className='h-9 w-full md:w-[320px]'
        />

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

        {isFiltered ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className='gap-1'
          >
            <X className='h-3.5 w-3.5' />
            Reset
          </Button>
        ) : null}
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Filter className='h-3.5 w-3.5' />
          {title}
          {selected.length > 0 ? (
            <Badge variant='secondary' className='rounded-full px-1.5'>
              {selected.length}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-44'>
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
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
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ColumnVisibility({ table }: { table: Table<ActivityExecutionRow> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <SlidersHorizontal className='h-3.5 w-3.5' />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
              className={cn('capitalize', column.id === 'executionId' && 'font-mono')}
            >
              {column.id === 'executionId'
                ? 'Execution ID'
                : column.id.replace(/([A-Z])/g, ' $1')}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
