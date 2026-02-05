'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    const bgColors = {
        success: 'rgba(22, 163, 74, 0.1)',
        error: 'rgba(220, 38, 38, 0.1)',
        info: 'rgba(37, 99, 235, 0.1)'
    }

    const borderColors = {
        success: '#16a34a', // green-600
        error: '#dc2626',   // red-600
        info: '#2563eb'     // blue-600
    }

    const icons = {
        success: <CheckCircle size={20} color={borderColors.success} />,
        error: <AlertCircle size={20} color={borderColors.error} />,
        info: <Info size={20} color={borderColors.info} />
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: '#0a0a0a',
            border: `1px solid ${borderColors[type]}`,
            borderLeft: `4px solid ${borderColors[type]}`,
            borderRadius: '0.5rem',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: `0 4px 20px -5px ${bgColors[type]}`,
            color: 'white',
            zIndex: 100,
            animation: 'slideIn 0.3s ease-out'
        }}>
            {icons[type]}
            <span style={{ fontSize: '0.95rem' }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', marginLeft: '0.5rem' }}>
                <X size={16} />
            </button>
            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
