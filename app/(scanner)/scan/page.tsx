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
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

            {scanning ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Scan Customer Coupon</h2>
                    <QRScanner onScan={handleScan} />
                </div>
            ) : processing ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <RefreshCw className="spin" size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                    <h3>Verifying Coupon...</h3>
                </div>
            ) : (
                <div className="card" style={{
                    padding: '3rem',
                    textAlign: 'center',
                    width: '100%',
                    border: scanResult?.success ? '2px solid var(--success)' : '2px solid var(--error)',
                    background: scanResult?.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                }}>
                    {scanResult?.success ? (
                        <>
                            <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>VALID COUPON</h2>
                            <p style={{ fontSize: '1.2rem' }}>{scanResult.message}</p>
                        </>
                    ) : (
                        <>
                            <XCircle size={64} color="var(--error)" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>INVALID / ERROR</h2>
                            <p style={{ fontSize: '1.2rem' }}>{scanResult?.message}</p>
                        </>
                    )}

                    <div style={{ marginTop: '2rem' }}>
                        <button className="btn btn-primary" onClick={resetScanner}>
                            <RefreshCw size={20} style={{ marginRight: '0.5rem' }} />
                            Scan Next
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
