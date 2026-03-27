'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setMessage('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const cleanDepartment = department.trim()

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanDepartment) {
      setMessage('Please complete all fields.')
      return
    }

    if (cleanPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      const userId = data?.user?.id

      if (!userId) {
        setMessage('Account created, but no user ID returned.')
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase
        .from('referral_doctors')
        .insert([
          {
            auth_user_id: userId,
            email: cleanEmail,
            name: cleanName,
            department: cleanDepartment,
            role: 'doctor',
          },
        ])

      if (profileError) {
        setMessage(profileError.message)
        setLoading(false)
        return
      }

      setMessage('Account created successfully. You can now log in.')
      setName('')
      setEmail('')
      setPassword('')
      setDepartment('')
    } catch {
      setMessage('Something went wrong.')
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1>Doctor Sign Up</h1>

          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

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

          <label>Department</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Emergency, Internal Medicine"
          />

          <button onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {message ? <div className="message">{message}</div> : null}

          <div className="message" style={{ marginTop: '16px' }}>
            Already have an account? <a href="/login">Login here</a>
          </div>
        </div>
      </div>
    </main>
  )
}
