import React from 'react'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className='grid w-full place-items-center min-h-screen'>
      {children}
    </main>
  )
}

export default AuthLayout
