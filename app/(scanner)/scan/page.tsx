'use client'

import { useState, useEffect } from 'react'
import QRScanner from '@/components/QRScanner'
import { CheckCircle, XCircle, RefreshCw, Camera, Scan, BarChart3, Keyboard } from 'lucide-react'

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)
    const [scanning, setScanning] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [sessionStats, setSessionStats] = useState({ verified: 0, rejected: 0 })
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
    const [manualEntry, setManualEntry] = useState(false)
    const [ticketCode, setTicketCode] = useState('')

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
            setSessionStats(prev => ({ ...prev, verified: prev.verified + 1 }))
            setShowSuccessAnimation(true)

        } catch (err: any) {
            let userMessage = err.message

            // Provide more specific error messages
            if (err.message === 'Missing ID') {
                userMessage = 'This QR code is not a valid food ticket'
            } else if (err.message.includes('Invalid QR')) {
                userMessage = 'Unable to read QR code. Please try again'
            } else if (err.message.includes('already used')) {
                userMessage = 'This ticket has already been redeemed'
            } else if (err.message.includes('expired')) {
                userMessage = 'This ticket has expired'
            } else if (err.message.includes('Unauthorized') || err.message.includes('Forbidden')) {
                userMessage = 'You are not authorized to redeem tickets'
            }

            setScanResult({
                success: false,
                message: userMessage
            })
            setSessionStats(prev => ({ ...prev, rejected: prev.rejected + 1 }))
        } finally {
            setProcessing(false)
        }
    }

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ticketCode.trim()) return

        setScanning(false)  // Now hide the input form
        setProcessing(true)
        setManualEntry(false)

        try {
            const res = await fetch('/api/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ticket_number: ticketCode.trim() })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Verification Failed')
            }

            setScanResult({
                success: true,
                message: 'Ticket Valid! Food Served.'
            })
            setSessionStats(prev => ({ ...prev, verified: prev.verified + 1 }))
            setShowSuccessAnimation(true)
            setTicketCode('')

        } catch (err: any) {
            let userMessage = err.message

            if (err.message.includes('not found')) {
                userMessage = 'Ticket number not found'
            } else if (err.message.includes('already used')) {
                userMessage = 'This ticket has already been redeemed'
            } else if (err.message.includes('expired')) {
                userMessage = 'This ticket has expired'
            }

            setScanResult({
                success: false,
                message: userMessage
            })
            setSessionStats(prev => ({ ...prev, rejected: prev.rejected + 1 }))
            setTicketCode('')
        } finally {
            setProcessing(false)
        }
    }

    const resetScanner = () => {
        setScanResult(null)
        setScanning(true)
        setShowSuccessAnimation(false)
        setManualEntry(false)
        setTicketCode('')
    }

    const toggleManualEntry = () => {
        setManualEntry(!manualEntry)
        // Keep scanning=true so we stay in the input mode (not result mode)
    }

    useEffect(() => {
        if (showSuccessAnimation) {
            const timer = setTimeout(() => setShowSuccessAnimation(false), 1500)
            return () => clearTimeout(timer)
        }
    }, [showSuccessAnimation])

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', minHeight: '100vh' }}>

            {/* Header with Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Scan size={32} style={{ color: 'var(--primary)' }} />
                        Ticket Scanner
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Scan QR codes to verify and redeem tickets</p>
                </div>

                {(sessionStats.verified > 0 || sessionStats.rejected > 0) && (
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                            <CheckCircle size={18} color="var(--success)" />
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Verified</div>
                                <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.25rem' }}>{sessionStats.verified}</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                            <XCircle size={18} color="var(--error)" />
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Rejected</div>
                                <div style={{ color: 'var(--error)', fontWeight: 600, fontSize: '1.25rem' }}>{sessionStats.rejected}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {scanning ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
                        <button
                            onClick={() => { setManualEntry(false); setScanning(true); }}
                            className={!manualEntry ? "btn btn-primary" : "btn btn-outline"}
                            style={{ flex: '1 1 0', maxWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <Camera size={18} />
                            Scan QR
                        </button>
                        <button
                            onClick={toggleManualEntry}
                            className={manualEntry ? "btn btn-primary" : "btn btn-outline"}
                            style={{ flex: '1 1 0', maxWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <Keyboard size={18} />
                            Enter Code
                        </button>
                    </div>

                    {manualEntry ? (
                        /* Manual Entry Form */
                        <div className="card" style={{ width: '100%', padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Keyboard size={20} />
                                Enter Ticket Number
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Type the ticket number from the coupon (e.g., BF01, DRLU25, or 101)
                            </p>
                            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={ticketCode}
                                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                                    placeholder="e.g., BF01, DRLU25, 101"
                                    autoFocus
                                    style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.05em', fontWeight: 600 }}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!ticketCode.trim()}
                                    style={{ fontSize: '1.1rem', padding: '0.875rem' }}
                                >
                                    Verify Ticket
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* QR Scanner Mode */
                        <>
                            {/* Instructions Card */}
                            <div className="card" style={{ width: '100%', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Camera size={20} />
                                    How to Scan
                                </h3>
                                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#d4d4d4', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                    <li>Allow camera access when prompted</li>
                                    <li>Position the QR code within the scanning frame</li>
                                    <li>Hold steady - scanner will automatically detect the code</li>
                                    <li>Wait for verification result</li>
                                </ol>
                            </div>

                            {/* Scanner */}
                            <QRScanner onScan={handleScan} />
                        </>
                    )}
                </div>
            ) : processing ? (
                <div className="card" style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <RefreshCw className="spin" size={56} style={{ marginBottom: '1.5rem', color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Verifying Ticket...</h3>
                    <p style={{ color: '#94a3b8' }}>Please wait</p>
                </div>
            ) : (
                <div className={showSuccessAnimation ? "card success-pulse" : "card"} style={{
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    width: '100%',
                    border: scanResult?.success ? '2px solid var(--success)' : '2px solid var(--error)',
                    background: scanResult?.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    boxShadow: scanResult?.success ? '0 0 40px rgba(16, 185, 129, 0.2)' : '0 0 40px rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {scanResult?.success ? (
                        <>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.5rem',
                                animation: showSuccessAnimation ? 'successPulse 0.6s ease' : 'none'
                            }}>
                                <CheckCircle size={56} color="var(--success)" strokeWidth={2.5} />
                            </div>
                            <h2 style={{ color: 'var(--success)', marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 700 }}>VERIFIED ✓</h2>
                            <p style={{ fontSize: '1.15rem', color: '#e5e5e5', marginBottom: '0.5rem' }}>{scanResult.message}</p>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Ticket successfully redeemed</p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <XCircle size={56} color="var(--error)" strokeWidth={2.5} />
                            </div>
                            <h2 style={{ color: 'var(--error)', marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 700 }}>REJECTED ✗</h2>
                            <p style={{ fontSize: '1.15rem', color: '#e5e5e5' }}>{scanResult?.message}</p>
                        </>
                    )}

                    <div style={{ marginTop: '2.5rem', width: '100%', maxWidth: '300px' }}>
                        <button className="btn btn-primary" onClick={resetScanner} style={{ width: '100%', justifyContent: 'center', padding: '1.1rem', fontSize: '1.05rem', fontWeight: 600 }}>
                            <RefreshCw size={20} style={{ marginRight: '0.75rem' }} />
                            Scan Next Ticket
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes successPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                .success-pulse {
                    animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    )
}
