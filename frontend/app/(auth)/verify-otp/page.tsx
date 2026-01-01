'use client'
import { useState, useEffect, useTransition, Suspense } from 'react'
import type React from 'react'

import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronsLeft, Loader2, RefreshCw, ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { toast } from 'sonner'
import { sendResetOTP, verifyResetOTP } from '@/actions/resend.actions'

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  )
}

const VerifyOtpForm = () => {
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get('email')
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [isResendDisabled, setIsResendDisabled] = useState(true)

  const [isPending, startTransition] = useTransition()
  const [isResendPending, startResendTransition] = useTransition()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setIsResendDisabled(false)
    }
  }, [countdown])

  useEffect(() => {
    function handlePaste(evt: ClipboardEvent) {
      const target = evt.target as HTMLElement
      if (target.closest('form') || target.closest('[data-otp-input]')) {
        const pastedText = evt.clipboardData?.getData('text')
        if (pastedText) {
          const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 6)
          if (digitsOnly.length === 6) {
            evt.preventDefault()
            evt.stopPropagation()
            setOtp(digitsOnly)
          }
        }
      }
    }

    // true for capture phase so we can intercept the paste event
    document.addEventListener('paste', handlePaste, true)
    return () => {
      document.removeEventListener('paste', handlePaste, true)
    }
  }, [])

  async function onSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault()

    if (!emailFromQuery) {
      return toast.error('No email was provided')
    }

    startTransition(async () => {
      const { data, error } = await verifyResetOTP(emailFromQuery, otp)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('OTP verified successfully')
      if (data?.resetToken) {
        router.push(
          `/reset-password?token=${encodeURIComponent(data.resetToken)}`
        )
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  async function handleResend() {
    if (!emailFromQuery) {
      return toast.error('No email was provided')
    }
    startResendTransition(async () => {
      const { error } = await sendResetOTP(emailFromQuery)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('The OTP was resent successfully')
      setCountdown(30)
      setIsResendDisabled(true)
    })
    toast.success('The OTP was resent successfully')
    setCountdown(30)
    setIsResendDisabled(true)
  }

  const router = useRouter()

  return (
    <div className='flex max-w-md w-full flex-col gap-6'>
      <Card>
        <CardHeader className='text-left'>
          <div className='flex items-center gap-4'>
            <ZapIcon className='size-6' />
            <CardTitle className='text-2xl'>Enter verification code</CardTitle>
          </div>
          <CardDescription>
            We&apos;ve sent a 6-digit code to your email.{' '}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='grid gap-3'>
            <div className='grid gap-2' data-otp-input>
              <InputOTP
                pattern={REGEXP_ONLY_DIGITS}
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                containerClassName='gap-4'
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className='size-14 text-lg' />
                  <InputOTPSlot index={1} className='size-14 text-lg' />
                  <InputOTPSlot index={2} className='size-14 text-lg' />
                </InputOTPGroup>
                <div className='w-8 h-px rounded-sm bg-muted-foreground' />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className='size-14 text-lg' />
                  <InputOTPSlot index={4} className='size-14 text-lg' />
                  <InputOTPSlot index={5} className='size-14 text-lg' />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              disabled={otp.length !== 6 || isPending}
              type='submit'
              isLoading={isPending}
              className='w-full mt-2'
            >
              Verify
              <Check />
            </Button>

            <div className='flex flex-col items-center'>
              <Button
                type='button'
                variant={'ghost'}
                onClick={handleResend}
                disabled={isResendDisabled || isResendPending || isPending}
                size={'sm'}
                className='ml-auto text-xs justify-center gap-2 text-muted-foreground'
              >
                <RefreshCw className='size-4' />
                {isResendPending ? (
                  <>
                    Resending
                    <Loader2 className='animate-spin' />
                  </>
                ) : isResendDisabled ? (
                  `Resend code (${countdown}s)`
                ) : (
                  'Resend code'
                )}
              </Button>

              <div
                className='flex cursor-pointer items-end gap-1 text-sm justify-center text-muted-foreground hover:text-foreground'
                onClick={router.back}
              >
                <ChevronsLeft className='size-4' />
                Back
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
