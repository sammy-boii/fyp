'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { FaCheck, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RxCross1 } from 'react-icons/rx'
import clsx from 'clsx'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ZapIcon } from 'lucide-react'
import { LuLogIn } from 'react-icons/lu'
import { MdLock } from 'react-icons/md'
import { IoIosMail } from 'react-icons/io'
import { signupFormSchema } from '@/schema/auth.schema'
import { TSignUpForm } from '@/types/auth.types'
import { signUp } from '@/actions/auth.actions'

const SignUpPage = () => {
  const router = useRouter()

  const form = useForm<TSignUpForm>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  async function onSubmit(formData: TSignUpForm) {
    const { error } = await signUp(formData)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created successfully')
    router.push('/login')
  }

  const [showPassword, setShowPassword] = useState(false)
  const passwordError = form.formState.errors.password

  return (
    <Card className='max-w-md w-full mt-12 mx-auto'>
      <CardHeader>
        <div className='flex items-center gap-4'>
          <ZapIcon className='size-6' />
          <CardTitle className='text-2xl font-bold'>
            Create an Account
          </CardTitle>
        </div>

        <CardDescription>Enter your details below</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <div className='relative group'>
                      <FaUser
                        size={15}
                        className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[10px]'
                      />
                      <Input
                        className='pl-10'
                        placeholder='John Doe'
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className='relative group'>
                      <IoIosMail
                        size={19}
                        className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[10px]'
                      />
                      <Input
                        className='pl-10'
                        placeholder='m@example.com'
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative group'>
                      <MdLock
                        size={18}
                        className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                      />
                      <Input
                        className='pr-12 pl-10'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your password'
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className='relative group'>
                      <MdLock
                        size={18}
                        className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[9px]'
                      />
                      <Input
                        className='pr-12 pl-10'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your password'
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
              Sign Up
              <LuLogIn />
            </Button>
          </form>

          <div className='flex items-center gap-2'>
            <div className='bg-muted h-px flex-1' />
            <div className='text-muted-foreground text-xs'>OR</div>
            <div className='bg-muted h-px flex-1' />
          </div>

          <div className='text-muted-foreground text-center text-sm'>
            Already have an account?{' '}
            <Link className='text-foreground underline' href='login'>
              Log In
            </Link>
          </div>
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

export default SignUpPage
