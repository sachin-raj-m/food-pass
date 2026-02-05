'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

export type ModalVariant = 'default' | 'danger' | 'success'

interface ModalProps {
    isOpen: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: ModalVariant
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
}

export default function Modal({
    isOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
    isLoading
}: ModalProps) {
    if (!isOpen) return null

    const variants = {
        default: {
            icon: <Info size={24} className="text-blue-500" style={{ color: 'var(--primary)' }} />,
            confirmBg: 'var(--primary)',
            confirmBorder: 'var(--primary)',
            headerColor: 'var(--foreground)'
        },
        danger: {
            icon: <AlertTriangle size={24} className="text-red-500" style={{ color: 'var(--destructive)' }} />,
            confirmBg: 'var(--destructive)',
            confirmBorder: 'var(--destructive)',
            headerColor: 'var(--destructive)' // Optional: make title red
        },
        success: {
            icon: <CheckCircle size={24} className="text-green-500" style={{ color: 'var(--success)' }} />,
            confirmBg: 'var(--success)',
            confirmBorder: 'var(--success)',
            headerColor: 'var(--success)'
        }
    }

    const currentVariant = variants[variant]

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99
        }}>
            <div style={{
                background: '#0a0a0a',
                border: '1px solid var(--card-border)',
                borderRadius: '1rem',
                padding: '2rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {currentVariant.icon}
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.2 }}>
                    {title}
                </h3>

                <p style={{ color: '#a3a3a3', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.6 }}>
                    {description}
                </p>

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-outline"
                        style={{ flex: 1, justifyContent: 'center' }}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-primary"
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            background: currentVariant.confirmBg,
                            borderColor: currentVariant.confirmBorder
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
            <style jsx global>{`
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
