import * as React from 'react'

interface ResetOTPTemplateProps {
  firstName: string
}

export function ResetOTPTemplate({ firstName }: ResetOTPTemplateProps) {
  return (
    <div>
      <h1>Welcome, {firstName}!</h1>
    </div>
  )
}
