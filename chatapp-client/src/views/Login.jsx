import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Login() {
  const [mobilenumber, setMobilenumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!mobilenumber || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        mobilenumber: mobilenumber.trim(),
        password,
      })

      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        navigate('/')
      } else {
        setError(response.data.message || 'Login failed.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f0f2f5', padding: 16,
    }}>
      {/* Top teal bar like WhatsApp */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 222,
        backgroundColor: '#00A884', zIndex: 0,
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 460, backgroundColor: '#fff',
        borderRadius: 4, boxShadow: '0 17px 50px 0 rgba(0,0,0,.19), 0 12px 15px 0 rgba(0,0,0,.24)',
        padding: '48px 40px', position: 'relative', zIndex: 1,
      }}>
        {/* WhatsApp Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            backgroundColor: '#00A884', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* WhatsApp-style chat icon */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 400, color: '#41525d', marginBottom: 4 }}>
            Log in to SecretChat
          </h2>
          <p style={{ fontSize: 14, color: '#8696a0' }}>
            Enter your phone number and password
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FFF0F0', color: '#ea0038', fontSize: 14,
            padding: '10px 16px', borderRadius: 4, marginBottom: 20, textAlign: 'center',
            border: '1px solid #ffcdd2',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Mobile Number */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#008069', fontWeight: 500, marginBottom: 8 }}>
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. 01712345678"
              value={mobilenumber}
              onChange={(e) => setMobilenumber(e.target.value)}
              style={{
                width: '100%', padding: '10px 0', border: 'none',
                borderBottom: '2px solid #00A884', fontSize: 16,
                color: '#111b21', outline: 'none', backgroundColor: 'transparent',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderBottomColor = '#00A884'}
              onBlur={(e) => e.target.style.borderBottomColor = mobilenumber ? '#00A884' : '#ccc'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#008069', fontWeight: 500, marginBottom: 8 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '10px 0', border: 'none',
                borderBottom: '2px solid #ccc', fontSize: 16,
                color: '#111b21', outline: 'none', backgroundColor: 'transparent',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderBottomColor = '#00A884'}
              onBlur={(e) => e.target.style.borderBottomColor = password ? '#00A884' : '#ccc'}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: 4, border: 'none',
              backgroundColor: '#00A884', color: '#fff', fontSize: 16,
              fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'background-color 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#008069' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#00A884' }}
          >
            {loading ? <span className="wa-spinner" /> : 'LOG IN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#667781', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#00A884', fontWeight: 500, textDecoration: 'none' }}>
            Register now
          </Link>
        </p>
      </div>
    </div>
  )
}
