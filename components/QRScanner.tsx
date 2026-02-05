'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, AlertCircle } from 'lucide-react'
import styles from './qr-scanner.module.css'

interface QRScannerProps {
    onScan: (decodedText: string) => void
    onError?: (error: any) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [permissionError, setPermissionError] = useState<string | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const containerId = 'qr-reader-container'

    const startScanning = async () => {
        setPermissionError(null)
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(containerId)
            }

            await scannerRef.current.start(
                { facingMode: "environment" }, // Force rear camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    stopScanning()
                    onScan(decodedText)
                },
                (errorMessage) => {
                    // Ignore frame parse errors
                }
            )
            setIsScanning(true)
        } catch (err: any) {
            console.error("Error starting scanner:", err)
            setPermissionError("Camera permission denied or not available. Please allow camera access.")
        }
    }

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop()
                setIsScanning(false)
            } catch (err) {
                console.error("Failed to stop scanner", err)
            }
        }
    }

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error)
            }
        }
    }, [])

    return (
        <div className={styles.wrapper} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
                id={containerId}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: isScanning ? '1px solid var(--primary)' : '1px dashed var(--card-border)',
                    background: '#000',
                    minHeight: '300px',
                    display: isScanning ? 'block' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {!isScanning && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        {permissionError ? (
                            <div style={{ color: 'var(--destructive)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <AlertCircle size={48} />
                                <p>{permissionError}</p>
                                <button className="btn btn-outline" onClick={startScanning}>Try Again</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Camera size={40} color="#a3a3a3" />
                                </div>
                                <p style={{ color: '#a3a3a3' }}>Scan ticket QR code to redeem</p>
                                <button className="btn btn-primary" onClick={startScanning} style={{ padding: '0.75rem 2rem' }}>
                                    Open Scanner
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isScanning && (
                <button className="btn btn-outline" onClick={stopScanning} style={{ marginTop: '1.5rem' }}>
                    Stop Scanning
                </button>
            )}
        </div>
    )
}
