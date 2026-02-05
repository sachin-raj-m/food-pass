

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Filter } from 'lucide-react'

export default function DashboardPage() {
    const [stats, setStats] = useState({ generated: 0, redeemed: 0, redemptionRate: '0' })
    const [recentEvents, setRecentEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
        end: new Date().toISOString().split('T')[0]
    })

    const supabase = createClient()

    useEffect(() => {
        fetchDashboardData()
    }, [dateRange])

    const fetchDashboardData = async () => {
        setLoading(true)

        // 1. Apply Date Filters to Global Stats
        let queryGenerated = supabase.from('coupons').select('*', { count: 'exact', head: true })
        let queryRedeemed = supabase.from('redemptions').select('*', { count: 'exact', head: true })

        if (dateRange.start) {
            queryGenerated = queryGenerated.gte('created_at', `${dateRange.start}T00:00:00`)
            queryRedeemed = queryRedeemed.gte('redeemed_at', `${dateRange.start}T00:00:00`)
        }
        if (dateRange.end) {
            queryGenerated = queryGenerated.lte('created_at', `${dateRange.end}T23:59:59`)
            queryRedeemed = queryRedeemed.lte('redeemed_at', `${dateRange.end}T23:59:59`)
        }

        const [
            { count: generated },
            { count: redeemed },
            { data: events }
        ] = await Promise.all([
            queryGenerated,
            queryRedeemed,
            supabase.from('events').select('*').order('event_date', { ascending: false }).limit(5)
        ])

        const rate = generated ? ((redeemed || 0) / generated * 100).toFixed(1) : '0'

        setStats({
            generated: generated || 0,
            redeemed: redeemed || 0,
            redemptionRate: rate
        })

        if (events) {
            // Fetch stats for each event
            const eventsWithStats = await Promise.all((events as any[]).map(async (event) => {
                const { count: total } = await supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('event_id', event.id)
                const { count: used } = await supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'used')
                return { ...event, stats: { total: total || 0, used: used || 0 } }
            }))
            setRecentEvents(eventsWithStats)
        }

        setLoading(false)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Dashboard</h1>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                    <Filter size={16} color="#94a3b8" />
                    <input
                        type="date"
                        className="input"
                        style={{ marginBottom: 0, padding: '0.25rem', width: 'auto', border: 'none', background: 'transparent' }}
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span style={{ color: '#94a3b8' }}>to</span>
                    <input
                        type="date"
                        className="input"
                        style={{ marginBottom: 0, padding: '0.25rem', width: 'auto', border: 'none', background: 'transparent' }}
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 className="label">Coupons Generated</h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>In selected period</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.generated}</p>
                </div>
                <div className="card">
                    <h3 className="label">Coupons Redeemed</h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>In selected period</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.redeemed}</p>
                </div>
                <div className="card">
                    <h3 className="label">Redemption Rate</h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Based on selection</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.redemptionRate}%</p>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                    <h3>Recent Events Performance</h3>
                    <Link href="/dashboard/events" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>View All</Link>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : recentEvents.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>No events matches.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentEvents.map(event => (
                            <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--card-border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{event.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                        {new Date(event.event_date).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                        <span style={{ color: '#94a3b8' }}>Generated: <strong style={{ color: 'var(--foreground)' }}>{event.stats.total}</strong></span>
                                        <span style={{ color: '#94a3b8' }}>Redeemed: <strong style={{ color: 'var(--success)' }}>{event.stats.used}</strong></span>
                                        <span style={{ color: '#94a3b8' }}>Rate: <strong style={{ color: 'var(--primary)' }}>{event.stats.total ? ((event.stats.used / event.stats.total) * 100).toFixed(0) : 0}%</strong></span>
                                    </div>
                                </div>
                                <Link href={`/dashboard/events/${event.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                    Manage
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
