'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { listGuilds, Guild } from '@/actions/discord.actions'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Loader2, Server, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { usePlaceholderResolver } from '@/components/ui/placeholder-input'
import {
  formatPlaceholderForDisplay,
  extractLeadingCanonicalPlaceholders
} from '@/lib/placeholder-utils'

interface GuildPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
}

export function GuildPicker({
  value,
  onChange,
  placeholder = 'Select or type server ID...',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid
}: GuildPickerProps) {
  const { resolveNodeLabel } = usePlaceholderResolver()
  const { watch } = useFormContext()
  const credentialId = watch('credentialId')
  const prevCredentialIdRef = useRef<string | null>(null)

  const [guilds, setGuilds] = useState<Guild[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const initialPlaceholderParts = extractLeadingCanonicalPlaceholders(
    value || ''
  )
  const [inputValue, setInputValue] = useState<string>(
    initialPlaceholderParts.remainder
  )
  const [hasFetched, setHasFetched] = useState(false)
  const { tokens: leadingPlaceholderTokens } =
    extractLeadingCanonicalPlaceholders(value || '')
  const leadingPlaceholderPrefix = leadingPlaceholderTokens.join('')
  const isPlaceholderValue = leadingPlaceholderTokens.length > 0
  const placeholderDisplayValues = leadingPlaceholderTokens.map((token) =>
    formatPlaceholderForDisplay(token, resolveNodeLabel)
  )

  // Keep editable suffix in sync with controlled form value.
  useEffect(() => {
    const { remainder } = extractLeadingCanonicalPlaceholders(value || '')
    setInputValue(remainder)
  }, [value])

  const fetchGuilds = useCallback(() => {
    if (!credentialId) {
      setGuilds([])
      setError(null)
      return
    }

    startTransition(async () => {
      setError(null)
      const result = await listGuilds(credentialId)

      if (result.error) {
        setError(result.error || 'Failed to fetch servers')
        setGuilds([])
      } else {
        setGuilds(result.data || [])
      }
      setHasFetched(true)
    })
  }, [credentialId])

  // Only fetch when credential actually CHANGES to a different value (not on mount)
  useEffect(() => {
    if (prevCredentialIdRef.current === null) {
      prevCredentialIdRef.current = credentialId || ''
      return
    }

    if (credentialId && credentialId !== prevCredentialIdRef.current) {
      setHasFetched(false)
      setInputValue('')
      onChange('')
      fetchGuilds()
      prevCredentialIdRef.current = credentialId
    } else if (!credentialId && prevCredentialIdRef.current) {
      setGuilds([])
      setInputValue('')
      setHasFetched(false)
      prevCredentialIdRef.current = ''
    }
  }, [credentialId, onChange, fetchGuilds])

  const handleRefresh = () => {
    fetchGuilds()
  }

  const handleSelect = (selectedValue: string | null) => {
    if (!selectedValue) return

    const guild = guilds.find((g) => g.id === selectedValue)
    if (!guild) {
      // User typed a manual ID
      onChange(selectedValue)
      return
    }

    onChange(guild.id)
    setInputValue(guild.name)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (leadingPlaceholderPrefix) {
      onChange(`${leadingPlaceholderPrefix}${newValue}`)
      return
    }

    // Allow user to type manual ID.
    onChange(newValue)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!leadingPlaceholderPrefix) return

    // If only the token remains, allow quick clear with delete keys.
    if (
      (e.key === 'Backspace' || e.key === 'Delete') &&
      inputValue.length === 0
    ) {
      e.preventDefault()
      setInputValue('')
      onChange('')
    }
  }

  // Filter guilds based on search
  const searchValue = inputValue
  const filteredGuilds = guilds.filter((guild) =>
    guild.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  if (!credentialId) {
    return (
      <div className='flex items-center gap-2'>
        <Combobox disabled>
          <ComboboxInput
            placeholder='Select a credential first'
            className={cn('h-9 text-sm flex-1', className)}
            disabled
          />
        </Combobox>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-2'>
      <Combobox value={value} onValueChange={handleSelect} disabled={disabled}>
        <ComboboxInput
          placeholder={placeholder}
          className={cn('h-9 text-sm flex-1', className)}
          leadingAddon={
            isPlaceholderValue ? (
              <div className='flex max-w-44 items-center gap-1 overflow-hidden'>
                {placeholderDisplayValues.map((displayValue, index) => (
                  <span
                    key={`${leadingPlaceholderTokens[index]}-${index}`}
                    className='inline-flex min-w-0 items-center truncate rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  >
                    {displayValue}
                  </span>
                ))}
              </div>
            ) : undefined
          }
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          aria-invalid={ariaInvalid}
          disabled={disabled}
        />
        <ComboboxContent>
          <ComboboxList>
            {isPending ? (
              <div className='flex items-center justify-center gap-2 py-4 px-2'>
                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>
                  Loading...
                </span>
              </div>
            ) : error ? (
              <div className='py-4 px-2 text-sm text-destructive text-center'>
                {error}
              </div>
            ) : !hasFetched ? (
              <div className='py-4 px-2 text-sm text-muted-foreground text-center'>
                Click refresh to load servers
              </div>
            ) : filteredGuilds.length === 0 ? (
              <ComboboxEmpty>
                {searchValue
                  ? 'No matches found. Using as ID.'
                  : 'No servers found'}
              </ComboboxEmpty>
            ) : (
              filteredGuilds.map((guild) => (
                <ComboboxItem
                  key={guild.id}
                  value={guild.id}
                  className='cursor-pointer py-2.5 px-3'
                >
                  <div className='flex items-center gap-3'>
                    {guild.icon ? (
                      <Image
                        src={guild.icon}
                        alt={guild.name}
                        width={24}
                        height={24}
                        className='h-6 w-6 rounded-md'
                      />
                    ) : (
                      <Server className='h-5 w-5 text-muted-foreground' />
                    )}
                    <span className='truncate max-w-[200px]'>{guild.name}</span>
                  </div>
                </ComboboxItem>
              ))
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <Button
        type='button'
        variant='outline'
        size='icon'
        className='h-9 w-9 shrink-0'
        onClick={handleRefresh}
        disabled={isPending || !credentialId}
      >
        <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
      </Button>
    </div>
  )
}
