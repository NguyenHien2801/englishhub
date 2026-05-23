import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as object)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/vocabulary', '/grammar', '/exam', '/ai-chat', '/level-test', '/admin']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  // Chưa đăng nhập mà vào trang bảo vệ → về login
  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse

  // ❌ Bỏ hẳn đoạn redirect user về dashboard
  // Để login page tự redirect sau khi đăng nhập thành công
}