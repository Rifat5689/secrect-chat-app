import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.Capacitor ? 'http://localhost:5000' : 'https://secrect-chat-app.onrender.com')
const API_URL = import.meta.env.VITE_API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.Capacitor ? 'http://localhost:5000' : 'https://encrypts-deazb0b0aadygxed.centralindia-01.azurewebsites.net')

export default function Register() {
  const [name, setName] = useState('')
  const [mobilenumber, setMobilenumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name || !mobilenumber || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (mobilenumber.length < 8 || mobilenumber.length > 15) {
      setError('Mobile number must be between 8 and 15 digits.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name: name.trim(),
        mobilenumber: mobilenumber.trim(),
        password,
      })

      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        navigate('/')
      } else {
        setError(response.data.message || 'Registration failed.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-app)', padding: 16,
      transition: 'background-color var(--transition-smooth)',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 200,
        backgroundColor: 'var(--bg-header)', zIndex: 0,
        transition: 'background-color var(--transition-smooth)',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 440, backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
        padding: '44px 36px', position: 'relative', zIndex: 1,
        border: '1px solid var(--border-color)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px',
            backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color var(--transition-smooth)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Join SecretChat to start messaging
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FFF0F0', color: 'var(--danger)', fontSize: 13,
            padding: '10px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, textAlign: 'center',
            border: '1px solid #ffcdd2',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--primary)', fontWeight: 500, marginBottom: 8 }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sc-input"
              style={{ padding: '12px 14px' }}
            />
          </div>

          {/* Mobile Number */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--primary)', fontWeight: 500, marginBottom: 8 }}>
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. 01712345678"
              value={mobilenumber}
              onChange={(e) => setMobilenumber(e.target.value)}
              className="sc-input"
              style={{ padding: '12px 14px' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--primary)', fontWeight: 500, marginBottom: 8 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sc-input"
              style={{ padding: '12px 14px' }}
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="sc-btn sc-btn-primary"
            style={{
              width: '100%', padding: '14px 24px', fontSize: 15,
              fontWeight: 600, opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <span className="sc-spinner" /> : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
