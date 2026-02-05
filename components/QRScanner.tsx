'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import styles from './qr-scanner.module.css'

interface QRScannerProps {
    onScan: (decodedText: string) => void
    onError?: (error: any) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const containerId = 'qr-reader-container'

    useEffect(() => {
        // Initialize scanner
        // Use timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            if (!scannerRef.current) {
                const scanner = new Html5QrcodeScanner(
                    containerId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                        rememberLastUsedCamera: true
                    },
          /* verbose= */ false
                )

                scannerRef.current = scanner

                scanner.render(
                    (decodedText) => {
                        scanner.clear() // Stop scanning after success
                        onScan(decodedText)
                    },
                    (errorMessage) => {
                        if (onError) onError(errorMessage)
                    }
                )
            }
        }, 100)

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
            }
        }
    }, [onScan, onError])

    return (
        <div className={styles.wrapper}>
            <div id={containerId} className={styles.scanner}></div>
            <p className={styles.instructions}>Point camera at QR Code</p>
        </div>
    )
}
