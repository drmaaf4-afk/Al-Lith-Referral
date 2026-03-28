'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    if (!cleanEmail || !cleanPassword) {
      setMessage('Please enter email and password.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1>Doctor Login</h1>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <button onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {message ? <div className="message">{message}</div> : null}

          <div className="message" style={{ marginTop: '16px' }}>
            First time here? <a href="/signup">Create account</a>
          </div>
        </div>
      </div>
    </main>
  )
}
