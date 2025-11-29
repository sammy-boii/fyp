'use server'

import { getResetOTPTemplate } from '@/components/templates/reset-otp-template'
import { tryCatch } from '@/lib/utils'
import { prisma } from '@shared/db/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendResetOTP(email: string) {
  return tryCatch(async () => {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new Error('User by that email not found')
    }

    const otp = generateOTP()

    const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 10) // adding 10 minutes

    await prisma.user.update({
      where: {
        email
      },
      data: {
        otp,
        otpExpiresAt
      }
    })

    return await resend.emails.send({
      from: `Flux <noreply@${process.env.RESEND_FROM_DOMAIN}>`,
      to: [email],
      subject: 'Reset your password',
      html: getResetOTPTemplate({ otp })
    })
  })
}

export async function verifyResetOTP(email: string, otp: string) {
  return tryCatch(async () => {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new Error('User by that email not found')
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new Error('No OTP set for this user')
    }

    if (user.otp !== otp) {
      throw new Error('Invalid OTP')
    }

    if (user.otpExpiresAt < new Date()) {
      throw new Error('OTP has expired. Please request a new one')
    }

    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpiresAt: null }
    })
  })
}
