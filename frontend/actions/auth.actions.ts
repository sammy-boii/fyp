'use server'

import { tryCatch } from '@/lib/utils'
import { signupFormSchema } from '@/schema/auth.schema'
import { TLoginForm, TSignUpForm } from '@/types/auth.types'
import { prisma } from '@shared/db/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function signUp(data: TSignUpForm) {
  return tryCatch(async () => {
    const parsedData = signupFormSchema.parse(data)

    const findUser = await prisma.user.findUnique({
      where: { email: parsedData.email }
    })

    if (findUser) {
      throw new Error('User by that email already exists')
    }

    const hashedPassword = await bcrypt.hash(parsedData.password, 10)

    const newUser = await prisma.user.create({
      data: {
        name: parsedData.name,
        email: parsedData.email,
        password: hashedPassword
      }
    })

    return newUser
  })
}

export async function login(data: TLoginForm) {
  return tryCatch(async () => {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      omit: {
        password: false // select works too but u have to select all fields u need
      }
    })

    if (!user) {
      throw new Error('No user by that email')
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return user
  })
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
}
