'use client'

import { useState } from 'react'
import QRScanner from '@/components/QRScanner'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)
    const [scanning, setScanning] = useState(true)
    const [processing, setProcessing] = useState(false)

    const handleScan = async (decodedText: string) => {
        setScanning(false)
        setProcessing(true)

        try {
            // Parse JSON
            let payload
            try {
                payload = JSON.parse(decodedText)
                // Ensure payload has id (we don't strictly need eid or sig anymore)
                if (!payload.id) throw new Error('Missing ID')
            } catch (e) {
                throw new Error('Invalid QR Format')
            }

            // Call API
            const res = await fetch('/api/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: payload.id })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Redemption Failed')
            }

            setScanResult({
                success: true,
                message: 'Coupon Valid! Food Served.'
            })

        } catch (err: any) {
            setScanResult({
                success: false,
                message: err.message
            })
        } finally {
            setProcessing(false)
        }
    }

    const resetScanner = () => {
        setScanResult(null)
        setScanning(true)
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '1rem' }}>

            {scanning ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Scan Ticket</h2>
                    <QRScanner onScan={handleScan} />
                </div>
            ) : processing ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <RefreshCw className="spin" size={48} style={{ marginBottom: '1.5rem', color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.25rem' }}>Verifying Ticket...</h3>
                </div>
            ) : (
                <div className="card" style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    width: '100%',
                    border: scanResult?.success ? '1px solid var(--success)' : '1px solid var(--destructive)',
                    background: '#0a0a0a',
                    boxShadow: scanResult?.success ? '0 0 30px rgba(16, 185, 129, 0.2)' : '0 0 30px rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {scanResult?.success ? (
                        <>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <CheckCircle size={48} color="var(--success)" />
                            </div>
                            <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '1.75rem' }}>VERIFIED</h2>
                            <p style={{ fontSize: '1.1rem', color: '#d4d4d4' }}>{scanResult.message}</p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <XCircle size={48} color="var(--destructive)" />
                            </div>
                            <h2 style={{ color: 'var(--destructive)', marginBottom: '0.5rem', fontSize: '1.75rem' }}>REJECTED</h2>
                            <p style={{ fontSize: '1.1rem', color: '#d4d4d4' }}>{scanResult?.message}</p>
                        </>
                    )}

                    <div style={{ marginTop: '2.5rem', width: '100%' }}>
                        <button className="btn btn-primary" onClick={resetScanner} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                            <RefreshCw size={20} style={{ marginRight: '0.5rem' }} />
                            Verify Next Ticket
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
