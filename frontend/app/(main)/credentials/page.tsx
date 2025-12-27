'use client'

import Image from 'next/image'
import { ChevronRight, Plus, KeyRound } from 'lucide-react'

import googleDriveIcon from '@/public/google-drive.png'
import gmailIcon from '@/public/gmail.png'

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { columns, CredentialRow } from './columns'
import { DataTable } from './data-table'
import Link from 'next/link'
import { useGetCredentials } from '@/hooks/use-credentials'
import { Skeleton } from '@/components/ui/skeleton'

const credentialOptions = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: gmailIcon,
    url: 'http://localhost:5000/api/gmail/oauth'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: googleDriveIcon,
    url: 'http://localhost:5000/api/gmail/oauth'
  }
]

export default function CredentialsPage() {
  const { data, isLoading, isError } = useGetCredentials()

  const apiCredentials = data?.data ?? []

  console.log(apiCredentials)

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

      // First check if refresh token exists
      if (cred.refreshToken) {
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
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10'>
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
          <Sheet>
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
                {credentialOptions.map((option) => (
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
                ))}
              </div>
            </SheetContent>
          </Sheet>
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
