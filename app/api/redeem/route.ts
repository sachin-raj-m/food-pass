import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    if (!profile || !['vendor', 'volunteer'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden: Only vendors/volunteers can redeem' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
        return NextResponse.json({ error: 'Invalid QR payload: Missing ID' }, { status: 400 })
    }

    const { data, error } = await (supabase.rpc as any)('redeem_coupon', { coupon_uuid: id })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Coupon Redeemed!' })
}
