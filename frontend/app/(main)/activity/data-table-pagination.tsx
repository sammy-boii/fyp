'use client'

import type { Table } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const totalRows = table.getFilteredRowModel().rows.length
  const pageSize = table.getState().pagination.pageSize
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className='flex flex-col items-center justify-between gap-4 rounded-xl bg-muted/30 p-4 ring-1 ring-border/50 md:flex-row'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <LayoutGrid className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm text-muted-foreground'>
            Showing{' '}
            <span className='font-medium text-foreground'>
              {totalRows > 0 ? startRow : 0}-{endRow}
            </span>{' '}
            of <span className='font-medium text-foreground'>{totalRows}</span>{' '}
            results
          </span>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-4'>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Rows per page</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className='h-9 w-[70px] shadow-sm'>
              <SelectValue placeholder={`${pageSize}`} />
            </SelectTrigger>
            <SelectContent align='center'>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='h-9 w-9 shadow-sm'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label='First page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='h-9 w-9 shadow-sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label='Previous page'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <div className='flex items-center gap-2 px-2'>
            <Badge
              variant='secondary'
              className='h-9 min-w-16 justify-center rounded-md px-3 font-medium'
            >
              {pageIndex + 1} / {pageCount || 1}
            </Badge>
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-9 w-9 shadow-sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label='Next page'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='h-9 w-9 shadow-sm'
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label='Last page'
          >
            <ChevronsRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
