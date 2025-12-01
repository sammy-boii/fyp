import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

const authPages = [
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-otp',
  '/reset-password'
]

export async function middleware(req: NextRequest) {
  const cookiesStore = await cookies()
  const token = cookiesStore.get('token')?.value
  const pathname = req.nextUrl.pathname

  // includes() doesn't account for trailing / and query params
  const isAuthPage = authPages.some((page) => pathname.startsWith(page))

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  // must be a literal, cannot be dynamic ;-;
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
