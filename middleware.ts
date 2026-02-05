import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // 1. Dashboard Protection (Admin)
    if (path.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Note: Checking profile role here requires DB access which middleware isn't great for performance-wise.
        // Better handled in Layout or Page, but we can prevent basic unauthorized access.
    }

    // 2. Scan Protection (Vendor/Volunteer)
    if (path.startsWith('/scan')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 3. Login Redirect (If already logged in)
    if (path === '/login' && user) {
        // We should ideally redirect to their respective home, but we don't know role easily here without cookie metadata.
        // For now let them go to login page, but the Login Page useEffect can auto-redirect them if we wanted.
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (svg, png, jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    ],
}
