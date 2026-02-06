import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params are promise in Next 15/App Router usually not, but let's await if needed or treat as obj. App Router in newer Next versions changed params to promise? No, it's just an object. But let's be safe.
) {
    // Await params if it's a promise (Next.js 15 breaking change potentially, but safe to await)
    const { id: eventId } = await params

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    // We don't need to set cookies here usually
                },
            },
        }
    )

    // 1. Check Admin Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()

    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 2. Parse Body
    const { count, meal_type } = await request.json()
    const numCoupons = parseInt(count)

    if (isNaN(numCoupons) || numCoupons <= 0 || numCoupons > 1000) {
        return NextResponse.json({ error: 'Invalid count (max 1000)' }, { status: 400 })
    }

    if (!['breakfast', 'lunch', 'snacks', 'dinner'].includes(meal_type)) {
        return NextResponse.json({ error: 'Invalid meal type' }, { status: 400 })
    }

    // 3. Fetch Event Details & Check Duplicates
    const { data: event } = await (supabase.from('events') as any).select('*').eq('id', eventId).single()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Check if coupons already exist for this event + meal_type
    const { count: existingCount } = await (supabase.from('coupons') as any)
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('meal_type', meal_type)

    if (existingCount && existingCount > 0) {
        return NextResponse.json({ error: `Coupons for ${meal_type} already generated for this event.` }, { status: 400 })
    }

    // Generate date prefix from event date (DDMMYY format)
    const eventDate = new Date(event.event_date)
    const day = String(eventDate.getDate()).padStart(2, '0')
    const month = String(eventDate.getMonth() + 1).padStart(2, '0')
    const year = String(eventDate.getFullYear()).slice(-2) // Get last 2 digits of year
    const datePrefix = parseInt(`${day}${month}${year}`) // e.g., 060226 for Feb 6, 2026

    // Get the current max ticket number for this event to find the sequence
    const { data: maxTicket } = await (supabase.from('coupons') as any)
        .select('ticket_number')
        .eq('event_id', eventId)
        .order('ticket_number', { ascending: false })
        .limit(1)
        .maybeSingle()

    // Extract the sequence number from the max ticket (last 2 digits)
    let sequence = 1
    if (maxTicket) {
        const maxTicketStr = String(maxTicket.ticket_number)
        const lastTwoDigits = maxTicketStr.slice(-2)
        sequence = parseInt(lastTwoDigits) + 1
    }

    // 4. Generate Coupons
    const newCoupons = []

    for (let i = 0; i < numCoupons; i++) {
        const id = crypto.randomUUID()
        // Date-prefixed ticket number: DDMMYY + sequence (e.g., 06022601)
        const currentSequence = sequence + i
        const ticketNumber = datePrefix * 100 + currentSequence

        newCoupons.push({
            id,
            event_id: eventId,
            meal_type: meal_type,
            expires_at: event.coupon_expiry_time,
            status: 'unused',
            ticket_number: ticketNumber
        })
    }

    // 5. Bulk Insert
    const { error } = await (supabase.from('coupons') as any).insert(newCoupons)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return coupons without signature, just ID and EventID is enough for frontend to generate QR if needed, or we just rely on DB fetch result
    return NextResponse.json({ success: true, coupons: newCoupons.map(c => ({ id: c.id, event_id: c.event_id })) })
}
