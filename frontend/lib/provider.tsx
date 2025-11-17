'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Tooltip } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient()) // lazy init

  return (
    <>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <Toaster richColors />
          <Tooltip>
            <SidebarProvider>{children}</SidebarProvider>
          </Tooltip>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  )
}
