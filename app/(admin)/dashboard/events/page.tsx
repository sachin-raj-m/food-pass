'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, MapPin, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Event {
    id: string
    title: string
    venue: string
    event_date: string
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('events')
            .select('id, title, venue, event_date')
            .order('event_date', { ascending: false })

        if (!error && data) {
            setEvents(data)
        }
        setLoading(false)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Events</h1>
                <Link href="/dashboard/events/create" className="btn btn-primary">
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Create Event
                </Link>
            </div>

            {loading ? (
                <p>Loading events...</p>
            ) : events.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>No events found. Create your first event to get started.</p>
                    <Link href="/dashboard/events/create" className="btn btn-outline">
                        Create Event
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {events.map((event) => (
                        <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{event.title}</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={16} />
                                    {new Date(event.event_date).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} />
                                    {event.venue}
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                                <Link href={`/dashboard/events/${event.id}`} className="btn btn-outline" style={{ width: '100%', fontSize: '0.9rem' }}>
                                    Manage & Coupons
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
