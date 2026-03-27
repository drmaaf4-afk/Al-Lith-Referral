'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Page() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [authorized, setAuthorized] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    handleAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleAuth() {
    setChecking(true)

    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')

    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
      window.history.replaceState({}, document.title, '/')
    }

    await checkUser()
    setChecking(false)
  }

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    if (!user?.email) {
      setAuthorized(null)
      return
    }

    const { data, error } = await supabase
      .from('referral_doctors')
      .select('id, full_name, role')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()

    if (error || !data) {
      setAuthorized(false)
    } else {
      setAuthorized(true)
    }
  }

  async function login() {
    setMessage('')

    if (!email.trim()) {
      setMessage('Please enter your email')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Magic link sent. Check your email.')
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setAuthorized(null)
    setMessage('')
  }

  if (checking) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Al Lith Referral</h1>
            <div className="message">Checking login...</div>
          </div>
        </div>
      </main>
    )
  }

  if (user && authorized === true) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Al Lith Referral</h1>
            <p className="small">Signed in as {user.email}</p>
            <div className="message">Authorized user. Dashboard will be built next.</div>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </main>
    )
  }

  if (user && authorized === false) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Al Lith Referral</h1>
            <div className="message">This email is not authorized.</div>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1>Al Lith Referral</h1>
          <p className="small">Sign in with your approved email address.</p>

          <label>Email</label>
          <input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={login} disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>

          {message ? <div className="message">{message}</div> : null}
        </div>
      </div>
    </main>
  )
}
