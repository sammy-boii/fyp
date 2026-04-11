import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

const authPages = [
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-otp',
  '/reset-password'
]

const publicPages = ['/demo']

const matchesPath = (pathname: string, page: string) => {
  return pathname === page || pathname.startsWith(`${page}/`)
}

export async function middleware(req: NextRequest) {
  const cookiesStore = await cookies()
  const token = cookiesStore.get('token')?.value
  const pathname = req.nextUrl.pathname

  const isAuthPage = authPages.some((page) => matchesPath(pathname, page))
  const isPublicPage = publicPages.some((page) => matchesPath(pathname, page))

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (!isAuthPage && !isPublicPage && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  // must be a literal, cannot be dynamic ;-;
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
