'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { listGuildMembers, GuildMember } from '@/actions/discord.actions'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Loader2, User, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface UserPickerProps {
  value: string
  onChange: (value: string) => void
  guildId?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
}

export function UserPicker({
  value,
  onChange,
  guildId,
  placeholder = 'Select or type user ID...',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid
}: UserPickerProps) {
  const { watch } = useFormContext()
  const credentialId = watch('credentialId')
  const watchedGuildId = watch('guildId') || guildId
  const prevGuildIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  const [members, setMembers] = useState<GuildMember[]>([])
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

  const fetchMembers = useCallback(() => {
    if (!credentialId || !watchedGuildId) {
      setMembers([])
      setError(null)
      return
    }

    startTransition(async () => {
      setError(null)
      const result = await listGuildMembers(credentialId, watchedGuildId)

      if (result.error) {
        setError(result.error.message || 'Failed to fetch members')
        setMembers([])
      } else {
        setMembers(result.data || [])
      }
      setHasFetched(true)
    })
  }, [credentialId, watchedGuildId])

  // Fetch when guildId changes
  useEffect(() => {
    if (prevGuildIdRef.current === null) {
      prevGuildIdRef.current = watchedGuildId || ''
      return
    }

    if (watchedGuildId && watchedGuildId !== prevGuildIdRef.current) {
      setHasFetched(false)
      setInputValue('')
      onChange('')
      fetchMembers()
      prevGuildIdRef.current = watchedGuildId
    } else if (!watchedGuildId && prevGuildIdRef.current) {
      setMembers([])
      setInputValue('')
      setHasFetched(false)
      prevGuildIdRef.current = ''
    }
  }, [watchedGuildId, onChange, fetchMembers])

  const handleRefresh = () => {
    fetchMembers()
  }

  const handleSelect = (selectedValue: string | null) => {
    if (!selectedValue) return

    const member = members.find((m) => m.id === selectedValue)
    if (!member) {
      // User typed a manual ID
      onChange(selectedValue)
      return
    }

    onChange(member.id)
    setInputValue(member.displayName)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Allow user to type manual ID
    onChange(newValue)
  }

  // Filter members based on search
  const filteredMembers = members.filter(
    (member) =>
      member.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
      member.username.toLowerCase().includes(inputValue.toLowerCase())
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

  if (!watchedGuildId) {
    return (
      <div className='flex items-center gap-2'>
        <Combobox disabled>
          <ComboboxInput
            placeholder='Select a server first'
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
                Click refresh to load members
              </div>
            ) : filteredMembers.length === 0 ? (
              <ComboboxEmpty>
                {inputValue
                  ? 'No matches found. Using as ID.'
                  : 'No members found'}
              </ComboboxEmpty>
            ) : (
              filteredMembers.map((member) => (
                <ComboboxItem
                  key={member.id}
                  value={member.id}
                  className='cursor-pointer'
                >
                  <div className='flex items-center gap-2'>
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.displayName}
                        width={20}
                        height={20}
                        className='h-5 w-5 rounded-full'
                      />
                    ) : (
                      <User className='h-4 w-4 text-muted-foreground' />
                    )}
                    <span className='truncate max-w-[160px]'>
                      {member.displayName}
                    </span>
                    {member.displayName !== member.username && (
                      <span className='text-xs text-muted-foreground truncate max-w-[80px]'>
                        @{member.username}
                      </span>
                    )}
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
        disabled={isPending || !watchedGuildId}
      >
        <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
      </Button>
    </div>
  )
}
