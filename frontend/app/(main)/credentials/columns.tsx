'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2,
  Clock3,
  Eye,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
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

function ProviderBadge({ provider }: { provider: string }) {
  const base = provider.toLowerCase()
  const meta = providerMeta[base]
  return (
    <div className='flex items-center gap-2 text-sm font-medium text-foreground'>
      <ProviderIcon provider={provider} />
      <span>{meta?.name || provider}</span>
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
    cell: ({ getValue }) => (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <TimerReset className='h-4 w-4' />
        <span>{formatDate(getValue() as string)}</span>
      </div>
    )
  },
  {
    id: 'notes',
    header: 'Notes',
    cell: () => (
      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
        <ShieldCheck className='h-4 w-4' />
        Encrypted at rest
      </div>
    )
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionCell cred={row.original} />
  }
]

function ActionCell({ cred }: { cred: CredentialRow }) {
  const [password, setPassword] = useState('')
  const [decrypted, setDecrypted] = useState(false)
  const [showDecryptInput, setShowDecryptInput] = useState(false)

  const detail = {
    accessToken: decrypted ? cred.accessToken : maskToken(cred.accessToken),
    refreshToken: cred.refreshToken
      ? decrypted
        ? cred.refreshToken
        : maskToken(cred.refreshToken)
      : 'Not set',
    expires: formatDate(cred.accessTokenExpiresAt),
    refreshExpires: formatDate(cred.refreshTokenExpiresAt || null),
    scopes: cred.scopes
  }

  const handleDecrypt = () => {
    if (password.trim() === 'test') {
      setDecrypted(true)
    }
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className='flex items-center gap-2'>
        <Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <Eye className='h-4 w-4' />
                  <span className='sr-only'>View</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50'>
                  <ProviderIcon provider={cred.provider} />
                </div>
                <div className='flex-1'>
                  <DialogTitle className='text-base font-semibold leading-tight'>
                    <ProviderBadge provider={cred.provider} />
                  </DialogTitle>
                  <DialogDescription className='text-sm text-muted-foreground'>
                    {cred.service || 'No linked service'}
                  </DialogDescription>
                </div>
                <Badge className={statusTone[cred.status]} variant='outline'>
                  {statusCopy[cred.status]}
                </Badge>
              </div>
            </DialogHeader>
            <div className='space-y-4 text-sm'>
              <section className='rounded-lg border p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase text-muted-foreground'>
                    Tokens
                  </span>
                  {!showDecryptInput ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setShowDecryptInput(true)}
                    >
                      Decrypt
                    </Button>
                  ) : null}
                </div>
                <div className='space-y-2'>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-muted-foreground'>
                      Access
                    </span>
                    <code className='rounded-md bg-background px-3 py-2 text-xs shadow-inner'>
                      {detail.accessToken}
                    </code>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-muted-foreground'>
                      Refresh
                    </span>
                    <code className='rounded-md bg-background px-3 py-2 text-xs shadow-inner'>
                      {detail.refreshToken}
                    </code>
                  </div>
                </div>
                {showDecryptInput ? (
                  <div className='mt-2 flex flex-col gap-2 rounded-md border bg-muted/30 p-3'>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder='Enter password'
                      className='w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50'
                      type='password'
                    />
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='default'
                        size='sm'
                        onClick={handleDecrypt}
                      >
                        Unlock
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setShowDecryptInput(false)
                          setPassword('')
                          setDecrypted(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <span className='text-[11px] text-muted-foreground'>
                      Tokens stay masked until you unlock.
                    </span>
                  </div>
                ) : null}
                {decrypted ? (
                  <span className='text-xs text-emerald-600 dark:text-emerald-300'>
                    Decrypted (password matched)
                  </span>
                ) : null}
              </section>

              <section className='rounded-lg border p-4 grid gap-3 text-muted-foreground'>
                <div className='flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <TimerReset className='h-4 w-4' /> Access expires
                  </span>
                  <span className='font-medium text-foreground'>
                    {detail.expires}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Refresh expires</span>
                  <span className='font-medium text-foreground'>
                    {detail.refreshExpires}
                  </span>
                </div>
              </section>

              <section className='rounded-lg border p-4 space-y-2'>
                <span className='text-xs font-semibold uppercase text-muted-foreground'>
                  Scopes
                </span>
                <div className='flex flex-wrap gap-2'>
                  {cred.scopes.length ? (
                    cred.scopes.map((scope) => (
                      <Badge
                        key={scope}
                        variant='secondary'
                        className='text-[11px]'
                      >
                        {scope}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-xs text-muted-foreground'>None</span>
                  )}
                </div>
              </section>
            </div>
          </DialogContent>
        </Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
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
              className='h-8 w-8 text-destructive hover:text-destructive'
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
