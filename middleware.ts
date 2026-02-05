import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        if(!supabaseUrl || !supabaseKey) {
            console.error('Middleware: Missing Supabase Environment Variables')
    return NextResponse.next()
}

const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) =>
                    request.cookies.set(name, value)
                )
                response = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
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
}

// 2. Scan Protection (Vendor/Volunteer)
if (path.startsWith('/scan')) {
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

return response
    } catch (e) {
    console.error('Middleware Error:', e)
    // Ensure the app doesn't crash, but maybe specific paths will fail. 
    // Returning default response is safer than 500.
    return NextResponse.next({
        request: {
            headers: request.headers,
        },
    })
}
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
