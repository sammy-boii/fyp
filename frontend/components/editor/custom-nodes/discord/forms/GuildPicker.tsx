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
  const { watch } = useFormContext()
  const credentialId = watch('credentialId')
  const prevCredentialIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  const [guilds, setGuilds] = useState<Guild[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<string>(value || '')
  const [hasFetched, setHasFetched] = useState(false)

  // Initialize inputValue from value prop (for pre-filled forms)
  useEffect(() => {
    if (!isInitializedRef.current && value) {
      setInputValue(value)
      isInitializedRef.current = true
    }
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
        setError(result.error.message || 'Failed to fetch servers')
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
    // Allow user to type manual ID
    onChange(newValue)
  }

  // Filter guilds based on search
  const filteredGuilds = guilds.filter((guild) =>
    guild.name.toLowerCase().includes(inputValue.toLowerCase())
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
      <Combobox
        value={value}
        onValueChange={handleSelect}
        disabled={disabled}
      >
        <ComboboxInput
          placeholder={placeholder}
          className={cn('h-9 text-sm flex-1', className)}
          value={inputValue}
          onChange={handleInputChange}
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
                {inputValue
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
                      <img
                        src={guild.icon}
                        alt={guild.name}
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
