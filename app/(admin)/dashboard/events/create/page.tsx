'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateEventPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        venue: '',
        event_date: '',
        start_time: '',
        end_time: '',
        coupon_expiry_time: '', // full timestamp
    })

    // Helper to handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Construct full ISO string for coupon_expiry_time
        // Ideally user picks a date+time. For MVP let's assume it's on the event date or user picks full datetime.
        // HTML datetime-local input helps.

        // We need to ensure types match DB (TIME vs TIMESTAMPTZ vs DATE)
        // event_date is DATE (YYYY-MM-DD)
        // start_time / end_time is TIME (HH:MM)
        // coupon_expiry_time is TIMESTAMPTZ

        // Assuming formData.coupon_expiry_time is from datetime-local input (YYYY-MM-DDTHH:MM)
        // It needs to be converted to ISO with timezone if needed, usually direct value works or `new Date(val).toISOString()`

        const expiryISO = new Date(formData.coupon_expiry_time).toISOString()

        const { error } = await (supabase.from('events') as any).insert({
            title: formData.title,
            venue: formData.venue,
            event_date: formData.event_date,
            start_time: formData.start_time, // HH:MM
            end_time: formData.end_time,     // HH:MM
            coupon_expiry_time: expiryISO
        })

        if (error) {
            alert('Error creating event: ' + error.message)
            setLoading(false)
        } else {
            router.push('/dashboard/events')
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/dashboard/events" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginBottom: '1rem' }}>
                <ArrowLeft size={20} />
                Back to Events
            </Link>

            <div className="card">
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>Create New Event</h1>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label className="label">Event Title</label>
                        <input name="title" className="input" required value={formData.title} onChange={handleChange} placeholder="e.g. Annual Tech Conference Lunch" />
                    </div>

                    <div>
                        <label className="label">Venue</label>
                        <input name="venue" className="input" required value={formData.venue} onChange={handleChange} placeholder="e.g. Hall A, Main Convention Center" />
                    </div>

                    <div>
                        <label className="label">Event Date</label>
                        <input type="date" name="event_date" className="input" required value={formData.event_date} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Start Time</label>
                            <input type="time" name="start_time" className="input" required value={formData.start_time} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="label">End Time</label>
                            <input type="time" name="end_time" className="input" required value={formData.end_time} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="label">Coupon Expiry Time</label>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Coupons will be invalid after this time.</p>
                        <input type="datetime-local" name="coupon_expiry_time" className="input" required value={formData.coupon_expiry_time} onChange={handleChange} />
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
