import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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

export default function CredentialsPage() {
  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10'>
        <header className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-medium text-primary'>Security</p>
            <h1 className='text-2xl font-semibold leading-tight'>
              Connected credentials
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage encrypted access tokens for your third-party providers.
            </p>
          </div>
          <Button className='gap-2'>
            <Plus className='h-4 w-4' />
            Add credential
          </Button>
        </header>

        <DataTable columns={columns} data={dummyCredentials} />
      </div>
    </div>
  )
}
