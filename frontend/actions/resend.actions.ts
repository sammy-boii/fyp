'use server'

import { getResetOTPTemplate } from '@/components/templates/reset-otp-template'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendResetOTP(email: string) {
  const otp = generateOTP()

  return await resend.emails.send({
    from: `Flux <noreply@${process.env.RESEND_FROM_DOMAIN}>`,
    to: [email],
    subject: 'Reset your password',
    html: getResetOTPTemplate({ otp })
  })
}
