'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ChevronsLeft, ZapIcon } from 'lucide-react'
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
import { sendResetOTP } from '@/actions/resend.actions'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault()

    if (!email) {
      return toast.error('Please enter your email')
    }

    startTransition(async () => {
      const { error } = await sendResetOTP(email)

      if (error) {
        toast.error(error.message || 'Failed to send OTP email')
        return
      }

      toast.success('An OTP was sent to your email')
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
    })
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
            <Button
              type='submit'
              className='w-full'
              disabled={isPending}
              isLoading={isPending}
            >
              Continue
              <ArrowRight className='size-4' />
            </Button>

            <Link
              className='flex items-end gap-1 text-sm justify-center text-muted-foreground hover:text-foreground'
              href='/login'
            >
              <ChevronsLeft className='size-4' />
              Back
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
