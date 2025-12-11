'use client'

import { cn } from '@/lib/utils'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface DropzoneProps {
  onFileSelect: (file: File | null) => void
  preview?: string
  className?: string
  accept?: string
  avatar: string | null
  forcePreview?: boolean
}

export function Dropzone({
  onFileSelect,
  preview,
  avatar,
  forcePreview = false,
  className,
  accept = 'image/*'
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const shouldShowPreview = Boolean(preview && (forcePreview || !avatar))

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file')
        return
      }
      return onFileSelect(file)
    },
    [onFileSelect]
  )
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
  }

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type='file'
        accept={accept}
        onChange={handleFileInput}
        className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
      />

      {shouldShowPreview ? (
        <div className='relative size-20 '>
          <Image alt='Preview' src={preview} className='object-cover' fill />
          <button
            type='button'
            onClick={handleRemove}
            className='absolute -right-7 -top-2 cursor-pointer rounded-full p-1.5 text-destructive-foreground shadow-sm transition-colors'
          >
            <X className='size-4' />
          </button>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center gap-3 p-6 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
            {isDragging ? (
              <Upload className='h-6 w-6 text-primary' />
            ) : (
              <ImageIcon className='h-6 w-6 text-muted-foreground' />
            )}
          </div>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>
              {isDragging ? 'Drop image here' : 'Drop image or click to upload'}
            </p>
            <p className='text-xs text-muted-foreground'>
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
