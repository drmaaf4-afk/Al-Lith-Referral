'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Page() {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    setChecking(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    if (!user?.email) {
      setProfile(null)
      setChecking(false)
      return
    }

    const { data } = await supabase
      .from('referral_doctors')
      .select('id, name, department, role, email')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()

    setProfile(data || null)
    setChecking(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

  if (!user) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Al Lith Referral</h1>
            <div className="message">You are not logged in.</div>

            <a href="/login">
              <button>Login</button>
            </a>

            <div style={{ height: '12px' }} />

            <a href="/signup">
              <button>Create Account</button>
            </a>
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Al Lith Referral</h1>
            <div className="message">
              Your account is signed in, but no doctor profile was found.
            </div>
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

          <div className="message">
            <strong>Name:</strong> {profile.name}
            <br />
            <strong>Email:</strong> {profile.email}
            <br />
            <strong>Department:</strong> {profile.department}
            <br />
            <strong>Role:</strong> {profile.role}
          </div>

          <a href="/planner">
            <button>Open Duty Planner</button>
          </a>

          <div style={{ height: '12px' }} />

          <button onClick={logout}>Logout</button>
        </div>
      </div>
    </main>
  )
}
