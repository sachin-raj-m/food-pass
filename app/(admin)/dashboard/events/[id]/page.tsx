'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, RefreshCw, Ticket, Check, X } from 'lucide-react'
import Link from 'next/link'
// Dynamic imports moved to functions: QRCode, JSZip, file-saver
import Toast, { ToastType } from '@/components/Toast'
import Modal from '@/components/Modal'

interface Coupon {
    id: string
    event_id: string
    ticket_number: number
    meal_type: string
}

interface MealStat {
    meal_type: string
    total_count: number
    used_count: number
}

export default function EventDetailsPage() {
    const params = useParams()
    const eventId = params.id as string
    const supabase = createClient()
    const [event, setEvent] = useState<any>(null)
    const [stats, setStats] = useState<MealStat[]>([])
    const [genCount, setGenCount] = useState(10)
    const [mealType, setMealType] = useState('lunch')
    const [generating, setGenerating] = useState(false)
    const [downloading, setDownloading] = useState(false)

    // UI States
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    const [redemptionLogs, setRedemptionLogs] = useState<any[]>([])

    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [lastGenCount, setLastGenCount] = useState(0)

    useEffect(() => {
        if (eventId) {
            fetchEventDetails()
            fetchStats()
            fetchRedemptionLogs()
        }
    }, [eventId])

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type })
    }

    const fetchEventDetails = async () => {
        const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
        setEvent(data)
    }

    const fetchStats = async () => {
        const { data, error } = await (supabase as any).rpc('get_event_stats', { event_uuid: eventId })
        if (data) {
            setStats(data as MealStat[])
        } else if (error) {
            console.error('Stats error:', error)
        }
    }

    const fetchRedemptionLogs = async () => {
        const { data: coupons } = await supabase.from('coupons').select('id').eq('event_id', eventId)
        if (!coupons || coupons.length === 0) return

        const couponIds = (coupons as any[]).map(c => c.id)

        const { data: logs } = await supabase
            .from('redemptions')
            .select('*, profiles(email)')
            .in('coupon_id', couponIds)
            .order('redeemed_at', { ascending: false })
            .limit(20)

        if (logs) setRedemptionLogs(logs)
    }

    const handleGenerate = async () => {
        setShowConfirmModal(false)
        setGenerating(true)
        try {
            const res = await fetch(`/api/events/${eventId}/generate-coupons`, {
                method: 'POST',
                body: JSON.stringify({ count: genCount, meal_type: mealType })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setLastGenCount(data.coupons.length)
            setShowSuccessModal(true)
            fetchStats()
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setGenerating(false)
        }
    }

    const handleDownloadZip = async () => {
        setDownloading(true)
        try {
            const res = await fetch(`/api/events/${eventId}/coupons`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            const coupons: Coupon[] = data.coupons
            if (coupons.length === 0) {
                showToast('No coupons to download.', 'info')
                return
            }

            const JSZip = (await import('jszip')).default
            const zip = new JSZip()
            const folder = zip.folder(`coupons-${eventId.slice(0, 8)}`)

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const width = 600
            const height = 400
            canvas.width = width
            canvas.height = height

            if (!ctx) throw new Error('Could not get canvas context')

            for (const coupon of coupons) {
                ctx.fillStyle = '#0a0a0a'
                ctx.fillRect(0, 0, width, height)

                // Glow Border
                ctx.strokeStyle = '#262626'
                ctx.lineWidth = 1
                ctx.strokeRect(20, 20, width - 40, height - 40)

                // Header
                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 24px Inter, sans-serif'
                ctx.textAlign = 'left'
                ctx.fillText('FOOD PASS', 50, 70)

                // Ticket Number
                ctx.fillStyle = '#737373'
                ctx.font = '16px monospace'
                ctx.textAlign = 'right'
                ctx.fillText(`TICKET #${coupon.ticket_number || '---'}`, width - 50, 70)

                // Event Title
                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 32px Inter, sans-serif'
                ctx.textAlign = 'left'
                ctx.fillText(event.title, 50, 140)

                // Details (Meal, Date)
                ctx.font = '20px Inter, sans-serif'
                ctx.fillStyle = '#a3a3a3'
                ctx.fillText(`${new Date(event.event_date).toLocaleDateString()} • ${event.venue}`, 50, 180)

                // MEAL TYPE Badge
                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 24px Inter, sans-serif'
                ctx.fillText(`MEAL: ${(coupon.meal_type || 'STANDARD').toUpperCase()}`, 50, 240)

                // QR Code
                const QRCode = (await import('qrcode')).default
                const qrPayload = JSON.stringify({ id: coupon.id })
                const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 150, margin: 1, color: { dark: '#ffffff', light: '#00000000' } })

                await new Promise<void>((resolve) => {
                    const img = new Image()
                    img.onload = () => {
                        ctx.drawImage(img, width - 180, height - 180, 130, 130)
                        resolve()
                    }
                    img.src = qrDataUrl
                })

                // Footer ID
                ctx.font = '12px monospace'
                ctx.fillStyle = '#404040'
                ctx.textAlign = 'left'
                ctx.fillText(coupon.id, 50, 350)

                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve))
                if (blob) {
                    folder?.file(`ticket-${coupon.ticket_number || coupon.id.slice(0, 8)}.png`, blob)
                }
            }

            const { saveAs } = (await import('file-saver'))

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `tickets-${event.title.replace(/\s+/g, '-').toLowerCase()}.zip`)
            showToast('Tickets downloaded successfully!', 'success')

        } catch (err: any) {
            showToast('Error downloading tickets: ' + err.message, 'error')
        } finally {
            setDownloading(false)
        }
    }

    if (!event) return <div className="container">Loading...</div>

    const totalRedeemed = stats.reduce((acc, curr) => acc + curr.used_count, 0)
    const totalGenerated = stats.reduce((acc, curr) => acc + curr.total_count, 0)

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Modal
                isOpen={showSuccessModal}
                title="Generation Successful"
                description={`Successfully generated ${lastGenCount} tickets. Would you like to download them now?`}
                confirmText="Download Tickets"
                cancelText="Later"
                onConfirm={() => {
                    setShowSuccessModal(false)
                    handleDownloadZip()
                }}
                onCancel={() => setShowSuccessModal(false)}
            />

            <Modal
                isOpen={showConfirmModal}
                title="Generate Coupons"
                description={`Are you sure you want to generate ${genCount} coupons for ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}? This action cannot be undone.`}
                confirmText="Generate"
                onConfirm={handleGenerate}
                onCancel={() => setShowConfirmModal(false)}
                isLoading={generating}
            />

            <Link href="/dashboard/events" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginBottom: '1rem' }}>
                <ArrowLeft size={20} />
                Back to Events
            </Link>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{event.title}</h1>
                        <div style={{ display: 'flex', gap: '2rem', color: '#94a3b8' }}>
                            <span>{event.venue}</span>
                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => { fetchStats(); fetchRedemptionLogs(); }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Stats Grid */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="label" style={{ marginBottom: '1.5rem' }}>Meal Breakdown</h3>

                    {stats.length === 0 ? (
                        <p style={{ color: '#525252' }}>No coupons generated yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {stats.map((stat) => {
                                const rate = stat.total_count ? (stat.used_count / stat.total_count) * 100 : 0
                                return (
                                    <div key={stat.meal_type} style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{stat.meal_type}</span>
                                            <span style={{ color: '#a3a3a3' }}>{stat.used_count} / {stat.total_count}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#262626', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${rate}%`,
                                                height: '100%',
                                                background: 'var(--success)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#737373' }}>Total Redemption</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {totalRedeemed} <span style={{ fontSize: '1rem', color: '#525252', fontWeight: 400 }}>/ {totalGenerated}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="label">Generate Coupons</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                        <select
                            className="input"
                            style={{ marginBottom: 0, width: 'auto' }}
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="snacks">Snacks</option>
                            <option value="dinner">Dinner</option>
                        </select>
                        <input
                            type="number"
                            className="input"
                            style={{ marginBottom: 0, width: '100px' }}
                            value={genCount}
                            onChange={(e) => setGenCount(parseInt(e.target.value))}
                            min={1}
                            max={1000}
                        />
                        <button className="btn btn-primary" onClick={() => setShowConfirmModal(true)} disabled={generating}>
                            {generating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 className="label">Actions</h3>
                    <button className="btn btn-outline" onClick={handleDownloadZip} disabled={downloading || totalGenerated === 0} style={{ width: '100%', justifyContent: 'center' }}>
                        <Download size={20} style={{ marginRight: '0.5rem' }} />
                        {downloading ? 'Zipping...' : 'Download Tickets'}
                    </button>
                </div>
            </div>

            {/* Redemption Logs */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Recent Redemptions</h3>

                {redemptionLogs.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>No redemptions yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                                    <th style={{ padding: '0.5rem' }}>Time</th>
                                    <th style={{ padding: '0.5rem' }}>Redeemed By</th>
                                    <th style={{ padding: '0.5rem' }}>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {redemptionLogs.map(log => (
                                    <tr key={log.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                                        <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(log.redeemed_at).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 0.5rem' }}>{log.profiles?.email || 'Unknown'}</td>
                                        <td style={{ padding: '0.75rem 0.5rem', textTransform: 'capitalize' }}>{log.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
