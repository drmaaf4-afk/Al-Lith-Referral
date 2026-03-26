'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setMessage('')

    if (!email.trim()) {
      setMessage('Please enter your email.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Magic link sent to your email.')
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1>Al Lith Referral</h1>
          <p className="small">
            Sign in with your approved email address.
          </p>

          <label>Email</label>
          <input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={handleLogin} disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>

          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </main>
  )
}
