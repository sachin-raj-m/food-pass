import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Using Promise pattern for params to be safe with Next.js 15 if applicable
) {
    const { id: eventId } = await params

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

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch Coupons
    const { data: coupons, error } = await supabase
        .from('coupons')
        .select('id, event_id, status, created_at, ticket_number, meal_type')
        .eq('event_id', eventId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ coupons })
}
