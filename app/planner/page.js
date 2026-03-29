'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function dayLabel(dateString) {
  const d = new Date(dateString + 'T08:00:00')
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function getMonthDays(year, month) {
  const days = []
  const total = new Date(year, month + 1, 0).getDate()

  for (let i = 1; i <= total; i++) {
    const d = new Date(year, month, i)
    days.push(formatDate(d))
  }

  return days
}

export default function PlannerPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [scheduleMap, setScheduleMap] = useState({})
  const [doctorNameMap, setDoctorNameMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyDate, setBusyDate] = useState('')
  const [message, setMessage] = useState('')

  const monthDays = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (user?.email) {
      loadDoctors()
      loadSchedule()
    }
  }, [user, currentYear, currentMonth])

  async function initialize() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    setUser(user)

    const { data: doctor } = await supabase
      .from('referral_doctors')
      .select('id, auth_user_id, name, department, role, email')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!doctor) {
      window.location.href = '/'
      return
    }

    setProfile(doctor)
    setLoading(false)
  }

  async function loadDoctors() {
    const { data, error } = await supabase
      .from('referral_doctors')
      .select('email, name')

    if (error) {
      setMessage(error.message)
      return
    }

    const map = {}
    for (const doctor of data || []) {
      map[doctor.email.toLowerCase()] = doctor.name
    }
    setDoctorNameMap(map)
  }

  async function loadSchedule() {
    const start = monthDays[0]
    const end = monthDays[monthDays.length - 1]

    const { data, error } = await supabase
      .from('duty_schedule')
      .select('*')
      .gte('duty_date', start)
      .lte('duty_date', end)
      .order('duty_date', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    const map = {}
    for (const row of data || []) {
      map[row.duty_date] = row
    }
    setScheduleMap(map)
  }

  async function bookMyself(dutyDate) {
    if (!user?.email) return

    setBusyDate(dutyDate)
    setMessage('')

    const email = user.email.toLowerCase()
    const existing = scheduleMap[dutyDate]

    if (!existing) {
      const { error } = await supabase
        .from('duty_schedule')
        .insert([
          {
            duty_date: dutyDate,
            doctor_1_email: email,
            doctor_2_email: null,
          },
        ])

      if (error) {
        setMessage(error.message)
      } else {
        await loadSchedule()
      }

      setBusyDate('')
      return
    }

    const d1 = existing.doctor_1_email?.toLowerCase() || null
    const d2 = existing.doctor_2_email?.toLowerCase() || null

    if (d1 === email || d2 === email) {
      setMessage('You are already booked on this date.')
      setBusyDate('')
      return
    }

    if (d1 && d2) {
      setMessage('This duty is already full.')
      setBusyDate('')
      return
    }

    const updates = !d1
      ? { doctor_1_email: email }
      : { doctor_2_email: email }

    const { error } = await supabase
      .from('duty_schedule')
      .update(updates)
      .eq('id', existing.id)

    if (error) {
      setMessage(error.message)
    } else {
      await loadSchedule()
    }

    setBusyDate('')
  }

  async function cancelMyBooking(dutyDate) {
    if (!user?.email) return

    setBusyDate(dutyDate)
    setMessage('')

    const email = user.email.toLowerCase()
    const existing = scheduleMap[dutyDate]

    if (!existing) {
      setBusyDate('')
      return
    }

    const d1 = existing.doctor_1_email?.toLowerCase() || null
    const d2 = existing.doctor_2_email?.toLowerCase() || null

    if (d1 !== email && d2 !== email) {
      setMessage('You are not booked on this date.')
      setBusyDate('')
      return
    }

    if (d1 === email && d2) {
      const { error } = await supabase
        .from('duty_schedule')
        .update({
          doctor_1_email: existing.doctor_2_email,
          doctor_2_email: null,
        })
        .eq('id', existing.id)

      if (error) {
        setMessage(error.message)
      } else {
        await loadSchedule()
      }

      setBusyDate('')
      return
    }

    if (d1 === email && !d2) {
      const { error } = await supabase
        .from('duty_schedule')
        .delete()
        .eq('id', existing.id)

      if (error) {
        setMessage(error.message)
      } else {
        await loadSchedule()
      }

      setBusyDate('')
      return
    }

    if (d2 === email) {
      const { error } = await supabase
        .from('duty_schedule')
        .update({
          doctor_2_email: null,
        })
        .eq('id', existing.id)

      if (error) {
        setMessage(error.message)
      } else {
        await loadSchedule()
      }
    }

    setBusyDate('')
  }

  function previousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Duty Planner</h1>
            <div className="message">Loading...</div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1>Duty Planner</h1>

          <div className="message">
            <strong>{profile?.name}</strong>
            <br />
            {profile?.email}
            <br />
            {profile?.department}
          </div>

          <div className="planner-nav">
            <button onClick={previousMonth}>Previous</button>
            <div className="planner-title">{monthLabel(currentYear, currentMonth)}</div>
            <button onClick={nextMonth}>Next</button>
          </div>

          <div className="message">
            Duty hours: <strong>08:00 → 08:00</strong> (24h)
            <br />
            Maximum: <strong>2 doctors per day</strong>
          </div>

          {message ? <div className="message">{message}</div> : null}

          <div className="planner-list">
            {monthDays.map((dutyDate) => {
              const row = scheduleMap[dutyDate]
              const d1 = row?.doctor_1_email?.toLowerCase() || null
              const d2 = row?.doctor_2_email?.toLowerCase() || null
              const myEmail = user?.email?.toLowerCase() || ''
              const mine = d1 === myEmail || d2 === myEmail
              const count = [d1, d2].filter(Boolean).length
              const full = count >= 2

              return (
                <div className="day-card" key={dutyDate}>
                  <div className="day-header">
                    <strong>{dayLabel(dutyDate)}</strong>
                    <span>{dutyDate}</span>
                  </div>

                  <div className="day-time">08:00 → next day 08:00</div>

                  <div className="day-doctors">
                    <div>
                      Doctor 1:{' '}
                      {d1 ? doctorNameMap[d1] || d1 : '—'}
                    </div>
                    <div>
                      Doctor 2:{' '}
                      {d2 ? doctorNameMap[d2] || d2 : '—'}
                    </div>
                  </div>

                  <div className={`day-status ${full ? 'status-full' : 'status-open'}`}>
                    Status: {count}/2 {full ? 'FULL' : 'available'}
                  </div>

                  {mine ? (
                    <button
                      onClick={() => cancelMyBooking(dutyDate)}
                      disabled={busyDate === dutyDate}
                    >
                      {busyDate === dutyDate ? 'Please wait...' : 'Cancel My Booking'}
                    </button>
                  ) : (
                    <button
                      onClick={() => bookMyself(dutyDate)}
                      disabled={busyDate === dutyDate || full}
                    >
                      {busyDate === dutyDate
                        ? 'Please wait...'
                        : full
                        ? 'Full'
                        : 'Book Myself'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ height: '12px' }} />

          <a href="/">
            <button>Back to Dashboard</button>
          </a>
        </div>
      </div>
    </main>
  )
}
