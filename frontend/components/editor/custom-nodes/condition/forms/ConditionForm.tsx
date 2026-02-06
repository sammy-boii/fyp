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
import { Filter, ListChecks, Plus, Trash2, Info } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  CONDITION_OPERATORS,
  OPERATOR_LABELS,
  type ConditionOperator
} from '@/schema/nodes/condition.schema'
import { cn } from '@/lib/utils'

export function ConditionForm() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'conditions'
  })

  const addCondition = () => {
    append({
      field: '',
      operator: CONDITION_OPERATORS.EQUALS,
      value: ''
    })
  }

  // Initialize with one condition if empty
  if (fields.length === 0) {
    addCondition()
  }

  return (
    <div className='space-y-4'>
      {/* Match Type Selection */}
      <Controller
        name='matchType'
        control={control}
        defaultValue='all'
        render={({ field }) => (
          <Field>
            <FieldLabel className='text-xs font-medium flex items-center gap-1.5'>
              <Filter className='h-3 w-3' />
              Matching Criteria
            </FieldLabel>
            <RadioGroup
              value={field.value || 'all'}
              onValueChange={field.onChange}
              className='flex gap-6'
            >
              <div className='flex items-center space-x-1.5'>
                <RadioGroupItem
                  value='all'
                  id='match-all'
                  className='h-3 w-3'
                />
                <Label
                  htmlFor='match-all'
                  className={cn(
                    'text-xs cursor-pointer transition-opacity',
                    field.value !== 'all' && 'opacity-50'
                  )}
                >
                  All must match
                </Label>
              </div>
              <div className='flex items-center space-x-1.5'>
                <RadioGroupItem
                  value='any'
                  id='match-any'
                  className='h-3 w-3'
                />
                <Label
                  htmlFor='match-any'
                  className={cn(
                    'text-xs cursor-pointer transition-opacity',
                    field.value !== 'any' && 'opacity-50'
                  )}
                >
                  Any one can match
                </Label>
              </div>
            </RadioGroup>
          </Field>
        )}
      />

      {/* Conditions List */}
      <div className='space-y-4 mt-8'>
        <div className='flex items-center gap-1.5'>
          <FieldLabel className='text-xs font-medium flex items-center gap-1.5 mb-0'>
            <ListChecks className='h-3 w-3' />
            Conditions
          </FieldLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className='h-3 w-3 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent side='right' className='w-max'>
              <p className='text-xs'>ISO and MDY format dates are supported</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {fields.map((item, index) => (
          <ConditionRow
            key={item.id}
            index={index}
            control={control}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}

        <div className='pt-1'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={addCondition}
            className='w-full h-7 text-xs'
          >
            <Plus className='h-3 w-3 mr-1' />
            Add Condition
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ConditionRowProps {
  index: number
  control: any
  onRemove: () => void
  canRemove: boolean
}

function ConditionRow({
  index,
  control,
  onRemove,
  canRemove
}: ConditionRowProps) {
  const { watch } = useFormContext()
  const operator = watch(`conditions.${index}.operator`)

  // Check if the operator doesn't require a value
  const noValueRequired =
    operator === CONDITION_OPERATORS.IS_EMPTY ||
    operator === CONDITION_OPERATORS.IS_NOT_EMPTY

  return (
    <div className='flex items-center gap-2'>
      {/* Field Input */}
      <Controller
        name={`conditions.${index}.field`}
        control={control}
        render={({ field, fieldState }) => (
          <PlaceholderInput
            placeholder='{{node.field}}'
            className='text-xs h-9 flex-1 min-w-0 px-2.5'
            {...field}
            aria-invalid={fieldState.invalid}
          />
        )}
      />

      {/* Operator Select */}
      <Controller
        name={`conditions.${index}.operator`}
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className='h-7 w-12 px-1'>
              <SelectValue>
                <span
                  className={cn(
                    'inline-flex items-center justify-center px-1 rounded text-[11px]',
                    'bg-muted text-foreground'
                  )}
                >
                  {OPERATOR_LABELS[field.value as ConditionOperator]?.abbr ||
                    '='}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONDITION_OPERATORS).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-5 h-5 rounded text-[11px]',
                        'bg-muted text-foreground'
                      )}
                    >
                      {OPERATOR_LABELS[value]?.abbr}
                    </span>
                    <span className='text-xs'>
                      {OPERATOR_LABELS[value]?.full}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* Value Input */}
      <Controller
        name={`conditions.${index}.value`}
        control={control}
        render={({ field, fieldState }) => (
          <PlaceholderInput
            placeholder={noValueRequired ? '—' : 'Value'}
            className='text-xs h-9 flex-1 min-w-0 px-2.5'
            disabled={noValueRequired}
            {...field}
            value={noValueRequired ? '' : field.value}
            aria-invalid={fieldState.invalid}
          />
        )}
      />

      {/* Remove Button */}
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='size-10 shrink-0 bg-muted/30'
        onClick={onRemove}
        disabled={!canRemove}
      >
        <Trash2 className='size-4 text-muted-foreground' />
      </Button>
    </div>
  )
}
