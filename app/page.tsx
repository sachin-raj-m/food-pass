import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem',
      background: 'radial-gradient(circle at center, rgb(30, 41, 59) 0%, rgb(15, 23, 42) 100%)'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Food Pass
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Event Food Management System</p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          Login to Portal
        </Link>
      </div>
    </main>
  )
}
