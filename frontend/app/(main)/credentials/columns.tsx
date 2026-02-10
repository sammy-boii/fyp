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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  FileText,
  Lock,
  Pencil,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Trash2,
  Layers
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
    header: () => (
      <div className='flex items-center gap-2'>
        <Layers className='h-4 w-4' />
        Provider
      </div>
    ),
    cell: ({ row }) => <ProviderCell cred={row.original} />
  },
  {
    accessorKey: 'status',
    header: () => (
      <div className='flex items-center gap-2'>
        <ShieldCheck className='h-4 w-4' />
        Status
      </div>
    ),
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
    header: () => (
      <div className='flex items-center gap-2'>
        <TimerReset className='h-4 w-4' />
        Expires
      </div>
    ),
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
    header: () => (
      <div className='flex items-center gap-2'>
        <FileText className='h-4 w-4' />
        Notes
      </div>
    ),
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
    header: () => (
      <div className='flex items-center gap-2 w-full pr-2'>
        <Settings className='h-4 w-4' />
        Actions
      </div>
    ),
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
          <DialogContent className='max-w-2xl p-0 gap-0 overflow-hidden'>
            {/* Hero header with provider branding */}
            <div className='relative px-6 pt-6 pb-5 bg-linear-to-br from-primary/5 via-primary/2 to-transparent'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border'>
                    <ProviderIcon provider={cred.service} />
                  </div>
                  <div className='space-y-1'>
                    <DialogTitle className='text-base font-semibold capitalize'>
                      {CREDENTIALS_OPTIONS.find(
                        (o) => o.id === cred.provider.toLowerCase()
                      )?.name || cred.provider}
                    </DialogTitle>
                    <DialogDescription className='text-xs text-muted-foreground capitalize'>
                      {cred.service
                        ? cred.service.split('-').join(' ')
                        : 'Credential details'}
                    </DialogDescription>
                  </div>
                </div>
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
                        <Icon className='h-3.5 w-3.5' />
                        {statusCopy[cred.status]}
                      </>
                    )
                  })()}
                </Badge>
              </div>
            </div>

            <Separator />

            <ScrollArea className='max-h-[60vh]'>
              <div className='px-6 py-5 space-y-5'>
                {/* Tokens section */}
                <div className='space-y-3'>
                  <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                    <Lock className='h-3.5 w-3.5' />
                    Tokens
                  </h4>
                  <div className='rounded-lg border bg-card'>
                    <TokenRow
                      label='Access Token'
                      value={cred.accessToken}
                      onCopy={(token) => {
                        setTokenToCopy(token)
                        setIsPasswordOpen(true)
                      }}
                    />
                    <Separator />
                    <TokenRow
                      label='Refresh Token'
                      value={cred.refreshToken || null}
                      onCopy={(token) => {
                        setTokenToCopy(token)
                        setIsPasswordOpen(true)
                      }}
                    />
                  </div>
                </div>

                {/* Expiry section */}
                <div className='space-y-3'>
                  <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                    <TimerReset className='h-3.5 w-3.5' />
                    Expiration
                  </h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <ExpiryCard
                      label='Access Token'
                      date={cred.accessTokenExpiresAt}
                    />
                    <ExpiryCard
                      label='Refresh Token'
                      date={cred.refreshTokenExpiresAt}
                    />
                  </div>
                </div>

                {/* Scopes section */}
                <div className='space-y-3'>
                  <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                    <ShieldCheck className='h-3.5 w-3.5' />
                    Permissions
                    {cred.scopes.length > 0 && (
                      <span className='text-[10px] font-medium bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 tabular-nums'>
                        {cred.scopes.length}
                      </span>
                    )}
                  </h4>
                  {cred.scopes.length > 0 ? (
                    <ScopesList scopes={cred.scopes} />
                  ) : (
                    <div className='rounded-lg border bg-card p-4'>
                      <p className='text-sm text-muted-foreground text-center'>
                        No scopes granted
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes section */}
                {cred.notes && (
                  <div className='space-y-3'>
                    <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                      <FileText className='h-3.5 w-3.5' />
                      Notes
                    </h4>
                    <div className='rounded-lg border bg-card p-3'>
                      <p className='text-sm leading-relaxed whitespace-pre-line wrap-break-word text-muted-foreground'>
                        {cred.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
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
                  className='max-w-[460px]'
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

function TokenRow({
  label,
  value,
  onCopy
}: {
  label: string
  value: string | null
  onCopy: (token: string) => void
}) {
  return (
    <div className='flex items-center justify-between px-4 py-3 group'>
      <div className='space-y-1 min-w-0 flex-1'>
        <p className='text-xs font-medium text-muted-foreground'>{label}</p>
        <p className='text-xs font-mono text-foreground/80 truncate pr-4'>
          {value ? maskToken(value) : 'Not set'}
        </p>
      </div>
      {value && (
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={() => onCopy(value)}
        >
          <Copy className='h-3.5 w-3.5' />
          <span className='sr-only'>Copy {label}</span>
        </Button>
      )}
    </div>
  )
}

function ExpiryCard({ label, date }: { label: string; date?: string | null }) {
  const formatted = formatDate(date)
  const isSet = date && formatted !== 'Not set' && formatted !== 'Invalid date'
  const isExpired = isSet && new Date(date) < new Date()

  return (
    <div className='rounded-lg border bg-card p-3 space-y-1.5'>
      <p className='text-xs font-medium text-muted-foreground'>{label}</p>
      <p
        className={`text-sm font-medium ${
          !isSet
            ? 'text-muted-foreground'
            : isExpired
              ? 'text-destructive'
              : 'text-foreground'
        }`}
      >
        {formatted}
      </p>
      {isSet && (
        <div className='flex items-center gap-1.5'>
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              isExpired ? 'bg-destructive' : 'bg-emerald-500'
            }`}
          />
          <span className='text-[11px] text-muted-foreground'>
            {isExpired ? 'Expired' : 'Valid'}
          </span>
        </div>
      )}
    </div>
  )
}

/** Parse a raw scope string into a readable label and category */
function parseScope(raw: string): {
  label: string
  category: string
  description: string
  access: 'read' | 'write' | 'full'
} {
  // Short OAuth scopes
  const shortScopes: Record<
    string,
    { label: string; description: string; category: string }
  > = {
    openid: {
      label: 'OpenID',
      description: 'Authenticate your identity',
      category: 'Identity'
    },
    email: {
      label: 'Email Address',
      description: 'View your email address',
      category: 'Identity'
    },
    profile: {
      label: 'Profile Info',
      description: 'View your basic profile info',
      category: 'Identity'
    },
    bot: {
      label: 'Bot',
      description: 'Bot access to the platform',
      category: 'Bot'
    }
  }

  const lower = raw.toLowerCase()
  if (shortScopes[lower]) {
    return { ...shortScopes[lower], access: 'read' }
  }

  // Google API URLs: https://www.googleapis.com/auth/gmail.readonly
  const googleMatch = raw.match(
    /googleapis\.com\/auth\/([a-z_]+(?:\.[a-z_]+)*)/i
  )
  if (googleMatch) {
    const parts = googleMatch[1].split('.')
    const service = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const modifier = parts.slice(1).join(' ')

    const isReadOnly = modifier.includes('readonly')
    const isFile = modifier.includes('file')

    let desc = `Access ${service}`
    if (isReadOnly) desc = `Read-only access to ${service}`
    else if (isFile)
      desc = `Access files opened or created by the app in ${service}`
    else if (modifier === 'modify') desc = `Read & modify ${service} data`
    else if (modifier === 'send') desc = `Send via ${service}`
    else if (modifier === 'labels') desc = `Manage ${service} labels`
    else if (!modifier) desc = `Full access to ${service}`

    return {
      label: modifier
        ? `${service} · ${modifier.charAt(0).toUpperCase() + modifier.slice(1)}`
        : service,
      category: service,
      description: desc,
      access: isReadOnly ? 'read' : modifier ? 'write' : 'full'
    }
  }

  // Google mail URL
  if (raw.includes('mail.google.com')) {
    return {
      label: 'Gmail · Full Access',
      category: 'Gmail',
      description: 'Full access to your Gmail account',
      access: 'full'
    }
  }

  // Fallback
  return {
    label: raw.length > 40 ? `${raw.slice(0, 37)}...` : raw,
    category: 'Other',
    description: raw,
    access: 'read'
  }
}

const accessConfig = {
  read: {
    label: 'Read',
    className:
      'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
  },
  write: {
    label: 'Read & Write',
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
  },
  full: {
    label: 'Full Access',
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
  }
} as const

function ScopesList({ scopes }: { scopes: string[] }) {
  const parsed = scopes.map((s) => ({ raw: s, ...parseScope(s) }))

  // Group by category
  const groups = parsed.reduce<Record<string, typeof parsed>>((acc, scope) => {
    const key = scope.category
    if (!acc[key]) acc[key] = []
    acc[key].push(scope)
    return acc
  }, {})

  return (
    <div className='rounded-lg border bg-card overflow-hidden divide-y divide-border'>
      {Object.entries(groups).map(([category, items]) => (
        <div key={category}>
          {/* Category header */}
          <div className='px-4 py-2 bg-muted/40'>
            <span className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              {category}
            </span>
          </div>
          {/* Scope rows */}
          <div className='divide-y divide-border/50'>
            {items.map((scope, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div className='flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors cursor-default'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <div className='flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 shrink-0'>
                        <ShieldCheck className='h-3 w-3 text-primary' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-[13px] font-medium truncate'>
                          {scope.label}
                        </p>
                        <p className='text-[11px] text-muted-foreground truncate'>
                          {scope.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant='outline'
                      className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ml-3 ${accessConfig[scope.access].className}`}
                    >
                      {accessConfig[scope.access].label}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='max-w-xs font-mono text-[11px] break-all'
                >
                  {scope.raw}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </div>
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
