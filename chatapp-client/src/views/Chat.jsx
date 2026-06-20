import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import {
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Plus,
  Search,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  Smile,
  X,
  Check,
  CheckCheck,
  User as UserIcon,
  Moon,
  Sun,
  Trash2,
  MoreVertical,
  ChevronRight,
  Info
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  'Gestures & Body': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
  'Hearts & Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '✍️', '🌟', '⭐', '✨', '⚡', '💥', '🔥', '🌈', '☀️', '🌙', '☁️', '❄️', '💤', '🎵', '🎶', '🔔', '🔕', '💤', '💬', '💭', '🗯️']
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export default function Chat() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const myData = JSON.parse(localStorage.getItem('user') || '{}')

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  // UI state
  const [activeTab, setActiveTab] = useState('chats') // 'chats', 'requests', 'settings'
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [newFriendMobile, setNewFriendMobile] = useState('')
  const [addFriendError, setAddFriendError] = useState('')
  const [addFriendSuccess, setAddFriendSuccess] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Friends & Messages States
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeFriend, setActiveFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')

  // Reactions & Menu states
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)
  const [reactionMsgId, setReactionMsgId] = useState(null)
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null)
  const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false)

  // Drawer contact details
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Socket
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Typing state
  const [friendTypingId, setFriendTypingId] = useState(null)
  const [amTyping, setAmTyping] = useState(false)

  // Media uploading optimistic state
  const [uploadingFiles, setUploadingFiles] = useState([]) // Array of { id, type, previewUrl, progress }

  // Load friends and requests
  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const friendsRes = await axios.get(`${API_URL}/api/friends`, config)
      if (friendsRes.data.success) {
        setFriends(friendsRes.data.data.friends)
      }
      const reqsRes = await axios.get(`${API_URL}/api/friends/requests/pending`, config)
      if (reqsRes.data.success) {
        setPendingRequests(reqsRes.data.data.requests)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  // Effect to boot app
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    // Apply Theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)

    fetchData()

    // Initialize Socket
    const socket = io(API_URL, {
      auth: { token: `Bearer ${token}` }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 Connected to websocket gateway')
    })

    // Listeners
    socket.on('message:receive', ({ message }) => {
      // Append if it is from the active friend
      if (activeFriend && (message.sender._id === activeFriend._id || message.receiver === activeFriend._id)) {
        setMessages((prev) => [...prev, message])
        socket.emit('message:read', { senderId: activeFriend._id })
      } else {
        // Increment unread count or refresh list
        fetchData()
      }
    })

    socket.on('message:delivered', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, status: 'delivered' } : msg))
      )
    })

    socket.on('message:read', ({ readBy }) => {
      if (activeFriend && readBy === activeFriend._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.status !== 'read' ? { ...msg, status: 'read' } : msg))
        )
      }
    })

    socket.on('message:deleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, isDeletedForEveryone: true, text: 'This message was deleted.', messageType: 'text', fileUrl: '' }
            : msg
        )
      )
    })

    socket.on('message:reaction', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      )
    })

    socket.on('friend:online', ({ userId }) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: true } : f))
      )
      if (activeFriend && activeFriend._id === userId) {
        setActiveFriend((prev) => ({ ...prev, isOnline: true }))
      }
    })

    socket.on('friend:offline', ({ userId, lastSeen }) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: false, lastSeen } : f))
      )
      if (activeFriend && activeFriend._id === userId) {
        setActiveFriend((prev) => ({ ...prev, isOnline: false, lastSeen }))
      }
    })

    socket.on('friend:request', () => {
      showToast('📩 New friend request received!')
      fetchData()
    })

    socket.on('friend:accepted', ({ friend }) => {
      showToast(`🎉 Friend request accepted by ${friend.name}!`)
      fetchData()
    })

    socket.on('typing:start', ({ senderId }) => {
      if (activeFriend && senderId === activeFriend._id) {
        setFriendTypingId(senderId)
      }
    })

    socket.on('typing:stop', ({ senderId }) => {
      if (activeFriend && senderId === activeFriend._id) {
        setFriendTypingId(null)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [token, activeFriend?._id, theme])

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, uploadingFiles])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Select Friend Chat
  const selectFriend = async (friend) => {
    setActiveFriend(friend)
    setIsDrawerOpen(false)
    setMessages([])
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.get(`${API_URL}/api/messages/conversation/${friend._id}`, config)
      if (res.data.success) {
        setMessages(res.data.data.messages)
        // Mark as read in server
        socketRef.current?.emit('message:read', { senderId: friend._id })
      }
    } catch (err) {
      console.error('Error fetching conversation:', err)
    }
  }

  // Log Out
  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  // Add Friend Handler
  const handleAddFriend = async (e) => {
    e.preventDefault()
    setAddFriendError('')
    setAddFriendSuccess('')
    if (!newFriendMobile.trim()) return

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.post(`${API_URL}/api/friends/request`, { mobilenumber: newFriendMobile.trim() }, config)
      if (res.data.success) {
        setAddFriendSuccess(res.data.message || 'Friend request sent!')
        setNewFriendMobile('')
        fetchData()
        setTimeout(() => setIsAddFriendOpen(false), 2000)
      }
    } catch (err) {
      setAddFriendError(err.response?.data?.message || 'Could not send request.')
    }
  }

  // Respond to Request
  const handleRequestResponse = async (requesterId, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      if (action === 'accept') {
        const res = await axios.put(`${API_URL}/api/friends/accept/${requesterId}`, {}, config)
        if (res.data.success) {
          showToast('Friend request accepted!')
          fetchData()
        }
      } else {
        const res = await axios.delete(`${API_URL}/api/friends/reject/${requesterId}`, config)
        if (res.data.success) {
          showToast('Friend request rejected.')
          fetchData()
        }
      }
    } catch (err) {
      showToast('Action failed.')
    }
  }

  // Send Message (Text)
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeFriend) return

    const messagePayload = {
      receiverId: activeFriend._id,
      text: inputText.trim(),
      messageType: 'text',
    }

    socketRef.current?.emit('message:send', messagePayload, (res) => {
      if (res.success) {
        setMessages((prev) => [...prev, res.message])
      }
    })

    setInputText('')
    stopTyping()
  }

  // Typing Indicators
  const handleInputChange = (e) => {
    setInputText(e.target.value)
    if (!activeFriend) return

    if (!amTyping) {
      setAmTyping(true)
      socketRef.current?.emit('typing:start', { receiverId: activeFriend._id })
    }

    // Reset timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 2000)
  }

  const stopTyping = () => {
    if (amTyping && activeFriend) {
      setAmTyping(false)
      socketRef.current?.emit('typing:stop', { receiverId: activeFriend._id })
    }
  }

  // Upload Attachment (Image/Video) to Cloudinary
  const handleUploadFile = async (e, type) => {
    const file = e.target.files[0]
    if (!file || !activeFriend) return

    // Optimistic item id
    const tempId = Date.now()
    const previewUrl = URL.createObjectURL(file)

    // Add optimistic item to file queue
    setUploadingFiles((prev) => [
      ...prev,
      { id: tempId, type, previewUrl, progress: 10 }
    ])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === tempId ? { ...f, progress: percent } : f))
          )
        }
      }

      // API call to Cloudinary uploader route
      const res = await axios.post(`${API_URL}/api/upload`, formData, config)

      if (res.data.success) {
        const fileUrl = res.data.data.url
        const fileType = res.data.data.fileType // "image" or "video"

        // Send via sockets
        const messagePayload = {
          receiverId: activeFriend._id,
          text: '',
          fileUrl,
          messageType: fileType,
        }

        socketRef.current?.emit('message:send', messagePayload, (socketRes) => {
          if (socketRes.success) {
            setMessages((prev) => [...prev, socketRes.message])
          }
        })
      }
    } catch (err) {
      console.error('File upload failed:', err)
      showToast('Failed to upload file.')
    } finally {
      // Clean up optimistic queue
      setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))
      URL.revokeObjectURL(previewUrl)
    }
  }

  // React to Message
  const handleReactMessage = (messageId, emoji) => {
    socketRef.current?.emit('message:react', { messageId, emoji }, (res) => {
      if (res.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? { ...msg, reactions: res.reactions } : msg))
        )
      }
    })
    setReactionMsgId(null)
  }

  // Delete message
  const handleDeleteMessage = async (messageId, target) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const route = target === 'everyone' ? `for-everyone` : `for-me`
      const res = await axios.delete(`${API_URL}/api/messages/${messageId}/${route}`, config)
      if (res.data.success) {
        if (target === 'everyone') {
          // Handled via sockets automatically for target, update local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    isDeletedForEveryone: true,
                    text: 'This message was deleted.',
                    messageType: 'text',
                    fileUrl: '',
                  }
                : msg
            )
          )
        } else {
          // Just remove from local list for me
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
        }
        showToast('Message deleted.')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete message.')
    } finally {
      setActiveMenuMsgId(null)
    }
  }

  // Emoji Insert Helper
  const handleEmojiClick = (emoji) => {
    setInputText((prev) => prev + emoji)
    setIsInputEmojiOpen(false)
  }

  // Format Time
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Format Date Header
  const getMessageDateHeader = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Get initials for Avatar
  const getInitials = (name) => {
    return (name || '?')[0].toUpperCase()
  }

  // Colors list for avatars
  const AVATAR_COLORS = [
    'bg-red-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-teal-500',
  ]
  const getAvatarColor = (name) => {
    let hash = 0
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx]
  }

  // Filter Friends by search
  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.mobilenumber.includes(searchQuery)
  )

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-body relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-indigo-600 border border-indigo-500 text-white font-medium py-3 px-6 rounded-xl shadow-2xl z-[999] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Container split in Sidebar and Chat Screen */}
      <div className="flex h-full w-full max-w-[1600px] mx-auto bg-slate-950/20 md:border-x md:border-slate-800/40 relative">
        {/* ─── SIDEBAR ─── */}
        <aside
          className={`w-full md:w-[380px] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20 transition-all duration-300 ${
            activeFriend ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${getAvatarColor(myData.name)}`}>
                {getInitials(myData.name)}
              </div>
              <div className="leading-tight">
                <h3 className="font-semibold text-sm text-slate-200 font-display">{myData.name}</h3>
                <span className="text-xs text-indigo-400 font-medium">{myData.mobilenumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                title="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsAddFriendOpen(!isAddFriendOpen)}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all ${
                  isAddFriendOpen ? 'rotate-45' : ''
                }`}
                title="Add Friend"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add Friend Slider */}
          {isAddFriendOpen && (
            <form onSubmit={handleAddFriend} className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Add Connection</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Friend's Mobile Number"
                  value={newFriendMobile}
                  onChange={(e) => setNewFriendMobile(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-lg outline-none text-xs text-slate-200 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all"
                >
                  Send
                </button>
              </div>
              {addFriendError && <p className="text-red-500 text-xs mt-1">{addFriendError}</p>}
              {addFriendSuccess && <p className="text-emerald-500 text-xs mt-1">{addFriendSuccess}</p>}
            </form>
          )}

          {/* Search bar */}
          <div className="p-3 border-b border-slate-800/60 bg-slate-900/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search friend or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl outline-none text-xs text-slate-300 focus:border-indigo-600 transition-all focus:ring-1 focus:ring-indigo-600/10"
              />
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-800 p-1.5 gap-1.5 bg-slate-900/20">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chats
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all relative ${
                activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-4 h-4" /> Requests
              {pendingRequests.length > 0 && (
                <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chats' && (
              <div className="divide-y divide-slate-800/40">
                {filteredFriends.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500 leading-relaxed">
                    No friends connected yet.<br />Click the "+" icon above to search and invite friends by mobile number!
                  </p>
                ) : (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend._id}
                      onClick={() => selectFriend(friend)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-3 ${
                        activeFriend?._id === friend._id
                          ? 'bg-slate-800/45 border-indigo-600'
                          : 'border-transparent hover:bg-slate-800/20'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${getAvatarColor(friend.name)}`}>
                          {getInitials(friend.name)}
                        </div>
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-md"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-semibold text-sm text-slate-200 truncate font-display">{friend.name}</h4>
                          <span className="text-[10px] text-slate-500">
                            {friend.isOnline ? 'Active' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{friend.mobilenumber}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pending Invites</h4>
                {pendingRequests.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No pending invites.</p>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req._id} className="bg-slate-950/20 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                      <div className="min-w-0">
                        <h5 className="font-semibold text-xs text-slate-200 truncate">{req.from.name}</h5>
                        <p className="text-[10px] text-indigo-400 truncate">{req.from.mobilenumber}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRequestResponse(req.from._id, 'accept')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[10px] py-1.5 px-3 rounded-lg transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestResponse(req.from._id, 'reject')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] py-1.5 px-3 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-5 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                  <div className="absolute w-[200px] h-[200px] bg-indigo-600/5 blur-[50px] rounded-full -top-10 -right-10 pointer-events-none"></div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-md mb-3 ${getAvatarColor(myData.name)}`}>
                    {getInitials(myData.name)}
                  </div>
                  <h4 className="font-bold text-base text-slate-100 font-display">{myData.name}</h4>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5">{myData.mobilenumber}</p>
                  <div className="bg-indigo-600/10 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full mt-3">
                    Status: Standard User
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings Info</h5>
                  <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-3.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Encryption</span>
                      <span className="text-slate-200 font-medium">E2E Secure (AES)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server Type</span>
                      <span className="text-slate-200 font-medium">NodeJS WebSockets</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage Host</span>
                      <span className="text-slate-200 font-medium">Cloudinary Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ─── CHAT SCREEN PANEL ─── */}
        <main className={`flex-1 flex flex-col h-full bg-slate-950/40 relative z-10 transition-all ${!activeFriend ? 'hidden md:flex' : 'flex'}`}>
          {activeFriend ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setActiveFriend(null)}
                    className="md:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div
                    onClick={() => setIsDrawerOpen(true)}
                    className="relative flex-shrink-0 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${getAvatarColor(activeFriend.name)}`}>
                      {getInitials(activeFriend.name)}
                    </div>
                    {activeFriend.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                    )}
                  </div>
                  <div className="cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
                    <h3 className="font-semibold text-sm text-slate-100 font-display leading-tight">{activeFriend.name}</h3>
                    <p className="text-xs text-slate-400">
                      {friendTypingId === activeFriend._id ? (
                        <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
                      ) : activeFriend.isOnline ? (
                        <span className="text-emerald-400 font-medium">online</span>
                      ) : activeFriend.lastSeen ? (
                        <span>Last seen: {new Date(activeFriend.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span>offline</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="View Contact Details"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/10">
                {messages.length === 0 && uploadingFiles.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This is the beginning of your private chat history with {activeFriend.name}.<br />
                      Send a message to say hello!
                    </p>
                  </div>
                ) : (
                  (() => {
                    let lastHeader = null
                    return (
                      <>
                        {messages.map((msg) => {
                          const dateHeader = getMessageDateHeader(msg.createdAt)
                          const showHeader = dateHeader !== lastHeader
                          lastHeader = dateHeader

                          const isMe = msg.sender._id === myData.id || msg.sender === myData.id

                          return (
                            <React.Fragment key={msg._id}>
                              {showHeader && (
                                <div className="flex justify-center my-4">
                                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full shadow-sm">
                                    {dateHeader}
                                  </span>
                                </div>
                              )}

                              <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                                {/* Quick reaction float toolbar */}
                                {!msg.isDeletedForEveryone && (
                                  <div className={`absolute -top-7 hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-full shadow-xl z-30 transition-all ${
                                    isMe ? 'right-0' : 'left-0'
                                  }`}>
                                    {QUICK_REACTIONS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReactMessage(msg._id, emoji)}
                                        className="hover:scale-130 transition-transform px-1 text-sm text-slate-200"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => {
                                        setEmojiPickerMsgId(msg._id)
                                        setReactionMsgId(null)
                                      }}
                                      className="text-xs text-slate-400 hover:text-white px-1 font-semibold"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {/* Message bubble */}
                                <div
                                  className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md relative group/bubble ${
                                    isMe
                                      ? 'bg-indigo-600 text-white rounded-tr-none'
                                      : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800'
                                  }`}
                                >
                                  {/* Deleted state */}
                                  {msg.isDeletedForEveryone ? (
                                    <p className="text-xs italic text-slate-400 dark:text-slate-500">This message was deleted.</p>
                                  ) : (
                                    <>
                                      {/* File Display */}
                                      {msg.messageType === 'image' && (
                                        <div className="mb-2 rounded-lg overflow-hidden cursor-pointer bg-slate-950/30">
                                          <img
                                            src={msg.fileUrl}
                                            alt="Media sharing"
                                            className="max-h-[220px] object-cover hover:scale-[1.02] transition-transform duration-300"
                                          />
                                        </div>
                                      )}

                                      {msg.messageType === 'video' && (
                                        <div className="mb-2 rounded-lg overflow-hidden bg-slate-950/30">
                                          <video
                                            src={msg.fileUrl}
                                            controls
                                            className="max-h-[220px] max-w-full rounded-lg object-contain"
                                          />
                                        </div>
                                      )}

                                      {/* Message Text */}
                                      {msg.text && (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                      )}
                                    </>
                                  )}

                                  {/* Timestamp and ticks */}
                                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] text-slate-300/80">
                                    <span>{formatTime(msg.createdAt)}</span>
                                    {isMe && !msg.isDeletedForEveryone && (
                                      <span>
                                        {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-slate-300" />}
                                        {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-slate-300" />}
                                        {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                                      </span>
                                    )}
                                  </div>

                                  {/* Message reactions indicator display */}
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="absolute -bottom-2.5 right-3 flex items-center bg-slate-850 border border-slate-800 px-1.5 py-0.5 rounded-full shadow-lg gap-0.5 text-[10px]">
                                      {msg.reactions.map((r, ri) => (
                                        <span key={ri} title={`Reacted by user`} className="cursor-help">
                                          {r.emoji}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Actions dropdown button */}
                                  {!msg.isDeletedForEveryone && (
                                    <button
                                      onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg._id ? null : msg._id)}
                                      className="absolute right-1 top-1.5 hidden group-hover/bubble:flex text-slate-300/60 hover:text-white p-0.5 rounded"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Context Menu for deletes */}
                                  {activeMenuMsgId === msg._id && (
                                    <div className="absolute top-6 right-2 bg-slate-900 border border-slate-850 py-1 rounded-xl shadow-xl z-[50] text-xs font-semibold w-[125px]">
                                      <button
                                        onClick={() => handleDeleteMessage(msg._id, 'me')}
                                        className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-1.5"
                                      >
                                        Delete for me
                                      </button>
                                      {isMe && (
                                        <button
                                          onClick={() => handleDeleteMessage(msg._id, 'everyone')}
                                          className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-red-400 flex items-center gap-1.5 border-t border-slate-850"
                                        >
                                          Delete all
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Custom Extended Emoji Picker overlay for message reactions */}
                              {emojiPickerMsgId === msg._id && (
                                <div className="absolute z-[100] inset-0 bg-slate-950/60 flex items-center justify-center p-4">
                                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full max-w-sm max-h-[300px] flex flex-col shadow-2xl relative">
                                    <button
                                      onClick={() => setEmojiPickerMsgId(null)}
                                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Add Custom Reaction</h4>
                                    <div className="overflow-y-auto flex-1 grid grid-cols-6 gap-2 p-1">
                                      {Object.values(EMOJI_CATEGORIES).flat().slice(0, 36).map((emoji) => (
                                        <button
                                          key={emoji}
                                          onClick={() => {
                                            handleReactMessage(msg._id, emoji)
                                            setEmojiPickerMsgId(null)
                                          }}
                                          className="text-2xl hover:scale-120 active:scale-95 transition-transform"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </>
                    )
                  })()
                )}

                {/* Optimistic files uploading progress bar */}
                {uploadingFiles.map((up) => (
                  <div key={up.id} className="flex justify-end">
                    <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-indigo-600/60 text-white rounded-tr-none shadow-md">
                      <div className="w-[180px] h-[120px] bg-slate-950/20 mb-2 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                        {up.type === 'image' ? (
                          <img src={up.previewUrl} alt="Preview" className="w-full h-full object-cover opacity-50" />
                        ) : (
                          <VideoIcon className="w-8 h-8 text-slate-300 animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-3">
                          <span className="text-xs text-white font-semibold mb-1.5">Uploading {up.progress}%</span>
                          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${up.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Area */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 relative z-30">
                {isInputEmojiOpen && (
                  <div className="absolute bottom-20 left-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl w-[280px] z-[50]">
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-850">
                      <span className="text-xs font-bold text-slate-400">Smileys</span>
                      <button onClick={() => setIsInputEmojiOpen(false)}>
                        <X className="w-4 h-4 text-slate-400 hover:text-white" />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto">
                      {EMOJI_CATEGORIES['Smileys & People'].slice(0, 30).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(emoji)}
                          className="text-xl hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-950/20 border border-slate-800/80 rounded-xl px-1.5 py-1">
                    {/* Emoji pick button */}
                    <button
                      onClick={() => setIsInputEmojiOpen(!isInputEmojiOpen)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Select Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    {/* Image Attachment Button */}
                    <label className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer" title="Send Image">
                      <ImageIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadFile(e, 'image')}
                        className="hidden"
                      />
                    </label>

                    {/* Video Attachment Button */}
                    <label className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer" title="Send Video">
                      <VideoIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleUploadFile(e, 'video')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Main text area */}
                  <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a secure message..."
                      value={inputText}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl outline-none text-sm text-slate-200 focus:border-indigo-500 transition-all focus:ring-1 focus:ring-indigo-600/10 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/15 flex items-center justify-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Contact Information Drawer */}
              {isDrawerOpen && (
                <div className="absolute inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 z-[100] shadow-2xl flex flex-col">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                    <h3 className="font-bold text-sm text-slate-100 font-display">Contact Details</h3>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-3xl shadow-md ${getAvatarColor(activeFriend.name)}`}>
                      {getInitials(activeFriend.name)}
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-base text-slate-200 font-display">{activeFriend.name}</h4>
                      <p className="text-xs text-indigo-400 font-medium mt-0.5">{activeFriend.mobilenumber}</p>
                    </div>

                    <div className="w-full space-y-4">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Information Details</h5>
                      <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-3.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Encryption</span>
                          <span className="text-slate-200">AES-256 (E2EE)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Status</span>
                          <span className="text-slate-200">{activeFriend.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No selected chat empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800 mb-4 shadow-xl">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-200 font-display">No Conversations Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Select a friend from the left sidebar to start exchanging secure real-time messages, photos, and videos.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
