import { AppSidebar } from '@/components/layout/AppSidebar'
import { WalkthroughProvider } from '@/components/walkthrough/WalkthroughProvider'
import '@xyflow/react/dist/style.css'

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className='flex w-screen'>
      <aside>
        <AppSidebar />
      </aside>
      <main className='grow'>
        <WalkthroughProvider />
        {children}
      </main>
    </main>
  )
}
