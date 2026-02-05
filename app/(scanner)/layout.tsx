'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function ScannerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.replace('/login')
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: '1rem',
                background: 'var(--card-bg)',
                borderBottom: '1px solid var(--card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Food Pass Scanner</div>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                    <LogOut size={20} color="var(--error)" />
                </button>
            </header>

            <main style={{ flex: 1, padding: '1rem' }}>
                {children}
            </main>
        </div>
    )
}
