import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { MessageSquareCode, Lock, Phone, User } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
    <div className="min-h-screen flex items-center justify-center bg-radial from-indigo-950 via-slate-900 to-black p-4 text-slate-100">
      {/* Background Decorative Blobs */}
      <div className="absolute w-[300px] h-[300px] bg-indigo-600/15 blur-[80px] rounded-full top-20 left-20 animate-pulse"></div>
      <div className="absolute w-[350px] h-[350px] bg-purple-600/10 blur-[90px] rounded-full bottom-20 right-20 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-600/30">
            <MessageSquareCode className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-white">Create Account</h2>
          <p className="text-sm text-slate-400 mt-1">Get started with secure messaging</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm text-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Mobile Number"
              value={mobilenumber}
              onChange={(e) => setMobilenumber(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm text-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              placeholder="Password (Min. 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl outline-none transition-all text-sm text-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
