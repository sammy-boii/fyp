'use client'

import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'

const sendEmailFormSchema = z.object({
  to: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required')
})

export function ReadEmailForm() {
  const form = useForm<z.infer<typeof sendEmailFormSchema>>({
    resolver: zodResolver(sendEmailFormSchema),
    defaultValues: {
      to: '',
      subject: '',
      body: ''
    }
  })

  return (
    <form className='flex flex-col gap-4'>
      <FieldGroup>
        <FieldLabel>To</FieldLabel>
        <FieldDescription>Recipient email address</FieldDescription>
        <Controller
          control={form.control}
          name='to'
          render={({ field }) => (
            <Input
              type='email'
              placeholder='recipient@example.com'
              {...field}
            />
          )}
        />
        <FieldError>{form.formState.errors.to?.message}</FieldError>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Subject</FieldLabel>
        <FieldDescription>Email subject line</FieldDescription>
        <Controller
          control={form.control}
          name='subject'
          render={({ field }) => (
            <Input type='text' placeholder='Enter subject' {...field} />
          )}
        />
        <FieldError>{form.formState.errors.subject?.message}</FieldError>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Body</FieldLabel>
        <FieldDescription>Email message content</FieldDescription>
        <Controller
          control={form.control}
          name='body'
          render={({ field }) => (
            <InputGroup>
              <InputGroupTextarea
                placeholder='Enter your message...'
                rows={6}
                {...field}
              />
            </InputGroup>
          )}
        />
        <FieldError>{form.formState.errors.body?.message}</FieldError>
      </FieldGroup>
    </form>
  )
}
