import { readFileSync } from 'fs'
import { join } from 'path'

interface ResetOTPTemplateProps {
  otp: string
}

export function getResetOTPTemplate({ otp }: ResetOTPTemplateProps): string {
  // Read the template file from public/templates
  const templatePath = join(
    process.cwd(),
    'public',
    'templates',
    'reset-otp.html'
  )
  let template = readFileSync(templatePath, 'utf-8')

  // Prepare replacement values
  const otpFormatted = otp.split('').join(' ')
  const otpNoSpaces = otp
  const year = new Date().getFullYear().toString()

  // Replace placeholders
  template = template.replace(/\$\{\{otp\}\}/g, otpFormatted)
  template = template.replace(/\$\{\{otpNoSpaces\}\}/g, otpNoSpaces)
  template = template.replace(/\$\{\{year\}\}/g, year)

  return template
}

// For React component usage (if needed)
export function ResetOTPTemplate({ otp }: ResetOTPTemplateProps) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: getResetOTPTemplate({ otp })
      }}
    />
  )
}
