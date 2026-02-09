'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { listChannels, Channel } from '@/actions/discord.actions'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Hash,
  Volume2,
  Folder,
  Megaphone,
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ChannelTypeFilter =
  | 'all'
  | 'text'
  | 'voice'
  | 'category'
  | 'announcement'
  | 'forum'

interface ChannelPickerProps {
  value: string
  onChange: (value: string) => void
  guildId?: string
  channelType?: ChannelTypeFilter
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  text: Hash,
  voice: Volume2,
  category: Folder,
  announcement: Megaphone,
  forum: MessageSquare
}

export function ChannelPicker({
  value,
  onChange,
  guildId,
  channelType = 'all',
  placeholder = 'Select or type channel ID...',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid
}: ChannelPickerProps) {
  const { watch } = useFormContext()
  const credentialId = watch('credentialId')
  const watchedGuildId = watch('guildId') || guildId
  const prevGuildIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  const [channels, setChannels] = useState<Channel[]>([])
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

  const fetchChannels = useCallback(() => {
    if (!credentialId || !watchedGuildId) {
      setChannels([])
      setError(null)
      return
    }

    startTransition(async () => {
      setError(null)
      const result = await listChannels(
        credentialId,
        watchedGuildId,
        channelType
      )

      if (result.error) {
        setError(result.error || 'Failed to fetch channels')
        setChannels([])
      } else {
        setChannels(result.data || [])
      }
      setHasFetched(true)
    })
  }, [credentialId, watchedGuildId, channelType])

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
      fetchChannels()
      prevGuildIdRef.current = watchedGuildId
    } else if (!watchedGuildId && prevGuildIdRef.current) {
      setChannels([])
      setInputValue('')
      setHasFetched(false)
      prevGuildIdRef.current = ''
    }
  }, [watchedGuildId, onChange, fetchChannels])

  const handleRefresh = () => {
    fetchChannels()
  }

  const handleSelect = (selectedValue: string | null) => {
    if (!selectedValue) return

    const channel = channels.find((c) => c.id === selectedValue)
    if (!channel) {
      // User typed a manual ID
      onChange(selectedValue)
      return
    }

    onChange(channel.id)
    setInputValue(channel.name)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Allow user to type manual ID
    onChange(newValue)
  }

  // Filter channels based on search
  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Group channels by category
  const categorizedChannels = filteredChannels.reduce<{
    categories: Channel[]
    channelsByCategory: Record<string, Channel[]>
    uncategorized: Channel[]
  }>(
    (acc, channel) => {
      if (channel.type === 'category') {
        acc.categories.push(channel)
      } else if (channel.parentId) {
        if (!acc.channelsByCategory[channel.parentId]) {
          acc.channelsByCategory[channel.parentId] = []
        }
        acc.channelsByCategory[channel.parentId].push(channel)
      } else {
        acc.uncategorized.push(channel)
      }
      return acc
    },
    { categories: [], channelsByCategory: {}, uncategorized: [] }
  )

  const getChannelIcon = (type: string) => {
    const Icon = CHANNEL_ICONS[type] || Hash
    return Icon
  }

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
      <Combobox value={value} onValueChange={handleSelect} disabled={disabled}>
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
                Click refresh to load channels
              </div>
            ) : filteredChannels.length === 0 ? (
              <ComboboxEmpty>
                {inputValue
                  ? 'No matches found. Using as ID.'
                  : 'No channels found'}
              </ComboboxEmpty>
            ) : (
              <>
                {/* Uncategorized channels first */}
                {categorizedChannels.uncategorized.map((channel) => {
                  const Icon = getChannelIcon(channel.type)
                  return (
                    <ComboboxItem
                      key={channel.id}
                      value={channel.id}
                      className='cursor-pointer'
                    >
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-muted-foreground' />
                        <span className='truncate max-w-[200px]'>
                          {channel.name}
                        </span>
                      </div>
                    </ComboboxItem>
                  )
                })}

                {/* Categorized channels */}
                {categorizedChannels.categories.map((category) => (
                  <div key={category.id}>
                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase'>
                      {category.name}
                    </div>
                    {(
                      categorizedChannels.channelsByCategory[category.id] || []
                    ).map((channel) => {
                      const Icon = getChannelIcon(channel.type)
                      return (
                        <ComboboxItem
                          key={channel.id}
                          value={channel.id}
                          className='cursor-pointer pl-4'
                        >
                          <div className='flex items-center gap-2'>
                            <Icon className='h-4 w-4 text-muted-foreground' />
                            <span className='truncate max-w-[180px]'>
                              {channel.name}
                            </span>
                          </div>
                        </ComboboxItem>
                      )
                    })}
                  </div>
                ))}
              </>
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
