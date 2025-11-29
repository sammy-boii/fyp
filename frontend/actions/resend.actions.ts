'use server'

import { ResetOTPTemplate } from '@/components/templates/reset-otp-template'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendResetOTP(email: string) {
  return await resend.emails.send({
    from: `Flux <${process.env.RESEND_FROM_DOMAIN}>`,
    to: [email],
    subject: 'Hello world',
    html: `<p>Hello world</p>`
  })
}
