'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from './login.module.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Check role to redirect appropriate dashboard
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await (supabase.from('profiles') as any)
                    .select('*')
                    .eq('id', user.id) // Changed from session.user.id to user.id for syntactic correctness
                    .single()

                if (profile?.role === 'admin') {
                    router.push('/dashboard')
                } else if (profile?.role === 'vendor' || profile?.role === 'volunteer') {
                    router.push('/scan')
                } else {
                    router.replace('/')
                }
            }
        }
    }

    return (
        <div className={styles.container}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginBottom: '1rem', textDecoration: 'none', fontSize: '0.9rem' }}>
                <ArrowLeft size={18} />
                Back to Home
            </Link>

            <div className={`card ${styles.loginCard}`}>
                <h2 className={styles.title}>Welcome Back</h2>
                <p className={styles.subtitle}>Sign in to access Food Pass</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className={styles.formGroup}>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}
