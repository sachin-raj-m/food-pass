import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { },
            },
        }
    )

    // 1. Check Admin Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Init Admin Client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server misconfigured (Missing Service Role Key)' }, { status: 500 })
    }

    // Use supabase-js plain client for admin actions (ssr client doesn't support service_role easily for auth admin)
    const supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 3. Parse Body
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!['vendor', 'volunteer', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 4. Create User
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm
    })

    if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!newUser.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create Profile
    const { error: profileError } = await (supabaseAdmin.from('profiles') as any).insert({
        id: newUser.user.id,
        email: newUser.user.email,
        role: role
    })

    if (profileError) {
        // Rollback user creation if profile fails? 
        // Ideally yes, but for MVP we just return error. User exists in Auth but not Profile.
        // Clean up:
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: newUser.user })
}

export async function GET(request: Request) {
    // List users (profiles)
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { },
            },
        }
    )

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check Admin
    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch all profiles
    const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ users: profiles })
}
export async function PATCH(request: Request) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { },
            },
        }
    )

    // 1. Check Admin Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse Body
    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
        return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 })
    }

    if (!['vendor', 'volunteer', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 3. Update Profile using Service Role (to ensure permission bypass if needed, though admin usually can update)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Server Config Error' }, { status: 500 })

    const supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { persistSession: false } }
    )

    const { error } = await (supabaseAdmin.from('profiles') as any)
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Role updated successfully' })
}
