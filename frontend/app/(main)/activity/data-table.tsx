'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useState } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import type { ActivityExecutionRow } from './types'

interface DataTableProps<TValue> {
  columns: ColumnDef<ActivityExecutionRow, TValue>[]
  data: ActivityExecutionRow[]
}

export function DataTable<TValue>({
  columns,
  data
}: DataTableProps<TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    executionId: false,
    error: false
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true }
  ])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable<ActivityExecutionRow>({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: 'includesString'
  })

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} />
      <Card className='overflow-hidden bg-transparent border-0 shadow-md'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='bg-muted/30 hover:bg-muted/30'
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className='h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                // Safely access row.original with type assertion
                const original = row.original as { status?: string }
                const isRunning = original?.status === 'RUNNING'

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'group transition-all duration-200',
                      'hover:bg-muted/50',
                      isRunning && 'bg-amber-500/5 hover:bg-amber-500/10',
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className='py-4 transition-colors'
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell className='h-32 text-center text-muted-foreground'>
                  <div className='flex flex-col items-center gap-2'>
                    <p className='text-sm font-medium'>No results found</p>
                    <p className='text-xs'>
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <DataTablePagination table={table} />
    </div>
  )
}
