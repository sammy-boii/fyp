'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ZapIcon } from 'lucide-react'
import { MdLock } from 'react-icons/md'
import { FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa'
import { RxCross1 } from 'react-icons/rx'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { resetPasswordSchema } from '@/schema/auth.schema'
import { TResetPasswordForm } from '@/types/auth.types'
import { resetPassword } from '@/actions/user.actions'

const ResetPasswordPage = () => {
  const searchParams = useSearchParams()
  const tokenFromQuery = searchParams.get('token') ?? ''
  const router = useRouter()

  const form = useForm<TResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromQuery,
      password: '',
      confirmPassword: ''
    }
  })

  const [showPassword, setShowPassword] = useState(false)
  const passwordError = form.formState.errors.password

  async function onSubmit(values: TResetPasswordForm) {
    if (!values.token) {
      toast.error('Invalid or missing reset token')
      return
    }

    const { error } = await resetPassword(values)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password reset successfully')
    router.push('/login')
  }

  return (
    <Card className='max-w-md w-full mt-12 mx-auto'>
      <CardHeader>
        <div className='flex items-center gap-4'>
          <ZapIcon className='size-6' />
          <CardTitle className='text-2xl font-bold'>Reset Password</CardTitle>
        </div>

        <CardDescription>
          Enter a new password that meets the security requirements
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
            {/* Hidden token field to keep it part of the form state */}
            <input
              type='hidden'
              value={tokenFromQuery}
              {...form.register('token')}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className='relative group'>
                      <MdLock
                        size={18}
                        className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                      />
                      <Input
                        className='pr-12 pl-10'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your new password'
                        {...field}
                      />
                      <Button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-0 top-1/2 -translate-y-1/2'
                        variant='ghost'
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className={cn('duration-300 transition-all', {
                'h-0 overflow-hidden opacity-0': !passwordError,
                'h-36 opacity-100': passwordError
              })}
            >
              <PasswordCriteria password={form.watch('password')} />
            </div>

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className='relative group'>
                      <MdLock
                        size={18}
                        className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                      />
                      <Input
                        className='pr-12 pl-10'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Re-enter your new password'
                        {...field}
                      />
                      <Button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-0 top-1/2 -translate-y-1/2'
                        variant='ghost'
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={form.formState.isSubmitting}
              className='w-full flex items-center gap-2'
              type='submit'
            >
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function PasswordCriteria({ password }: { password: string }) {
  const criteria = [
    {
      label: 'Must be at least 12 characters',
      valid: password.length >= 12
    },
    {
      label: 'Must contain at least one uppercase letter',
      valid: /[A-Z]/.test(password)
    },
    {
      label: 'Must contain at least one lowercase letter',
      valid: /[a-z]/.test(password)
    },
    {
      label: 'Must contain at least one number',
      valid: /\d/.test(password)
    },
    {
      label: 'Must contain at least one special character',
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  ]

  return (
    <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
      <div className='pb-1 text-red-400 -translate-y-1'>
        Password must match the following criteria:
      </div>
      {criteria.map((item, index) => (
        <div key={index} className='flex items-center gap-3'>
          <div
            className={`size-4 rounded-full flex items-center text-foreground justify-center border ${
              item.valid ? 'bg-green-500 border-green-500' : 'bg-red-500'
            }`}
          >
            {item.valid ? (
              <FaCheck className={cn('size-2', {})} />
            ) : (
              <RxCross1 className={cn('size-2 font-bold', {})} />
            )}
          </div>
          <span className={clsx(item.valid && 'line-through')}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default ResetPasswordPage
