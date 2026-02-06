import Link from 'next/link'
import { Utensils, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem',
      background: 'var(--background)',
      padding: '2rem'
    }}>
      {/* Main Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: '800',
          color: 'var(--foreground)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          letterSpacing: '-0.02em'
        }}>
          <Utensils size={60} style={{ color: 'var(--foreground)' }} />
          Food Pass
        </h1>

        <p style={{
          color: 'var(--foreground-muted)',
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          maxWidth: '500px',
          margin: '0 auto 0.5rem'
        }}>
          Event Food Management System
        </p>

        <p style={{
          color: 'var(--foreground-muted)',
          fontSize: '0.875rem',
          opacity: 0.7
        }}>
          © SYBINZPRODUCTION
        </p>
      </div>

      {/* CTA Button */}
      <Link
        href="/login"
        className="btn btn-primary"
        style={{
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        Login to Portal <ArrowRight size={20} />
      </Link>
    </main>
  )
}
