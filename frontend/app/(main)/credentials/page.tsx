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
import { columns, CredentialRow } from './columns'
import { DataTable } from './data-table'

const dummyCredentials: CredentialRow[] = [
  {
    id: 'cred_1',
    provider: 'Google',
    service: 'Sheets',
    accessToken: 'ya29.a0A6....XyZ9',
    refreshToken: '1//0gY...abcd',
    accessTokenExpiresAt: new Date(
      Date.now() + 1000 * 60 * 60 * 12
    ).toISOString(),
    refreshTokenExpiresAt: null,
    scopes: ['drive.readonly', 'sheets.readonly'],
    status: 'active'
  },
  {
    id: 'cred_2',
    provider: 'Notion',
    service: 'Workspace',
    accessToken: 'secret_FxP....u81L',
    refreshToken: null,
    accessTokenExpiresAt: new Date(
      Date.now() + 1000 * 60 * 60 * 2
    ).toISOString(),
    refreshTokenExpiresAt: null,
    scopes: ['pages:read', 'databases:query'],
    status: 'expires-soon'
  },
  {
    id: 'cred_3',
    provider: 'Slack',
    service: 'Bot',
    accessToken: 'xoxb-9....GfP1',
    refreshToken: null,
    accessTokenExpiresAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24
    ).toISOString(),
    refreshTokenExpiresAt: null,
    scopes: ['chat:write', 'channels:history'],
    status: 'revoked'
  }
]

const credentialOptions = [
  { id: 'gmail', name: 'Gmail', icon: gmailIcon },
  { id: 'google-drive', name: 'Google Drive', icon: googleDriveIcon }
]

export default function CredentialsPage() {
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
                  <button
                    key={option.id}
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
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <DataTable columns={columns} data={dummyCredentials} />
      </div>
    </div>
  )
}
