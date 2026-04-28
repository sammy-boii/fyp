'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { listDriveItems, DriveItem } from '@/actions/google-drive.actions'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Loader2, Folder, File, RefreshCw, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlaceholderResolver } from '@/components/ui/placeholder-input'
import {
  formatPlaceholderForDisplay,
  extractLeadingCanonicalPlaceholders
} from '@/lib/placeholder-utils'
import { useWorkflowEditor } from '@/app/(main)/workflows/[id]/_context/WorkflowEditorContext'

export type DriveItemPickerType = 'all' | 'files' | 'folders'

interface DriveItemPickerProps {
  value: string
  onChange: (value: string) => void
  type?: DriveItemPickerType
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
}

export function DriveItemPicker({
  value,
  onChange,
  type = 'all',
  placeholder = 'Select or type ID...',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid
}: DriveItemPickerProps) {
  const { demoAdapter } = useWorkflowEditor()
  const { resolveNodeLabel } = usePlaceholderResolver()
  const { watch } = useFormContext()
  const credentialId = watch('credentialId')
  const prevCredentialIdRef = useRef<string | null>(null)

  const [items, setItems] = useState<DriveItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string>('')
  const [folderStack, setFolderStack] = useState<
    { id: string; name: string }[]
  >([])
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

  const fetchItems = useCallback(
    (folderId: string = '') => {
      if (!credentialId) {
        setItems([])
        setError(null)
        return
      }

      startTransition(async () => {
        setError(null)
        if (demoAdapter) {
          const data = await Promise.resolve(
            demoAdapter.listDriveItems(credentialId, type, folderId || undefined)
          )
          setItems(data)
        } else {
          const result = await listDriveItems(
            credentialId,
            type,
            folderId || undefined
          )

          if (result.error) {
            setError(result.error || 'Failed to fetch items')
            setItems([])
          } else {
            setItems(result.data || [])
          }
        }
        setHasFetched(true)
      })
    },
    [credentialId, type, demoAdapter]
  )

  // Only fetch when credential actually CHANGES to a different value (not on mount)
  useEffect(() => {
    // Skip initial mount - only react to actual credential changes
    if (prevCredentialIdRef.current === null) {
      // First mount - just record the credential, don't fetch
      prevCredentialIdRef.current = credentialId || ''
      return
    }

    if (credentialId && credentialId !== prevCredentialIdRef.current) {
      // Credential actually changed to a different value - reset and fetch
      setCurrentFolderId('')
      setFolderStack([])
      setHasFetched(false)
      setInputValue('')
      onChange('')

      // Fetch items for new credential
      fetchItems('')
      prevCredentialIdRef.current = credentialId
    } else if (!credentialId && prevCredentialIdRef.current) {
      // Credential was cleared
      setItems([])
      setCurrentFolderId('')
      setFolderStack([])
      setInputValue('')
      setHasFetched(false)
      prevCredentialIdRef.current = ''
    }
  }, [credentialId, onChange, fetchItems])

  const handleRefresh = () => {
    fetchItems(currentFolderId)
  }

  const handleSelect = (selectedValue: string | null) => {
    if (!selectedValue) return

    if (selectedValue === '__back__') {
      // Go back to previous folder
      const newStack = [...folderStack]
      newStack.pop()
      setFolderStack(newStack)
      const newFolderId =
        newStack.length > 0 ? newStack[newStack.length - 1].id : ''
      setCurrentFolderId(newFolderId)
      fetchItems(newFolderId)
      return
    }

    if (selectedValue === '__root__') {
      // Select root folder
      onChange('')
      setInputValue('Root Folder')
      return
    }

    const item = items.find((i) => i.id === selectedValue)
    if (!item) {
      // User typed a manual ID
      onChange(selectedValue)
      return
    }

    // If it's a folder and we're not specifically selecting folders only, navigate into it
    if (item.isFolder && type !== 'folders') {
      setFolderStack([...folderStack, { id: item.id, name: item.name }])
      setCurrentFolderId(item.id)
      fetchItems(item.id)
    } else {
      // Select this item
      onChange(item.id)
      setInputValue(item.name)
    }
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

    if (
      (e.key === 'Backspace' || e.key === 'Delete') &&
      inputValue.length === 0
    ) {
      e.preventDefault()
      setInputValue('')
      onChange('')
    }
  }

  const handleNavigateIntoFolder = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const item = items.find((i) => i.id === itemId)
    if (item && item.isFolder) {
      setFolderStack([...folderStack, { id: item.id, name: item.name }])
      setCurrentFolderId(item.id)
      fetchItems(item.id)
    }
  }

  // Filter items based on search
  const searchValue = inputValue
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchValue.toLowerCase())
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
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Combobox
          value={value}
          onValueChange={handleSelect}
          disabled={disabled}
        >
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
                  Click refresh to load files
                </div>
              ) : (
                <>
                  {/* Back button when in a subfolder */}
                  {folderStack.length > 0 && (
                    <ComboboxItem value='__back__' className='cursor-pointer'>
                      <ChevronLeft className='h-4 w-4 text-muted-foreground' />
                      <span>
                        Back to{' '}
                        {folderStack.length > 1
                          ? folderStack[folderStack.length - 2].name
                          : 'Root'}
                      </span>
                    </ComboboxItem>
                  )}

                  {/* Option to select root folder (for parent folder selections) */}
                  {type === 'folders' && folderStack.length === 0 && (
                    <ComboboxItem value='__root__' className='cursor-pointer'>
                      <Folder className='h-4 w-4 text-muted-foreground' />
                      <span>Root Folder (My Drive)</span>
                    </ComboboxItem>
                  )}

                  {filteredItems.length === 0 ? (
                    <ComboboxEmpty>
                      {searchValue
                        ? 'No matches found. Using as ID.'
                        : 'No items found'}
                    </ComboboxEmpty>
                  ) : (
                    filteredItems.map((item) => (
                      <ComboboxItem
                        key={item.id}
                        value={item.id}
                        className='cursor-pointer'
                      >
                        <div className='flex items-center gap-2 w-full justify-between'>
                          <div className='flex items-center gap-2'>
                            {item.isFolder ? (
                              <Folder className='h-4 w-4 text-yellow-500' />
                            ) : (
                              <File className='h-4 w-4 text-muted-foreground' />
                            )}
                            <span className='truncate max-w-[180px]'>
                              {item.name}
                            </span>
                          </div>
                          {item.isFolder && type !== 'folders' && (
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-6 px-2 text-xs'
                              onClick={(e) =>
                                handleNavigateIntoFolder(item.id, e)
                              }
                            >
                              Open
                            </Button>
                          )}
                        </div>
                      </ComboboxItem>
                    ))
                  )}
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
          disabled={isPending || !credentialId}
        >
          <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
        </Button>
      </div>

      {/* Breadcrumb showing current location */}
      {folderStack.length > 0 && (
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <span>My Drive</span>
          {folderStack.map((folder, index) => (
            <span key={folder.id} className='flex items-center gap-1'>
              <span>/</span>
              <button
                type='button'
                className='hover:text-foreground hover:underline'
                onClick={() => {
                  const newStack = folderStack.slice(0, index + 1)
                  setFolderStack(newStack)
                  setCurrentFolderId(folder.id)
                  fetchItems(folder.id)
                }}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
