import { AppSidebar } from '@/components/layout/AppSidebar'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'
import '@xyflow/react/dist/style.css'

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className='flex w-screen'>
      <div className='absolute top-4 right-4'>
        <AnimatedThemeToggler />
      </div>
      <aside>
        <AppSidebar />
      </aside>
      <main className='grow'>{children}</main>
    </main>
  )
}
