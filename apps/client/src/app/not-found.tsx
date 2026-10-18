/* eslint-disable react/jsx-no-literals -- rendered outside [locale], so no messages are loaded; English by design (WH-051). */
import Link from 'next/link';

/**
 * Last-resort 404 outside `[locale]` (invalid locale, matcher gaps) — WH-051.
 * Own html/body because the root layout is a pass-through.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '2rem',
          color: '#111',
          background: '#fafafa',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>404</p>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.75rem' }}>
          Page not found
        </h1>
        <p style={{ margin: '0.75rem 0 0', color: '#555', maxWidth: '28rem' }}>
          That link doesn&apos;t match anything on WorkHub.
        </p>
        <Link
          href="/en"
          style={{
            marginTop: '1.5rem',
            color: '#0f766e',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
      </body>
    </html>
  );
}
