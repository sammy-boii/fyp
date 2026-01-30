'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  ChevronRight,
  Plus,
  KeyRound,
  Loader2,
  ExternalLink,
  Bot
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { columns, CredentialRow } from './columns'
import { DataTable } from './data-table'
import Link from 'next/link'
import {
  useGetCredentials,
  useAddDiscordBotToken
} from '@/hooks/use-credentials'
import { Skeleton } from '@/components/ui/skeleton'
import { CREDENTIALS_OPTIONS } from '@/constants'
import { toast } from 'sonner'

const DISCORD_BOT_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1466759269763514513&permissions=8&integration_type=0&scope=bot'

export default function CredentialsPage() {
  const { data, isLoading, isError } = useGetCredentials()
  const addDiscordConnection = useAddDiscordBotToken()

  const [discordDialogOpen, setDiscordDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleConnectDiscord = async () => {
    const result = await addDiscordConnection.mutateAsync({})

    if (result.error) {
      toast.error(result.error.message || 'Failed to connect Discord')
    } else {
      toast.success('Discord connected successfully!')
      setDiscordDialogOpen(false)
      setSheetOpen(false)
    }
  }

  const apiCredentials = data?.data ?? []

  const rows: CredentialRow[] =
    apiCredentials?.map((cred: any) => {
      const accessTokenExpiresAt = cred.accessTokenExpiresAt
        ? String(cred.accessTokenExpiresAt)
        : ''

      const refreshTokenExpiresAt = cred.refreshTokenExpiresAt
        ? String(cred.refreshTokenExpiresAt)
        : null

      // Derive status: prioritize refresh token, fall back to access token
      let status: CredentialRow['status'] = 'active'

      // Discord bot tokens never expire
      if (cred.provider === 'discord') {
        status = 'active'
      } else if (cred.refreshToken) {
        // First check if refresh token exists
        // If refresh token exists but expiry is null, it never expires
        if (refreshTokenExpiresAt === null) {
          status = 'active'
        } else if (!refreshTokenExpiresAt) {
          status = 'revoked'
        } else {
          const now = new Date()
          const exp = new Date(refreshTokenExpiresAt)

          if (Number.isNaN(exp.getTime()) || exp < now) {
            status = 'revoked'
          } else {
            const threeDaysFromNow = now.getTime() + 3 * 24 * 60 * 60 * 1000
            status =
              exp.getTime() < threeDaysFromNow ? 'expires-soon' : 'active'
          }
        }
      } else {
        // No refresh token, fall back to access token expiry
        if (!accessTokenExpiresAt) {
          status = 'revoked'
        } else {
          const now = new Date()
          const exp = new Date(accessTokenExpiresAt)

          if (Number.isNaN(exp.getTime()) || exp < now) {
            status = 'revoked'
          } else {
            const threeDaysFromNow = now.getTime() + 3 * 24 * 60 * 60 * 1000
            status =
              exp.getTime() < threeDaysFromNow ? 'expires-soon' : 'active'
          }
        }
      }

      return {
        id: cred.id,
        provider: cred.provider,
        service: cred.service ?? null,
        notes: cred.notes ?? null,
        accessToken: cred.accessToken,
        refreshToken: cred.refreshToken ?? null,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scopes: cred.scopes ?? [],
        status
      } satisfies CredentialRow
    }) ?? []

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex flex-col gap-6 p-8'>
        <header className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
              <KeyRound className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h1 className='text-2xl font-semibold leading-tight'>
                Connected credentials
              </h1>
              <p className='text-xs text-muted-foreground'>
                Manage access tokens for your third-party providers.
              </p>
            </div>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button className='gap-2'>
                <Plus className='h-4 w-4' />
                Add credential
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='sm:max-w-md'>
              <SheetHeader>
                <SheetTitle className='text-lg font-semibold'>
                  Select a Provider
                </SheetTitle>
                <SheetDescription>
                  Choose a provider to connect and follow the flow to store
                  credentials securely.
                </SheetDescription>
              </SheetHeader>
              <div className='grid gap-3 p-4 pt-2'>
                {CREDENTIALS_OPTIONS.map((option) => {
                  // Handle different credential types
                  if (option.type === 'bot-invite') {
                    return (
                      <button
                        key={option.id}
                        onClick={() => setDiscordDialogOpen(true)}
                        className='flex cursor-pointer w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition hover:bg-muted'
                      >
                        <div className='flex items-center gap-3'>
                          <span className='relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
                            <Image
                              src={option.icon}
                              alt={option.name}
                              fill
                              sizes='48px'
                              className='object-contain p-2'
                            />
                          </span>
                          <div className='flex flex-col'>
                            <span className='text-sm font-semibold'>
                              {option.name}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {option.description ||
                                'Connect and manage secure access'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                      </button>
                    )
                  }

                  // OAuth providers
                  return (
                    <Link
                      key={option.id}
                      href={option.url}
                      className='flex cursor-pointer w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition hover:bg-muted'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
                          <Image
                            src={option.icon}
                            alt={option.name}
                            fill
                            sizes='48px'
                            className='object-contain p-2'
                          />
                        </span>
                        <div className='flex flex-col'>
                          <span className='text-sm font-semibold'>
                            {option.name}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            Connect and manage secure access
                          </span>
                        </div>
                      </div>
                      <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Discord Bot Connection Dialog */}
          <Dialog open={discordDialogOpen} onOpenChange={setDiscordDialogOpen}>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <Bot className='h-5 w-5' />
                  Connect Discord
                </DialogTitle>
                <DialogDescription>
                  Add our bot to your Discord server to enable workflow
                  automations.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='rounded-lg border bg-muted/50 p-4'>
                  <h4 className='mb-2 text-sm font-medium'>
                    Step 1: Invite the bot
                  </h4>
                  <p className='mb-3 text-xs text-muted-foreground'>
                    Click the button below to add the bot to your Discord
                    server. You&apos;ll need &quot;Manage Server&quot;
                    permissions.
                  </p>
                  <Button asChild variant='outline' className='w-full'>
                    <a
                      href={DISCORD_BOT_INVITE_URL}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ExternalLink className='mr-2 h-4 w-4' />
                      Invite Bot to Server
                    </a>
                  </Button>
                </div>
                <div className='rounded-lg border bg-muted/50 p-4'>
                  <h4 className='mb-2 text-sm font-medium'>
                    Step 2: Confirm connection
                  </h4>
                  <p className='text-xs text-muted-foreground'>
                    After adding the bot to your server, click below to save the
                    connection.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setDiscordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConnectDiscord}
                  disabled={addDiscordConnection.isPending}
                >
                  {addDiscordConnection.isPending && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  I&apos;ve Added the Bot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {isLoading ? (
          <div className='space-y-3'>
            <div className='rounded-lg border'>
              <div className='border-b px-6 py-4'>
                <Skeleton className='h-4 w-full' />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-4 border-b px-6 py-4 last:border-b-0'
                >
                  <Skeleton className='h-10 w-10 rounded-md' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-1/4' />
                    <Skeleton className='h-3 w-1/3' />
                  </div>
                  <Skeleton className='h-6 w-20 rounded-full' />
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-24' />
                  <div className='flex gap-2'>
                    <Skeleton className='h-8 w-8 rounded-md' />
                    <Skeleton className='h-8 w-8 rounded-md' />
                    <Skeleton className='h-8 w-8 rounded-md' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError || data?.error ? (
          <div className='flex min-h-[60vh] items-center justify-center'>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <KeyRound className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>Unable to load credentials</EmptyTitle>
                <EmptyDescription>
                  There was a problem fetching your credentials. Please try
                  refreshing the page.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : rows.length === 0 ? (
          <div className='flex min-h-[60vh] items-center justify-center'>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant={'icon'}>
                  <KeyRound className='' />
                </EmptyMedia>
                <EmptyTitle className='opacity-90'>
                  No Credentials Connected Yet
                </EmptyTitle>
                <EmptyDescription>
                  Connect a provider to securely store and manage your access
                  tokens.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>
    </div>
  )
}
