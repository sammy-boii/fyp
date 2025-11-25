'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoveLeft, ZapIcon } from 'lucide-react'
import { IoIosMail } from 'react-icons/io'
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault()

    // In a real app, you would trigger your forgot-password flow here.
    // For now, we just navigate to the OTP page with the email as a query param.
    if (!email) return

    router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className='flex max-w-md w-full flex-col gap-6'>
      <Card>
        <CardHeader className='text-left'>
          <div className='flex items-center gap-4'>
            <ZapIcon className='size-6' />
            <CardTitle className='text-2xl'>Reset your password</CardTitle>
          </div>
          <CardDescription>
            Enter the email associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='grid gap-4'>
            <div className='grid group relative gap-3'>
              <IoIosMail
                size={19}
                className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[59%]'
              />
              <Label htmlFor='reset-email'>Email</Label>
              <Input
                id='reset-email'
                type='email'
                className='pl-10'
                placeholder='Enter your email'
                required
                value={email}
                onChange={(evt) => setEmail(evt.target.value)}
              />
            </div>
            <Button type='submit' className='w-full'>
              Continue
            </Button>

            <div className='flex items-center pt-2 gap-2'>
              <div className='bg-muted h-px flex-1' />
              <div className='text-muted-foreground text-xs'>OR</div>
              <div className='bg-muted h-px flex-1' />
            </div>

            <Link
              href='/login'
              className='text-center flex justify-center items-end gap-1 hover: hover:underline text-foreground underline-offset-4 text-sm'
            >
              <MoveLeft className='size-4' />
              Back to login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
