'use client'

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
import Link from 'next/link'
import { ZapIcon } from 'lucide-react'
import { MdLock } from 'react-icons/md'
import { IoIosMail } from 'react-icons/io'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useState, useTransition } from 'react'
import { LuLogIn } from 'react-icons/lu'
import { toast } from 'sonner'
import { loginSchema } from '@/schema/auth.schema'
import { TLoginForm } from '@/types/auth.types'
import { login } from '@/actions/auth.actions'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  const [credentials, setCredentials] = useState<TLoginForm>({
    email: '',
    password: ''
  })

  const [isPending, startTransition] = useTransition()

  async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault()

    const parsedCredentials = loginSchema.safeParse(credentials)

    if (!parsedCredentials.success) {
      return toast.error('Invalid credentials')
    }

    startTransition(async () => {
      const { error } = await login(parsedCredentials.data)

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Logged in successfully')
      router.replace('/dashboard')
    })
  }

  return (
    <div className={'flex max-w-md w-full flex-col gap-6'}>
      <Card>
        <CardHeader className='text-left'>
          <div className='flex items-center gap-4'>
            <ZapIcon className='size-6' />
            <CardTitle className='text-2xl'>Welcome Back!</CardTitle>
          </div>
          <CardDescription>Login with your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4'>
              <div className='grid gap-4'>
                <div className='grid group relative gap-3'>
                  <IoIosMail
                    size={19}
                    className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[59%]'
                  />
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    onChange={(evt) =>
                      setCredentials((prev) => ({
                        ...prev,
                        email: evt.target.value
                      }))
                    }
                    value={credentials.email}
                    id='email'
                    type='email'
                    className='pl-10'
                    placeholder='Enter your email'
                    required
                  />
                </div>
                <div className='grid group relative gap-3'>
                  <div className='flex items-center'>
                    <MdLock
                      size={18}
                      className='absolute group-focus-within:text-foreground left-3 text-muted-foreground top-[59%]'
                    />

                    <div
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='cursor-pointer absolute right-3 top-[60%]'
                    >
                      {!showPassword ? (
                        <FaEye size={16} />
                      ) : (
                        <FaEyeSlash size={16} />
                      )}
                    </div>

                    <Label htmlFor='password'>Password</Label>
                    <Link
                      href='/forgot-password'
                      className='ml-auto text-xs hover:text-foreground text-muted-foreground'
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    onChange={(evt) => {
                      setCredentials((prev) => ({
                        ...prev,
                        password: evt.target.value
                      }))
                    }}
                    placeholder='Enter your password'
                    className='pl-10'
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                  />
                </div>
                <Button
                  disabled={isPending}
                  isLoading={isPending}
                  type='submit'
                  className='w-full flex gap-2 items-center'
                >
                  Login
                  <LuLogIn />
                </Button>
              </div>

              <div className='flex items-center pt-2 gap-2'>
                <div className='bg-muted h-px flex-1' />
                <div className='text-muted-foreground text-xs'>OR</div>
                <div className='bg-muted h-px flex-1' />
              </div>

              <div className='text-center text-muted-foreground text-sm'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/signup'
                  className='hover:underline text-foreground underline-offset-4'
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
