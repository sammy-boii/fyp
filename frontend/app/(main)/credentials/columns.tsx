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
import { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
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
import gmailIcon from '@/public/gmail.png'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export type CredentialRow = {
  id: string
  provider: string
  service?: string | null
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

const providerMeta: Record<
  string,
  {
    name: string
    icon: string
  }
> = {
  google: { name: 'Google', icon: '/google-drive.png' },
  gmail: { name: 'Gmail', icon: '/gmail.png' }
}

function maskToken(token: string) {
  if (!token) return '••••••••'
  return `${token.slice(0, 4)}••••${token.slice(-4)}`
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

function ProviderIcon({ provider }: { provider: string }) {
  const base = provider.toLowerCase()
  const meta = providerMeta[base]

  if (meta?.icon) {
    return (
      <div className='relative h-8 w-8 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
        <Image
          src={gmailIcon}
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
      {provider.slice(0, 2)}
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
    accessorKey: 'accessTokenExpiresAt',
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
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionCell cred={row.original} />
  }
]

function ActionCell({ cred }: { cred: CredentialRow }) {
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [tokenToCopy, setTokenToCopy] = useState<string | null>(null)

  const handleCopyToken = (token: string) => {
    setTokenToCopy(token)
    setPassword('')
    setIsPasswordOpen(true)
  }

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
                  <Key className='h-5 w-5' />
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
              {/* Meta */}
              <div className='rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-foreground'>
                    {cred.provider}
                  </span>
                  <span>
                    {cred.service ? `Service: ${cred.service}` : 'No service'}
                  </span>
                </div>
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
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-9 w-9 shrink-0'
                    onClick={() => handleCopyToken(cred.accessToken)}
                  >
                    <Copy className='h-4 w-4' />
                    <span className='sr-only'>Copy access token</span>
                  </Button>
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
                  {cred.refreshToken && (
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-9 w-9 shrink-0'
                      onClick={() => handleCopyToken(cred.refreshToken!)}
                    >
                      <Copy className='h-4 w-4' />
                      <span className='sr-only'>Copy refresh token</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Access Token Expiry */}
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <TimerReset className='h-4 w-4 text-muted-foreground' />
                  Access Token Expiry
                </Label>
                <div className='rounded-md bg-muted/20 px-3 py-2 text-sm text-muted-foreground'>
                  {formatDate(cred.accessTokenExpiresAt)}
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='bg-blue-500/15! h-8 w-8'
            >
              <Pencil className='h-4 w-4' />
              <span className='sr-only'>Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-destructive hover:text-destructive bg-destructive/10'
            >
              <Trash2 className='h-4 w-4' />
              <span className='sr-only'>Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

function ProviderCell({ cred }: { cred: CredentialRow }) {
  const base = cred.provider.toLowerCase()
  const meta = providerMeta[base]

  return (
    <div className='flex items-center gap-3'>
      <div className='flex h-10 w-10 items-center justify-center rounded-md'>
        <ProviderIcon provider={cred.provider} />
      </div>
      <div className='flex flex-col'>
        <span className='text-sm font-semibold'>
          {meta?.name || cred.provider}
        </span>
        <span className='text-xs text-muted-foreground'>
          {cred.service || 'No linked service'}
        </span>
      </div>
    </div>
  )
}
