'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ChevronRight, Check, Upload, Download, List } from 'lucide-react'
import Image from 'next/image'
import driveIcon from '@/public/google-drive.png'

interface GoogleDriveSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  node: {
    id: string
    label: string
    type: string
    icon: React.ReactNode | any
  }
  onSave: (nodeId: string, config: any) => void
}

const GOOGLE_DRIVE_ACTIONS = [
  {
    id: 'upload_file',
    name: 'Upload File',
    description: 'Upload a file to Google Drive',
    icon: <Upload className='h-5 w-5' />,
    fields: [
      {
        id: 'file_path',
        name: 'file_path',
        type: 'text',
        label: 'File Path',
        placeholder: '/path/to/file.pdf',
        required: true
      },
      {
        id: 'folder_id',
        name: 'folder_id',
        type: 'text',
        label: 'Folder ID',
        placeholder: 'Optional folder ID'
      },
      {
        id: 'file_name',
        name: 'file_name',
        type: 'text',
        label: 'File Name',
        placeholder: 'Custom file name (optional)'
      }
    ]
  },
  {
    id: 'download_file',
    name: 'Download File',
    description: 'Download a file from Google Drive',
    icon: <Download className='h-5 w-5' />,
    fields: [
      {
        id: 'file_id',
        name: 'file_id',
        type: 'text',
        label: 'File ID',
        placeholder: 'Google Drive file ID',
        required: true
      },
      {
        id: 'download_path',
        name: 'download_path',
        type: 'text',
        label: 'Download Path',
        placeholder: '/path/to/download/location',
        required: true
      }
    ]
  },
  {
    id: 'list_files',
    name: 'List Files',
    description: 'List files in Google Drive',
    icon: <List className='h-5 w-5' />,
    fields: [
      {
        id: 'folder_id',
        name: 'folder_id',
        type: 'text',
        label: 'Folder ID',
        placeholder: 'Optional folder ID to list files from'
      },
      {
        id: 'max_results',
        name: 'max_results',
        type: 'number',
        label: 'Max Results',
        defaultValue: 50
      },
      {
        id: 'file_type',
        name: 'file_type',
        type: 'select',
        label: 'File Type',
        options: [
          { value: 'all', label: 'All Files' },
          { value: 'pdf', label: 'PDF' },
          { value: 'image', label: 'Images' },
          { value: 'document', label: 'Documents' }
        ],
        defaultValue: 'all'
      }
    ]
  }
]

export function GoogleDriveSettingsSheet({
  isOpen,
  onClose,
  node,
  onSave
}: GoogleDriveSettingsSheetProps) {
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleActionSelect = (action: any) => {
    setSelectedAction(action)
    // Initialize form data with default values
    const initialData: Record<string, any> = {}
    action.fields.forEach((field: any) => {
      initialData[field.id] = field.defaultValue || ''
    })
    setFormData(initialData)
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSave = () => {
    onSave(node.id, {
      action: selectedAction?.id,
      config: formData
    })
    onClose()
  }

  const renderField = (field: any) => {
    const value = formData[field.id] || field.defaultValue || ''

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className='min-h-[100px]'
          />
        )

      case 'number':
        return (
          <Input
            id={field.id}
            type='number'
            placeholder={field.placeholder}
            value={value}
            onChange={(e) =>
              handleFieldChange(field.id, Number(e.target.value))
            }
            required={field.required}
          />
        )

      case 'boolean':
        return (
          <div className='flex items-center space-x-3'>
            <input
              id={field.id}
              type='checkbox'
              checked={value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className='h-4 w-4 rounded border border-input bg-background'
            />
            <Label htmlFor={field.id} className='text-sm font-medium'>
              {field.label}
            </Label>
          </div>
        )

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='w-[450px] sm:w-[600px] px-6'>
        <SheetHeader className='pb-4 px-0'>
          <SheetTitle className='flex items-center gap-3 text-lg'>
            <Image
              src={driveIcon}
              alt='Google Drive'
              width={20}
              height={20}
              className='rounded'
            />
            {node.label}
            <Badge variant='secondary' className='text-xs'>
              {node.type}
            </Badge>
          </SheetTitle>
          <SheetDescription className='text-sm'>
            Configure the Google Drive node settings and select an action to
            perform.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto py-2 px-0'>
          {!selectedAction ? (
            // Action Selection View
            <div className='space-y-4'>
              <div className='text-center'>
                <h3 className='text-lg font-medium mb-1'>Select Action</h3>
                <p className='text-sm text-muted-foreground'>
                  Choose what you want to do with Google Drive
                </p>
              </div>
              <div className='space-y-3'>
                {GOOGLE_DRIVE_ACTIONS.map((action) => (
                  <div
                    key={action.id}
                    className='group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent hover:shadow-md'
                    onClick={() => handleActionSelect(action)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3 flex-1'>
                        <div className='p-1.5 rounded-md bg-primary/10 text-primary'>
                          {action.icon}
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-medium text-sm text-foreground group-hover:text-accent-foreground'>
                            {action.name}
                          </h4>
                          <p className='text-xs text-muted-foreground mt-0.5'>
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Configuration View
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedAction(null)}
                  className='p-1.5 h-auto'
                >
                  <ChevronRight className='h-4 w-4 rotate-180' />
                </Button>
                <div className='flex items-center gap-3'>
                  <div className='p-1.5 rounded-md bg-primary/10 text-primary'>
                    {selectedAction.icon}
                  </div>
                  <div>
                    <h3 className='text-base font-medium'>
                      {selectedAction.name}
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      {selectedAction.description}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                {selectedAction.fields.map((field: any) => (
                  <div key={field.id} className='space-y-2'>
                    <Label htmlFor={field.id} className='text-sm font-medium'>
                      {field.label}
                      {field.required && (
                        <span className='text-destructive ml-1'>*</span>
                      )}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedAction && (
          <div className='flex justify-end gap-3 pt-4 border-t px-0'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className='gap-2'>
              <Check className='h-4 w-4' />
              Save Configuration
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
