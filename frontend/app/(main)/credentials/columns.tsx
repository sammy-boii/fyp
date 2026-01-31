'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Key,
  Lock,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  useDeleteCredential,
  useUpdateCredential
} from '@/hooks/use-credentials'
import { CREDENTIALS_OPTIONS } from '@/constants/registry'

export type CredentialRow = {
  id: string
  provider: string
  service?: string | null
  notes?: string | null
  accessToken: string
  refreshToken?: string | null
  accessTokenExpiresAt: string
  refreshTokenExpiresAt?: string | null
  scopes: string[]
  status: 'active' | 'expires-soon' | 'revoked'
}

const statusCopy: Record<CredentialRow['status'], string> = {
  active: 'Active',
  'expires-soon': 'Expiring',
  revoked: 'Revoked'
}

const statusTone: Record<CredentialRow['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  'expires-soon': 'bg-amber-500/15 text-amber-700 dark:text-amber-200',
  revoked: 'bg-destructive/10 text-destructive'
}

function maskToken(token: string) {
  if (!token) return '••••••••••'
  return `${token.slice(0, 5)}••••••••${token.slice(-5)}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Not set'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function ProviderIcon({ provider }: { provider?: string | null }) {
  const base = provider?.toLowerCase()
  const meta = CREDENTIALS_OPTIONS.find((option) => option.id === base)

  if (meta?.icon) {
    return (
      <div className='relative h-8 w-8 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
        <Image
          src={meta.icon}
          alt={meta.name}
          fill
          sizes='32px'
          className='object-contain p-1.5'
        />
      </div>
    )
  }

  return (
    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase'>
      {base?.slice(0, 2)}
    </div>
  )
}

export const columns: ColumnDef<CredentialRow>[] = [
  {
    accessorKey: 'provider',
    header: 'Provider',
    cell: ({ row }) => <ProviderCell cred={row.original} />
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as CredentialRow['status']
      const Icon =
        status === 'active'
          ? CheckCircle2
          : status === 'expires-soon'
            ? Clock3
            : ShieldAlert
      return (
        <Badge className={statusTone[status]} variant='outline'>
          <Icon className='h-4 w-4' />
          {statusCopy[status]}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'refreshTokenExpiresAt',
    header: 'Expires',
    cell: ({ getValue }) => {
      const expiresAt = getValue() as string
      return (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <TimerReset className='h-4 w-4' />
          <span>{formatDate(expiresAt)}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ getValue }) => {
      const notes = getValue() as string | null | undefined
      if (!notes) {
        return <span className='text-sm text-muted-foreground'>No notes</span>
      }
      return (
        <div className='flex items-center gap-2 text-sm'>
          <FileText className='h-4 w-4 text-muted-foreground' />
          <span className='truncate max-w-[200px] ' title={notes}>
            {notes}
          </span>
        </div>
      )
    }
  },
  // Move actions column to the end and align right
  {
    id: 'actions',
    header: () => <div className='w-full pr-2'>Actions</div>,
    cell: ({ row }) => (
      <div className='w-full pr-2'>
        <ActionCell cred={row.original} />
      </div>
    ),
    meta: { align: 'right' }
  }
]

function ActionCell({ cred }: { cred: CredentialRow }) {
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState(cred.notes || '')
  const [tokenToCopy, setTokenToCopy] = useState<string | null>(null)
  const deleteCredential = useDeleteCredential()
  const updateCredential = useUpdateCredential()

  const handlePasswordSubmit = () => {
    if (password.trim() === 'test' && tokenToCopy) {
      navigator.clipboard.writeText(tokenToCopy)
      toast.success('Token copied to clipboard successfully')
      setIsPasswordOpen(false)
      setPassword('')
      setTokenToCopy(null)
    } else {
      toast.error('Incorrect password')
    }
  }

  const handleDelete = () => {
    deleteCredential.mutate(cred.id, {
      onSuccess: () => {
        toast.success('Credential deleted successfully')
        setIsDeleteOpen(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete credential')
      }
    })
  }

  const handleEditSubmit = () => {
    updateCredential.mutate(
      { id: cred.id, notes: notes.trim() || null },
      {
        onSuccess: () => {
          toast.success('Credential updated successfully')
          setIsEditOpen(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update credential')
        }
      }
    )
  }

  const handleEditOpenChange = (open: boolean) => {
    setIsEditOpen(open)
    if (open) {
      setNotes(cred.notes || '')
    }
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className='flex items-center gap-2'>
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='bg-muted h-8 w-8'
                >
                  <Eye className='h-4 w-4' />
                  <span className='sr-only'>View</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <div className='flex items-center gap-4'>
                <DialogTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-md bg-muted/80'>
                    <Key className='size-5' />
                  </div>
                  Token Information
                </DialogTitle>
                <Badge className={statusTone[cred.status]} variant='outline'>
                  {(() => {
                    const Icon =
                      cred.status === 'active'
                        ? CheckCircle2
                        : cred.status === 'expires-soon'
                          ? Clock3
                          : ShieldAlert
                    return (
                      <>
                        <Icon className='h-4 w-4' />
                        {statusCopy[cred.status]}
                      </>
                    )
                  })()}
                </Badge>
              </div>
              <DialogDescription>
                View encrypted token details for this credential
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-6 py-4'>
              {/* Provider and Service */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='flex items-center gap-2 text-sm font-medium'>
                    <Key className='h-4 w-4 text-muted-foreground' />
                    Provider
                  </Label>
                  <div className='rounded-md text-muted-foreground capitalize bg-muted/20 px-3 py-2 text-sm font-medium'>
                    {cred.provider}
                  </div>
                </div>
                {cred.service && (
                  <div className='flex items-center justify-between'>
                    <Label className='flex items-center gap-2 text-sm font-medium'>
                      <ShieldCheck className='h-4 w-4 text-muted-foreground' />
                      Service
                    </Label>
                    <div className='capitalize text-muted-foreground font-medium rounded-md bg-muted/20 px-3 py-2 text-sm'>
                      {cred.service}
                    </div>
                  </div>
                )}
              </div>

              {/* Access Token */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <Lock className='h-4 w-4 text-muted-foreground' />
                  Access Token
                </Label>
                <div className='flex items-center gap-2'>
                  <div className='flex-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs'>
                    {maskToken(cred.accessToken)}
                  </div>
                </div>
              </div>

              {/* Refresh Token */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <Lock className='h-4 w-4 text-muted-foreground' />
                  Refresh Token
                </Label>
                <div className='flex items-center gap-2'>
                  <div className='flex-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs'>
                    {cred.refreshToken
                      ? maskToken(cred.refreshToken)
                      : 'Not set'}
                  </div>
                </div>
              </div>

              {/* Access Token Expiry */}
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <TimerReset className='h-4 w-4 text-muted-foreground' />
                  Access Token Expiry
                </Label>
                <div className='rounded-md bg-muted/20 px-3 py-2 text-sm text-muted-foreground'>
                  {formatDate(cred.refreshTokenExpiresAt)}
                </div>
              </div>

              {/* Refresh Token Expiry */}
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <TimerReset className='h-4 w-4 text-muted-foreground' />
                  Refresh Token Expiry
                </Label>
                <div className='rounded-md bg-muted/20 px-3 py-2 text-sm text-muted-foreground'>
                  {cred.refreshTokenExpiresAt
                    ? formatDate(cred.refreshTokenExpiresAt)
                    : 'Not set'}
                </div>
              </div>

              {/* Scopes */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <ShieldCheck className='h-4 w-4 text-muted-foreground' />
                  Scopes
                </Label>
                <div className='flex flex-wrap gap-2'>
                  {cred.scopes.length > 0 ? (
                    cred.scopes.map((scope, idx) => (
                      <Badge key={idx} variant='secondary' className='text-xs'>
                        {scope}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>
                      No scopes available
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <FileText className='h-4 w-4 text-muted-foreground' />
                  Notes
                </Label>
                <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm'>
                  {cred.notes ? (
                    <p className='max-w-md break-all whitespace-pre-line'>
                      {cred.notes}
                    </p>
                  ) : (
                    <span className='text-muted-foreground'>No notes</span>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Dialog */}
        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Lock className='h-5 w-5' />
                Enter Password
              </DialogTitle>
              <DialogDescription>
                It is not advisable to share the token with anyone. Please enter
                your password to copy the token.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsPasswordOpen(false)
                  setPassword('')
                  setTokenToCopy(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordSubmit}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditOpen} onOpenChange={handleEditOpenChange}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='bg-blue-500/15! h-8 w-8'
                >
                  <Pencil className='h-4 w-4' />
                  <span className='sr-only'>Edit</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <div className='p-2 rounded-md bg-muted/80'>
                  <Pencil className='size-5' />
                </div>
                Edit Credential
              </DialogTitle>
              <DialogDescription>
                Update the notes for this credential to help you remember its
                purpose or usage.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='space-y-4'>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  placeholder='Enter notes for this credential...'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  className='max-w-md'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsEditOpen(false)
                  setNotes(cred.notes || '')
                }}
                disabled={updateCredential.isPending}
              >
                Cancel
              </Button>
              <Button
                isLoading={updateCredential.isPending}
                className='w-28'
                onClick={handleEditSubmit}
                disabled={updateCredential.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive hover:text-destructive bg-destructive/10'
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='sr-only'>Delete</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <div className='p-2 rounded-md bg-destructive/20'>
                  <Trash2 className='size-5 text-destructive' />
                </div>
                Delete Credential
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this credential? This action
                cannot be undone and will permanently remove the access token.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteCredential.isPending}
              >
                Cancel
              </Button>
              <Button
                className='w-18'
                variant='destructive'
                onClick={handleDelete}
                disabled={deleteCredential.isPending}
                isLoading={deleteCredential.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

function ProviderCell({ cred }: { cred: CredentialRow }) {
  const base = cred.provider.toLowerCase()
  const meta = CREDENTIALS_OPTIONS.find((option) => option.id === base)

  return (
    <div className='flex items-center gap-3'>
      <div className='flex h-10 w-10 items-center justify-center rounded-md'>
        <ProviderIcon provider={cred.service} />
      </div>
      <div className='flex flex-col'>
        <span className='text-sm capitalize font-semibold'>
          {meta?.name || cred.provider}
        </span>
        <span className='text-xs capitalize text-muted-foreground'>
          {/* mainly for google-drive */}
          {cred.service ? cred.service.split('-').join(' ') : 'N/A'}
        </span>
      </div>
    </div>
  )
}
