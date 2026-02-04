'use client'

import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { Field, FieldLabel } from '@/components/ui/field'
import { PlaceholderInput } from '@/components/ui/placeholder-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Globe,
  Plus,
  Trash2,
  FileJson,
  Link2,
  FileText,
  Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  HTTP_METHODS,
  CONTENT_TYPES,
  type HTTPMethod,
  type ContentType
} from '@/schema/nodes/http.schema'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useState } from 'react'

const METHOD_COLORS: Record<HTTPMethod, string> = {
  GET: 'bg-green-500/20 text-green-600 dark:text-green-400',
  POST: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  PATCH: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  DELETE: 'bg-red-500/20 text-red-600 dark:text-red-400'
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'application/json': 'JSON',
  'application/x-www-form-urlencoded': 'Form URL Encoded',
  'multipart/form-data': 'Multipart Form',
  'text/plain': 'Plain Text',
  'application/xml': 'XML'
}

export function HTTPRequestForm() {
  const { control, watch } = useFormContext()
  const method = watch('method') as HTTPMethod
  const [headersOpen, setHeadersOpen] = useState(false)
  const [paramsOpen, setParamsOpen] = useState(false)

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader
  } = useFieldArray({
    control,
    name: 'headers'
  })

  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam
  } = useFieldArray({
    control,
    name: 'queryParams'
  })

  const showBody = method !== 'GET'

  return (
    <div className='space-y-4'>
      {/* Method & URL */}
      <div className='flex gap-2'>
        <Controller
          name='method'
          control={control}
          defaultValue='GET'
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='w-28 h-9'>
                <SelectValue>
                  <div
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      METHOD_COLORS[field.value as HTTPMethod]
                    )}
                  >
                    {field.value}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(HTTP_METHODS).map((m) => (
                  <SelectItem key={m} value={m}>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold',
                        METHOD_COLORS[m]
                      )}
                    >
                      {m}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        <Controller
          name='url'
          control={control}
          defaultValue=''
          render={({ field, fieldState }) => (
            <div className='flex-1'>
              <PlaceholderInput
                placeholder='https://api.example.com/endpoint'
                className='text-sm h-9'
                {...field}
                aria-invalid={fieldState.invalid}
              />
            </div>
          )}
        />
      </div>

      {/* Headers */}
      <Collapsible open={headersOpen} onOpenChange={setHeadersOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='w-full justify-between h-8 px-2'
          >
            <span className='flex items-center gap-1.5 text-xs font-medium'>
              <Settings2 className='h-3 w-3' />
              Headers
              {headerFields.length > 0 && (
                <span className='bg-muted px-1.5 py-0.5 rounded text-[10px]'>
                  {headerFields.length}
                </span>
              )}
            </span>
            <Plus className='h-3 w-3' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 pt-2'>
          {headerFields.map((item, index) => (
            <div key={item.id} className='flex gap-2'>
              <Controller
                name={`headers.${index}.key`}
                control={control}
                render={({ field }) => (
                  <PlaceholderInput
                    placeholder='Header name'
                    className='text-xs h-8 flex-1'
                    {...field}
                  />
                )}
              />
              <Controller
                name={`headers.${index}.value`}
                control={control}
                render={({ field }) => (
                  <PlaceholderInput
                    placeholder='Value'
                    className='text-xs h-8 flex-1'
                    {...field}
                  />
                )}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0'
                onClick={() => removeHeader(index)}
              >
                <Trash2 className='h-3 w-3 text-muted-foreground' />
              </Button>
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='w-full h-7 text-xs'
            onClick={() => appendHeader({ key: '', value: '' })}
          >
            <Plus className='h-3 w-3 mr-1' />
            Add Header
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Query Params */}
      <Collapsible open={paramsOpen} onOpenChange={setParamsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='w-full justify-between h-8 px-2'
          >
            <span className='flex items-center gap-1.5 text-xs font-medium'>
              <Link2 className='h-3 w-3' />
              Query Parameters
              {paramFields.length > 0 && (
                <span className='bg-muted px-1.5 py-0.5 rounded text-[10px]'>
                  {paramFields.length}
                </span>
              )}
            </span>
            <Plus className='h-3 w-3' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 pt-2'>
          {paramFields.map((item, index) => (
            <div key={item.id} className='flex gap-2'>
              <Controller
                name={`queryParams.${index}.key`}
                control={control}
                render={({ field }) => (
                  <PlaceholderInput
                    placeholder='Parameter'
                    className='text-xs h-8 flex-1'
                    {...field}
                  />
                )}
              />
              <Controller
                name={`queryParams.${index}.value`}
                control={control}
                render={({ field }) => (
                  <PlaceholderInput
                    placeholder='Value'
                    className='text-xs h-8 flex-1'
                    {...field}
                  />
                )}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0'
                onClick={() => removeParam(index)}
              >
                <Trash2 className='h-3 w-3 text-muted-foreground' />
              </Button>
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='w-full h-7 text-xs'
            onClick={() => appendParam({ key: '', value: '' })}
          >
            <Plus className='h-3 w-3 mr-1' />
            Add Parameter
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Body Section (only for non-GET methods) */}
      {showBody && (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <FieldLabel className='text-xs font-medium flex items-center gap-1.5 mb-0'>
              <FileText className='h-3 w-3' />
              Request Body
            </FieldLabel>
            <Controller
              name='contentType'
              control={control}
              defaultValue='application/json'
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className='h-7 w-32 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTENT_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={value} className='text-xs'>
                        {CONTENT_TYPE_LABELS[value as ContentType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Controller
            name='body'
            control={control}
            defaultValue=''
            render={({ field }) => (
              <Textarea
                placeholder={
                  watch('contentType') === 'application/json'
                    ? '{\n  "key": "value"\n}'
                    : 'Enter request body...'
                }
                className='min-h-[100px] text-xs font-mono'
                {...field}
              />
            )}
          />
        </div>
      )}

      {/* Tips */}
      <div className='rounded-md bg-muted/50 p-3 text-xs text-muted-foreground'>
        <p className='font-medium mb-1 flex items-center gap-1'>
          <Globe className='h-3 w-3' />
          Tips:
        </p>
        <ul className='list-disc list-inside space-y-0.5'>
          <li>JSON body will be automatically stringified</li>
        </ul>
      </div>
    </div>
  )
}
