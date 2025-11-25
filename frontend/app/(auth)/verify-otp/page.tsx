 'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Blank function for now – wire your OTP verification logic here later.
async function handleOtpVerification(_otp: string, _email?: string | null) {
  // TODO: implement OTP verification
}

export default function VerifyOtpPage() {
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get('email')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  function onChangeDigit(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return

    const next = [...otp]
    next[index] = value
    setOtp(next)
  }

  async function onSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault()
    const code = otp.join('')
    await handleOtpVerification(code, emailFromQuery)
  }

  return (
    <div className='flex max-w-md w-full flex-col gap-6'>
      <Card>
        <CardHeader className='text-left'>
          <div className='flex items-center gap-4'>
            <ZapIcon className='size-6' />
            <CardTitle className='text-2xl'>Enter verification code</CardTitle>
          </div>
          <CardDescription>
            We&apos;ve sent a 6-digit code to{' '}
            <span className='font-medium'>
              {emailFromQuery || 'your email address'}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='grid gap-6'>
            <div className='grid gap-2'>
              <Label htmlFor='otp'>Verification code</Label>
              <div className='flex items-center justify-between gap-2'>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={index === 0 ? 'otp' : undefined}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    maxLength={1}
                    className='w-10 text-center'
                    value={digit}
                    onChange={(evt) => onChangeDigit(index, evt.target.value)}
                  />
                ))}
              </div>
            </div>

            <Button type='submit' className='w-full'>
              Verify
            </Button>

            <div className='text-center text-muted-foreground text-sm'>
              Didn&apos;t receive the code?{' '}
              <button
                type='button'
                className='hover:underline text-foreground underline-offset-4'
              >
                Resend
              </button>
            </div>

            <div className='text-center text-muted-foreground text-sm'>
              Entered the wrong email?{' '}
              <Link
                href='/forgot-password'
                className='hover:underline text-foreground underline-offset-4'
              >
                Go back
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


