import { Heart } from 'lucide-react'

export default function Footer() {
    return (
        <footer style={{
            width: '100%',
            padding: '1.5rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'var(--background)',
            color: 'var(--muted)',
            fontSize: '0.875rem',
            marginTop: 'auto'
        }}>
            <p style={{
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                maxWidth: 'fit-content'
            }}>
                Developed with{' '}
                <Heart
                    size={14}
                    fill="var(--error)"
                    color="var(--error)"
                    style={{
                        animation: 'heartbeat 2s ease-in-out infinite',
                        flexShrink: 0
                    }}
                />{' '}
                by{' '}
                <a
                    href="https://mulearn.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'opacity 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    μLearn Foundation
                </a>
            </p>
        </footer>
    )
}
