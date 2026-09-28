import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.Capacitor ? 'http://localhost:5000' : 'https://secrect-chat-app.onrender.com')

// ── SVG Icon Components (Professional, minimal line icons) ────────────
const Icons = {
  Chat: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Users: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Settings: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  LogOut: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Plus: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Send: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Image: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Video: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  X: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  CornerUpLeft: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
    </svg>
  ),
  Check: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  CheckCheck: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="18 6 9 17 4 12"/><polyline points="22 6 13 17"/>
    </svg>
  ),
  Trash: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  MoreVert: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  ),
  ArrowLeft: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Lock: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Block: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  Palette: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="13.5" cy="6.5" r="2"/><circle cx="17.5" cy="10.5" r="2"/><circle cx="8.5" cy="7.5" r="2"/><circle cx="6.5" cy="12" r="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  User: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Camera: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Edit: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Sun: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Paperclip: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
  Smile: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  ThumbsUp: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12.922 2.656C12.43 1.954 11.238 2.062 10.96 2.871l-1.636 4.757a2.5 2.5 0 0 1-1.391 1.545l-3.328 1.427C3.12 11.237 2 12.639 2 14.25v3.5C2 19.544 3.456 21 5.25 21h8.868c2.193 0 4.14-1.42 4.821-3.486l1.782-5.41A3.25 3.25 0 0 0 17.625 8h-4.301l.915-2.288a3.25 3.25 0 0 0-1.317-3.056z" />
    </svg>
  ),
  Mic: ({ size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
    </svg>
  ),
}

// ── Photo/Video gallery icon ──
const PhotoGalleryIcon = ({ size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
)

// ── Constants ──────────────────────────────────────────────
const THEMES = [
  { id: 'sage', name: 'Sage', desc: 'Calm green', color: '#5B8A72' },
  { id: 'ocean', name: 'Ocean', desc: 'Cool blue', color: '#4A7FB5' },
  { id: 'sand', name: 'Sand', desc: 'Warm beige', color: '#9E8563' },
  { id: 'lavender', name: 'Lavender', desc: 'Soft purple', color: '#7B6BA5' },
]

const WALLPAPERS = [
  { id: 'default', name: 'Default Pattern' },
  { id: 'whatsapp', name: 'WhatsApp Style' },
  { id: 'telegram', name: 'Telegram Blue' },
  { id: 'facebook', name: 'Messenger Solid' },
  { id: 'floral', name: 'Vintage Floral' },
  { id: 'dark', name: 'Solid Dark' },
]

const AVATAR_OPTIONS = [
  '🧑','👨','👩','👦','👧','🧔','👱','👴','👵',
  '🧑‍💻','👨‍💻','👩‍💻','🧑‍🎓','👨‍🎓','👩‍🎓',
  '🧑‍🚀','👨‍🚀','👩‍🚀','🧑‍🎨','🧑‍💼',
  '🦊','🐱','🐶','🐼','🦁','🐨','🐸','🦉','🐧','🐯',
]

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']
const ALL_EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','👍','👎','✊','👊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤙','💪','🦾','🖕','✍️','🙏','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💯','🔥','✨','🎉','🌟']

const AVATAR_COLORS = ['#5B8A72','#4A7FB5','#9E8563','#7B6BA5','#D97B5F','#5BA8A0','#B57B9E','#7BA85B']

export default function Chat() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const myData = JSON.parse(localStorage.getItem('user') || '{}')

  // ── State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [newFriendMobile, setNewFriendMobile] = useState('')
  const [addFriendError, setAddFriendError] = useState('')
  const [addFriendSuccess, setAddFriendSuccess] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeFriend, setActiveFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [lastMessages, setLastMessages] = useState({})

  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)
  const [reactionBarMsgId, setReactionBarMsgId] = useState(null)
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState('info') // 'info' | 'media'
  const [chatMenuOpen, setChatMenuOpen] = useState(false)

  // Profile
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileModalType, setProfileModalType] = useState(null) // 'avatar' | 'name' | null
  const [editingName, setEditingName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(myData.avatar || '')
  const [myProfile, setMyProfile] = useState({ name: myData.name, avatar: myData.avatar || '' })

  // Theme & Wallpaper
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('sc-theme') || 'sage')
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [currentWallpaper, setCurrentWallpaper] = useState(localStorage.getItem('sc-wallpaper') || 'default')
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false)
  
  // Input
  const [inputEmojiPickerOpen, setInputEmojiPickerOpen] = useState(false)

  // Block
  const [blockedUsers, setBlockedUsers] = useState([])

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const longPressTimerRef = useRef(null)

  const [friendTypingId, setFriendTypingId] = useState(null)
  const [amTyping, setAmTyping] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState([])

  // Reply & Viewer
  const [replyingTo, setReplyingTo] = useState(null)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        if (audioChunksRef.current.length === 0) return
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        
        const formData = new FormData()
        formData.append('file', audioFile)
        try {
          const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
          const res = await axios.post(`${API_URL}/api/upload`, formData, config)
          if (res.data.success) {
            socketRef.current?.emit('message:send', { receiverId: activeFriend._id, text: '', fileUrl: res.data.data.url, messageType: 'audio', replyTo: replyingTo?._id || null }, (socketRes) => {
              if (socketRes.success) {
                setMessages(prev => [...prev, socketRes.message])
                setLastMessages(prev => ({ ...prev, [activeFriend._id]: socketRes.message }))
              }
            })
            setReplyingTo(null)
          }
        } catch(e) { showToast('Failed to send voice message.') }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch(err) {
      showToast('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => { mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()) }
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }

  // Apply theme & wallpaper
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
    localStorage.setItem('sc-theme', currentTheme)
  }, [currentTheme])
  
  useEffect(() => {
    localStorage.setItem('sc-wallpaper', currentWallpaper)
  }, [currentWallpaper])

  // ── Data fetching ───────────────────────────────────────
  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const friendsRes = await axios.get(`${API_URL}/api/friends`, config)
      if (friendsRes.data.success) {
        setFriends(friendsRes.data.data.friends)
        for (const friend of friendsRes.data.data.friends) {
          try {
            const msgRes = await axios.get(`${API_URL}/api/messages/conversation/${friend._id}?limit=1`, config)
            if (msgRes.data.success && msgRes.data.data.messages.length > 0) {
              const lastMsg = msgRes.data.data.messages[msgRes.data.data.messages.length - 1]
              setLastMessages(prev => ({ ...prev, [friend._id]: lastMsg }))
            }
          } catch (_) {}
        }
      }
      const reqsRes = await axios.get(`${API_URL}/api/friends/requests/pending`, config)
      if (reqsRes.data.success) setPendingRequests(reqsRes.data.data.requests)
      // Fetch blocked users
      try {
        const blockedRes = await axios.get(`${API_URL}/api/friends/blocked`, config)
        if (blockedRes.data.success) setBlockedUsers(blockedRes.data.data.blockedUsers || [])
      } catch (_) {}
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchData()

    const socket = io(API_URL, { auth: { token: `Bearer ${token}` } })
    socketRef.current = socket
    socket.on('connect', () => console.log('Connected to server'))

    socket.on('message:receive', ({ message }) => {
      if (activeFriend && (message.sender._id === activeFriend._id || message.receiver === activeFriend._id)) {
        setMessages(prev => [...prev, message])
        socket.emit('message:read', { senderId: activeFriend._id })
      } else {
        fetchData()
      }
      const friendId = message.sender._id === myData.id ? message.receiver : message.sender._id
      setLastMessages(prev => ({ ...prev, [friendId]: message }))
    })

    socket.on('message:delivered', ({ messageId }) => {
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, status: 'delivered' } : msg))
      setLastMessages(prev => {
        const updated = { ...prev }
        for (const friendId in updated) {
          if (updated[friendId]._id === messageId) updated[friendId] = { ...updated[friendId], status: 'delivered' }
        }
        return updated
      })
    })
    socket.on('message:read', ({ readBy }) => {
      if (activeFriend && readBy === activeFriend._id) {
        setMessages(prev => prev.map(msg => msg.status !== 'read' ? { ...msg, status: 'read' } : msg))
      }
      setLastMessages(prev => {
        const friendMsg = prev[readBy]
        if (friendMsg && (friendMsg.sender === myData.id || friendMsg.sender?._id === myData.id)) {
          return { ...prev, [readBy]: { ...friendMsg, status: 'read' } }
        }
        return prev
      })
    })
    socket.on('message:deleted', ({ messageId }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isDeletedForEveryone: true, text: 'This message was deleted.', messageType: 'text', fileUrl: '' } : msg
      ))
    })
    socket.on('message:reaction', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg))
    })
    socket.on('friend:online', ({ userId }) => {
      setFriends(prev => prev.map(f => f._id === userId ? { ...f, isOnline: true } : f))
      if (activeFriend?._id === userId) setActiveFriend(prev => ({ ...prev, isOnline: true }))
    })
    socket.on('friend:offline', ({ userId, lastSeen }) => {
      setFriends(prev => prev.map(f => f._id === userId ? { ...f, isOnline: false, lastSeen } : f))
      if (activeFriend?._id === userId) setActiveFriend(prev => ({ ...prev, isOnline: false, lastSeen }))
    })
    socket.on('friend:request', () => { showToast('New friend request!'); fetchData() })
    socket.on('friend:accepted', ({ friend }) => { showToast(`${friend.name} accepted your request!`); fetchData() })
    socket.on('typing:start', ({ senderId }) => { if (activeFriend?._id === senderId) setFriendTypingId(senderId) })
    socket.on('typing:stop', ({ senderId }) => { if (activeFriend?._id === senderId) setFriendTypingId(null) })

    return () => socket.disconnect()
  }, [token, activeFriend?._id])

  // Scroll to bottom when messages update OR when a new chat is opened
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, uploadingFiles])

  // Scroll to bottom immediately when switching chats (no animation)
  useEffect(() => {
    if (activeFriend) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
    }
  }, [activeFriend?._id])

  // Handle browser back button on mobile — push state when opening a chat
  useEffect(() => {
    if (activeFriend) {
      window.history.pushState({ chatOpen: true, friendId: activeFriend._id }, '')
    }
  }, [activeFriend?._id])

  useEffect(() => {
    const handlePopState = (e) => {
      // If we were in a chat, go back to list instead of leaving the app
      if (activeFriend) {
        setActiveFriend(null)
        setMessages([])
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [activeFriend])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (activeMenuMsgId) setActiveMenuMsgId(null)
      if (chatMenuOpen) setChatMenuOpen(false)
      if (profileMenuOpen) setProfileMenuOpen(false)
      if (inputEmojiPickerOpen) setInputEmojiPickerOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [activeMenuMsgId, chatMenuOpen, profileMenuOpen, inputEmojiPickerOpen])

  // ── Helpers ─────────────────────────────────────────────
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000) }
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
  const getDateHeader = (d) => {
    const date = new Date(d), today = new Date(), yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const getInitial = (n) => (n || '?')[0].toUpperCase()
  const getColor = (n) => { let h=0; for(let i=0;i<(n||'').length;i++) h=n.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length] }
  const isBlocked = (userId) => blockedUsers.some(u => u._id === userId || u === userId)

  const getTwemojiUrl = (emoji) => {
    const code = Array.from(emoji).map(c => c.codePointAt(0).toString(16)).filter(c => c !== 'fe0f').join('-')
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`
  }

  const getLastMsgPreview = (friendId) => {
    const msg = lastMessages[friendId]
    if (!msg) return ''
    if (msg.isDeletedForEveryone) return 'Message deleted'
    let text = msg.text || ''
    if (msg.messageType === 'image') text = 'Photo'
    if (msg.messageType === 'video') text = 'Video'
    if (msg.messageType === 'audio') text = 'Voice Message'
    const isMe = msg.sender === myData.id || msg.sender?._id === myData.id
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {isMe && (msg.status === 'read' ? <Icons.CheckCheck size={14} style={{ color: '#53bdeb' }} /> : <Icons.Check size={14} style={{ color: 'var(--text-tertiary)' }} />)}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
      </span>
    )
  }
  const getLastMsgTime = (friendId) => {
    const msg = lastMessages[friendId]
    if (!msg) return ''
    return formatTime(msg.createdAt)
  }

  // ── Avatar Renderer ─────────────────────────────────────
  const renderAvatar = (name, avatar, size = 44, fontSize = 18) => {
    if (avatar && avatar.startsWith('http')) {
      return <img src={avatar} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} className="sc-avatar" />
    }
    if (avatar && avatar.length <= 4) {
      return (
        <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: getColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>
          {avatar}
        </div>
      )
    }
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: getColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#fff', fontSize, flexShrink: 0 }}>
        {getInitial(name)}
      </div>
    )
  }

  // ── Actions ─────────────────────────────────────────────
  const selectFriend = async (friend) => {
    setActiveFriend(friend); setMessages([]); setDrawerTab('info')
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.get(`${API_URL}/api/messages/conversation/${friend._id}`, config)
      if (res.data.success) {
        setMessages(res.data.data.messages)
        socketRef.current?.emit('message:read', { senderId: friend._id })
        if (res.data.data.messages.length > 0) {
          setLastMessages(prev => ({ ...prev, [friend._id]: res.data.data.messages[res.data.data.messages.length - 1] }))
        }
        // Scroll to bottom after messages load
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 80)
      }
    } catch (err) { console.error('Error fetching conversation:', err) }
  }

  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  const handleAddFriend = async (e) => {
    e.preventDefault(); setAddFriendError(''); setAddFriendSuccess('')
    if (!newFriendMobile.trim()) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.post(`${API_URL}/api/friends/request`, { mobilenumber: newFriendMobile.trim() }, config)
      if (res.data.success) { setAddFriendSuccess(res.data.message || 'Request sent!'); setNewFriendMobile(''); fetchData(); setTimeout(() => setIsAddFriendOpen(false), 2000) }
    } catch (err) { setAddFriendError(err.response?.data?.message || 'Could not send request.') }
  }

  const handleRequestResponse = async (requesterId, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      if (action === 'accept') { const r = await axios.put(`${API_URL}/api/friends/accept/${requesterId}`, {}, config); if(r.data.success) { showToast('Request accepted!'); fetchData() } }
      else { const r = await axios.delete(`${API_URL}/api/friends/reject/${requesterId}`, config); if(r.data.success) { showToast('Request rejected.'); fetchData() } }
    } catch(_) { showToast('Action failed.') }
  }

  const handleSendMessage = (e, isLike = false) => {
    if (e && e.preventDefault) e.preventDefault()
    const textToSend = isLike ? '👍' : inputText.trim()
    if (!textToSend || !activeFriend) return
    if (isBlocked(activeFriend._id)) { showToast('You have blocked this user.'); return }
    socketRef.current?.emit('message:send', { receiverId: activeFriend._id, text: textToSend, messageType: 'text', replyTo: replyingTo?._id || null }, (res) => {
      if (res.success) {
        setMessages(prev => [...prev, res.message])
        setLastMessages(prev => ({ ...prev, [activeFriend._id]: res.message }))
      }
    })
    if (!isLike) { setInputText(''); stopTyping() }
    setReplyingTo(null)
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    if (!activeFriend) return
    if (!amTyping) { setAmTyping(true); socketRef.current?.emit('typing:start', { receiverId: activeFriend._id }) }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000)
  }
  const stopTyping = () => {
    if (amTyping && activeFriend) { setAmTyping(false); socketRef.current?.emit('typing:stop', { receiverId: activeFriend._id }) }
  }

  const handleUploadFile = async (e, type) => {
    const file = e.target.files[0]; if (!file || !activeFriend) return
    if (isBlocked(activeFriend._id)) { showToast('You have blocked this user.'); return }
    const tempId = Date.now(); const previewUrl = URL.createObjectURL(file)
    setUploadingFiles(prev => [...prev, { id: tempId, type, previewUrl, progress: 10 }])
    const formData = new FormData(); formData.append('file', file)
    try {
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => { const pct = Math.round((p.loaded*100)/p.total); setUploadingFiles(prev => prev.map(f => f.id===tempId ? {...f, progress:pct} : f)) }
      }
      const res = await axios.post(`${API_URL}/api/upload`, formData, config)
      if (res.data.success) {
        socketRef.current?.emit('message:send', { receiverId: activeFriend._id, text: '', fileUrl: res.data.data.url, messageType: res.data.data.fileType, replyTo: replyingTo?._id || null }, (socketRes) => {
          if (socketRes.success) {
            setMessages(prev => [...prev, socketRes.message])
            setLastMessages(prev => ({ ...prev, [activeFriend._id]: socketRes.message }))
          }
        })
        setReplyingTo(null)
      }
    } catch(_) { showToast('Upload failed.') }
    finally { setUploadingFiles(prev => prev.filter(f => f.id !== tempId)); URL.revokeObjectURL(previewUrl) }
  }

  const handleReactMessage = (messageId, emoji) => {
    socketRef.current?.emit('message:react', { messageId, emoji }, (res) => {
      if (res.success) setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions: res.reactions } : msg))
    })
    setReactionBarMsgId(null)
    setEmojiPickerMsgId(null)
  }

  const handleDeleteMessage = async (messageId, target) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const route = target === 'everyone' ? 'for-everyone' : 'for-me'
      const res = await axios.delete(`${API_URL}/api/messages/${messageId}/${route}`, config)
      if (res.data.success) {
        if (target === 'everyone') {
          setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isDeletedForEveryone: true, text: 'This message was deleted.', messageType: 'text', fileUrl: '' } : msg))
        } else { setMessages(prev => prev.filter(msg => msg._id !== messageId)) }
        showToast('Message deleted.')
      }
    } catch(e) { showToast(e.response?.data?.message || 'Could not delete.') }
    finally { setActiveMenuMsgId(null) }
  }

  // ── Block / Unblock ─────────────────────────────────────
  const handleBlock = async (userId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.put(`${API_URL}/api/friends/block/${userId}`, {}, config)
      showToast('User blocked.')
      fetchData()
    } catch (e) { showToast(e.response?.data?.message || 'Could not block.') }
    setChatMenuOpen(false)
  }
  const handleUnblock = async (userId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.put(`${API_URL}/api/friends/unblock/${userId}`, {}, config)
      showToast('User unblocked.')
      fetchData()
    } catch (e) { showToast(e.response?.data?.message || 'Could not unblock.') }
    setChatMenuOpen(false)
  }

  // ── Profile Update ──────────────────────────────────────
  const handleUpdateProfile = async (field, value) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const body = {}
      if (field === 'name') body.name = value
      if (field === 'avatar') body.avatar = value
      const res = await axios.put(`${API_URL}/api/friends/profile`, body, config)
      if (res.data.success) {
        const updated = res.data.data.user
        setMyProfile({ name: updated.name, avatar: updated.avatar || '' })
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        storedUser.name = updated.name
        storedUser.avatar = updated.avatar || ''
        localStorage.setItem('user', JSON.stringify(storedUser))
        showToast('Profile updated!')
        setProfileModalType(null)
      }
    } catch (e) { showToast(e.response?.data?.message || 'Update failed.') }
  }

  // ── Long press for reactions ────────────────────────────
  const handleMsgPointerDown = useCallback((msgId) => {
    longPressTimerRef.current = setTimeout(() => {
      setReactionBarMsgId(msgId)
    }, 600)
  }, [])

  const handleMsgPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.mobilenumber.includes(searchQuery)
  )

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-app)', transition: 'background-color var(--transition-smooth)' }}>
      {/* Toast */}
      {toastMessage && (
        <div className="sc-toast" style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', backgroundColor:'var(--text-primary)', color:'#fff', fontSize:13, padding:'10px 24px', borderRadius:'var(--radius-md)', zIndex:9999, boxShadow:'var(--shadow-lg)', fontWeight:500 }}>
          {toastMessage}
        </div>
      )}

      <div style={{ display: 'flex', width: '100%', height: '100%', maxWidth: 1600, margin: '0 auto', position: 'relative' }}>
        {/* ═══ SIDEBAR ═══ */}
        <aside className={`sc-sidebar ${activeFriend ? 'sc-hide-mobile' : ''}`} style={{ width: 380, minWidth: 380, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', transition: 'background-color var(--transition-smooth)' }}>
          {/* Header */}
          <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-header)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, transition: 'background-color var(--transition-smooth)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', position: 'relative' }} onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen) }}>
              {renderAvatar(myProfile.name, myProfile.avatar, 38, 15)}
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-header)', letterSpacing: '-0.01em' }}>{myProfile.name}</span>
            </div>

            {/* Profile dropdown */}
            {profileMenuOpen && (
              <div className="sc-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 54, left: 16, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden', minWidth: 200 }}>
                <button onClick={() => { setProfileModalType('avatar'); setProfileMenuOpen(false) }} className="sc-chat-item"
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
                  <Icons.Camera size={18} style={{ color: 'var(--text-secondary)' }} /> Change Avatar
                </button>
                <button onClick={() => { setEditingName(myProfile.name); setProfileModalType('name'); setProfileMenuOpen(false) }} className="sc-chat-item"
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', borderTop: '1px solid var(--border-color)' }}>
                  <Icons.Edit size={18} style={{ color: 'var(--text-secondary)' }} /> Change Profile Name
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => setIsAddFriendOpen(!isAddFriendOpen)} className="sc-btn-icon-header" style={{ transform: isAddFriendOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} title="Add Contact">
                <Icons.Plus size={20} />
              </button>
              <button onClick={handleLogout} className="sc-btn-icon-header" title="Log Out">
                <Icons.LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Add Friend */}
          {isAddFriendOpen && (
            <form onSubmit={handleAddFriend} className="sc-scale-in" style={{ padding: '12px 16px', backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Add New Contact</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="Enter mobile number..." value={newFriendMobile} onChange={(e)=>setNewFriendMobile(e.target.value)}
                  className="sc-input" style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
                <button type="submit" className="sc-btn sc-btn-primary" style={{ fontSize: 12 }}>Send</button>
              </div>
              {addFriendError && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{addFriendError}</p>}
              {addFriendSuccess && <p style={{ color: 'var(--success)', fontSize: 12, marginTop: 6 }}>{addFriendSuccess}</p>}
            </form>
          )}

          {/* Search */}
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-input)', transition: 'background-color var(--transition-smooth)' }}>
            <div style={{ position: 'relative' }}>
              <Icons.Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}
                className="sc-input" style={{ paddingLeft: 36, fontSize: 13, border: 'none', backgroundColor: 'var(--bg-surface)' }} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}>
            {[
              { key: 'chats', label: 'Chats', Icon: Icons.Chat },
              { key: 'requests', label: 'Requests', Icon: Icons.Users },
              { key: 'settings', label: 'Settings', Icon: Icons.Settings },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, backgroundColor: 'transparent', color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent', transition: 'all var(--transition-fast)', fontFamily: 'inherit', position: 'relative' }}>
                <tab.Icon size={15} /> {tab.label}
                {tab.key === 'requests' && pendingRequests.length > 0 && (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--badge-bg)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingRequests.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* CHATS LIST */}
            {activeTab === 'chats' && (
              <div>
                {filteredFriends.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Icons.Chat size={24} style={{ color: 'var(--primary)' }} />
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>No chats yet.<br/>Tap "+" to add contacts!</p>
                  </div>
                ) : filteredFriends.map(friend => (
                  <div key={friend._id} onClick={() => selectFriend(friend)}
                    className={`sc-chat-item ${activeFriend?._id === friend._id ? 'sc-chat-item-active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', backgroundColor: activeFriend?._id === friend._id ? 'var(--bg-active)' : 'var(--bg-sidebar)' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {renderAvatar(friend.name, friend.avatar, 48, 19)}
                      {friend.isOnline && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', backgroundColor: 'var(--online)', border: '2px solid var(--bg-sidebar)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.name}</h4>
                        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', flexShrink: 0, fontWeight: 400 }}>{getLastMsgTime(friend._id)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {getLastMsgPreview(friend._id) || (friend.isOnline ? <span style={{ color: 'var(--success)' }}>online</span> : <span style={{ color: 'var(--text-tertiary)' }}>Tap to chat</span>)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <div style={{ padding: 16 }}>
                <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Pending Requests</h4>
                {pendingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <Icons.Users size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No pending requests.</p>
                  </div>
                ) : pendingRequests.map(req => (
                  <div key={req._id} className="sc-scale-in" style={{ backgroundColor: 'var(--bg-input)', padding: 14, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ minWidth: 0 }}>
                      <h5 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{req.from.name}</h5>
                      <p style={{ fontSize: 12, color: 'var(--primary)', margin: 0, marginTop: 2 }}>{req.from.mobilenumber}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleRequestResponse(req.from._id, 'accept')} className="sc-btn sc-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>Accept</button>
                      <button onClick={() => handleRequestResponse(req.from._id, 'reject')} className="sc-btn" style={{ fontSize: 12, padding: '6px 14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <div style={{ padding: 20 }}>
                {/* Profile Card */}
                <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    {renderAvatar(myProfile.name, myProfile.avatar, 80, 32)}
                    <button onClick={() => setProfileModalType('avatar')} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--primary)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                      <Icons.Camera size={14} />
                    </button>
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{myProfile.name}</h4>
                  <p style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 500, marginTop: 4 }}>{myData.mobilenumber}</p>
                </div>

                {/* Theme Selection */}
                <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16, border: '1px solid var(--border-color)' }}>
                  <h5 style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icons.Palette size={14} /> App Theme
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {THEMES.map(theme => (
                      <div key={theme.id} className={`sc-theme-card ${currentTheme === theme.id ? 'sc-theme-card--active' : ''}`} onClick={() => setCurrentTheme(theme.id)}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: theme.color, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {currentTheme === theme.id && <Icons.Check size={16} style={{ color: '#fff' }} />}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{theme.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>{theme.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border-color)' }}>
                  <h5 style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>About</h5>
                  {[['Encryption','End-to-end encrypted'],['Server','NodeJS WebSockets'],['Media','Cloudinary CDN']].map(([l,v])=>(
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ═══ CHAT PANEL ═══ */}
        {activeFriend ? (
          <main className="sc-chat-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', backgroundColor: 'var(--bg-chat)', transition: 'background-color var(--transition-smooth)' }}>
            {/* Chat Header — sticky so it stays visible while scrolling on mobile */}
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--bg-header)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, flexShrink: 0, transition: 'background-color var(--transition-smooth)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setActiveFriend(null)} className="sc-show-mobile-only" style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-header)' }}>
                  <Icons.ArrowLeft size={22} />
                </button>
                <div onClick={() => setIsDrawerOpen(true)} style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
                  {renderAvatar(activeFriend.name, activeFriend.avatar, 40, 16)}
                  {activeFriend.isOnline && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--online)', border: '2px solid var(--bg-header)' }} />}
                </div>
                <div style={{ cursor: 'pointer' }} onClick={() => setIsDrawerOpen(true)}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-header)', margin: 0, letterSpacing: '-0.01em' }}>{activeFriend.name}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    {friendTypingId === activeFriend._id ? (
                      <span style={{ fontStyle: 'italic' }}>typing...</span>
                    ) : activeFriend.isOnline ? 'online' : activeFriend.lastSeen ? `last seen ${formatTime(activeFriend.lastSeen)}` : 'offline'}
                  </p>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setChatMenuOpen(!chatMenuOpen) }} className="sc-btn-icon-header" title="Options">
                  <Icons.MoreVert size={18} />
                </button>
                {/* Chat dropdown menu */}
                {chatMenuOpen && (
                  <div className="sc-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 40, right: 0, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden', minWidth: 200 }}>
                    <button onClick={() => { setWallpaperModalOpen(true); setChatMenuOpen(false) }} className="sc-chat-item"
                      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
                      <Icons.Image size={16} style={{ color: 'var(--text-secondary)' }} /> Select Wallpaper
                    </button>
                    <button onClick={() => { setIsDrawerOpen(true); setDrawerTab('media'); setChatMenuOpen(false) }} className="sc-chat-item"
                      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', borderTop: '1px solid var(--border-color)' }}>
                      <PhotoGalleryIcon size={16} style={{ color: 'var(--text-secondary)' }} /> Shared Media
                    </button>
                    <button onClick={() => { setIsDrawerOpen(true); setDrawerTab('info'); setChatMenuOpen(false) }} className="sc-chat-item"
                      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', borderTop: '1px solid var(--border-color)' }}>
                      <Icons.User size={16} style={{ color: 'var(--text-secondary)' }} /> Contact Info
                    </button>
                    {isBlocked(activeFriend._id) ? (
                      <button onClick={() => handleUnblock(activeFriend._id)} className="sc-chat-item"
                        style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', borderTop: '1px solid var(--border-color)' }}>
                        <Icons.Block size={16} /> Unblock User
                      </button>
                    ) : (
                      <button onClick={() => handleBlock(activeFriend._id)} className="sc-chat-item"
                        style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', borderTop: '1px solid var(--border-color)' }}>
                        <Icons.Block size={16} /> Block User
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="sc-chat-wallpaper sc-messages-padding" data-wallpaper={currentWallpaper} style={{ flex: 1, overflowY: 'auto', padding: '8px 60px' }}>
              {/* Blocked banner */}
              {isBlocked(activeFriend._id) && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                  <span style={{ backgroundColor: 'var(--date-bubble)', color: 'var(--danger)', fontSize: 12, fontWeight: 500, padding: '6px 16px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icons.Block size={14} /> You blocked this contact
                  </span>
                </div>
              )}

              {messages.length === 0 && uploadingFiles.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ backgroundColor: 'var(--date-bubble)', color: 'var(--text-secondary)', fontSize: 12.5, padding: '10px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icons.Lock size={13} />
                    Messages are end-to-end encrypted. No one outside of this chat can read them.
                  </div>
                </div>
              ) : (() => {
                let lastH = null
                return (
                  <>
                    {messages.map((msg, index) => {
                      const dh = getDateHeader(msg.createdAt), show = dh !== lastH; lastH = dh
                      const isMe = msg.sender._id === myData.id || msg.sender === myData.id
                      const hasMedia = (msg.messageType==='image'||msg.messageType==='video') && !msg.isDeletedForEveryone
                      const hasText = msg.text && !msg.isDeletedForEveryone
                      
                      const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u;
                      const isOnlyEmoji = hasText && emojiRegex.test(msg.text) && msg.text.trim().length > 0;
                      const emojiCount = isOnlyEmoji ? [...msg.text.replace(/\s/g, '')].length : 0;
                      const isBigEmoji = isOnlyEmoji && !hasMedia && msg.messageType === 'text' && emojiCount > 0 && emojiCount <= 3;

                      return (
                        <React.Fragment key={msg._id}>
                          {show && (
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                              <span style={{ backgroundColor: 'var(--date-bubble)', color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 500, padding: '5px 14px', borderRadius: 'var(--radius-xl)', letterSpacing: 0.2 }}>{dh}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 3, position: 'relative' }}>
                            {/* Long-press reaction bar */}
                            {!msg.isDeletedForEveryone && reactionBarMsgId === msg._id && (
                              <div className="sc-reaction-bar sc-reaction-bar--visible" style={{ position: 'absolute', top: -36, alignItems: 'center', gap: 2, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', zIndex: 30, ...(isMe ? { right: 0 } : { left: 0 }) }}>
                                {QUICK_REACTIONS.map(emoji => (
                                  <button key={emoji} onClick={() => handleReactMessage(msg._id, emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, transition: 'transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                    <img src={getTwemojiUrl(emoji)} alt={emoji} style={{ width: 22, height: 22 }} />
                                  </button>
                                ))}
                                <button onClick={() => { setEmojiPickerMsgId(msg._id); setReactionBarMsgId(null) }} style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 700, padding: '2px 4px' }}>+</button>
                              </div>
                            )}

                            {/* Bubble */}
                              <div className="sc-msg-bubble"
                                onPointerDown={() => !msg.isDeletedForEveryone && handleMsgPointerDown(msg._id)}
                                onPointerUp={handleMsgPointerUp}
                                onPointerLeave={handleMsgPointerUp}
                                onContextMenu={(e) => { e.preventDefault(); if (!msg.isDeletedForEveryone) setReactionBarMsgId(msg._id) }}
                                style={{
                                  maxWidth: '65%', borderRadius: 'var(--radius-md)',
                                  borderTopRightRadius: isMe ? 2 : 'var(--radius-md)', borderTopLeftRadius: isMe ? 'var(--radius-md)' : 2,
                                  padding: hasMedia || msg.messageType==='audio' ? 3 : (isBigEmoji ? 0 : '6px 7px 8px 9px'),
                                  position: 'relative', boxShadow: isBigEmoji ? 'none' : 'var(--shadow-sm)',
                                  backgroundColor: isBigEmoji ? 'transparent' : (isMe ? 'var(--bg-msg-me)' : 'var(--bg-msg-other)'),
                                  transition: 'background-color var(--transition-smooth)',
                                  userSelect: 'text', WebkitUserSelect: 'text',
                                }}>
                              {msg.isDeletedForEveryone ? (
                                <p style={{ fontSize: 13.5, fontStyle: 'italic', color: 'var(--text-tertiary)', margin: 0, padding: '4px 6px' }}>This message was deleted</p>
                              ) : (
                                <>
                                  {/* Replied Message Preview inside Bubble */}
                                  {msg.replyTo && (
                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', marginBottom: hasMedia ? 4 : 6, borderLeft: '4px solid var(--primary)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{msg.replyTo.sender?.name || 'Someone'}</span>
                                      {msg.replyTo.isDeletedForEveryone ? (
                                        <span style={{ fontStyle: 'italic' }}>Deleted message</span>
                                      ) : msg.replyTo.messageType === 'text' ? (
                                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.replyTo.text}</span>
                                      ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          {msg.replyTo.messageType === 'image' && <Icons.Image size={14} />}
                                          {msg.replyTo.messageType === 'video' && <Icons.Video size={14} />}
                                          {msg.replyTo.messageType === 'audio' && <Icons.Mic size={14} />}
                                          {msg.replyTo.messageType.charAt(0).toUpperCase() + msg.replyTo.messageType.slice(1)}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {msg.messageType==='image' && (
                                    <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', lineHeight: 0 }}>
                                      <img onClick={() => setFullscreenImage(msg.fileUrl)} src={msg.fileUrl} alt="Photo" style={{ maxWidth: 330, width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                                    </div>
                                  )}
                                  {msg.messageType==='video' && (
                                    <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', lineHeight: 0 }}>
                                      <video src={msg.fileUrl} controls style={{ maxWidth: 330, width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', backgroundColor: '#000', borderRadius: 'var(--radius-sm)' }} />
                                    </div>
                                  )}
                                  {msg.messageType==='audio' && (
                                    <div style={{ padding: '4px 6px', minWidth: 220, display: 'flex', alignItems: 'center' }}>
                                      <audio src={msg.fileUrl} controls style={{ width: '100%', height: 40 }} />
                                    </div>
                                  )}
                                  {msg.text && (
                                    <p style={{ fontSize: isBigEmoji ? (emojiCount === 1 ? 48 : emojiCount === 2 ? 40 : 32) : 15, lineHeight: isBigEmoji ? 1.2 : 1.4, margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', padding: hasMedia ? '5px 6px 0 6px' : (isBigEmoji ? '0 0 14px 0' : 0), wordBreak: 'break-word' }}>
                                      {msg.text}
                                      {!isBigEmoji && <span style={{ display: 'inline-block', width: 50, height: 1 }}></span>}
                                    </p>
                                  )}
                                </>
                              )}

                              {/* Time + ticks */}
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: hasMedia || msg.messageType==='audio' ? 2 : 0,
                                position: hasMedia || isBigEmoji || msg.messageType==='text' ? 'absolute' : 'static',
                                bottom: hasMedia && !hasText ? 6 : (isBigEmoji ? 0 : 4),
                                right: hasMedia && !hasText ? 8 : (isBigEmoji ? 0 : 8),
                                backgroundColor: hasMedia && !hasText ? 'rgba(0,0,0,0.4)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                padding: hasMedia && !hasText ? '2px 6px' : 0,
                              }}>
                                <span style={{ fontSize: 10.5, color: hasMedia && !hasText ? '#fff' : 'var(--text-tertiary)', fontWeight: 400, textShadow: isBigEmoji ? '0 1px 1px rgba(255,255,255,0.8)' : 'none' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && !msg.isDeletedForEveryone && (
                                  <span style={{ display: 'flex', alignItems: 'center' }}>
                                    {msg.status==='sent' && <Icons.Check size={14} style={{ color: hasMedia&&!hasText ? '#fff' : 'var(--tick-default)' }} />}
                                    {msg.status==='delivered' && <Icons.CheckCheck size={14} style={{ color: hasMedia&&!hasText ? '#fff' : 'var(--tick-default)' }} />}
                                    {msg.status==='read' && <Icons.CheckCheck size={14} style={{ color: 'var(--tick-read)' }} />}
                                  </span>
                                )}
                              </div>

                              {/* Reactions */}
                              {msg.reactions?.length > 0 && (
                                <div style={{ position: 'absolute', bottom: -12, right: isMe ? 4 : 'auto', left: isMe ? 'auto' : 4, display: 'flex', gap: 2, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '2px 4px', boxShadow: 'var(--shadow-sm)' }}>
                                  {msg.reactions.map((r, i) => (
                                    <img key={i} src={getTwemojiUrl(r.emoji)} alt={r.emoji} style={{ width: 14, height: 14 }} />
                                  ))}
                                </div>
                              )}

                              {/* Actions btn */}
                              {!msg.isDeletedForEveryone && (
                                <div className="sc-msg-action" style={{ position: 'absolute', right: 4, top: 4, display: 'flex', gap: 4, opacity: 0, transition: 'opacity var(--transition-fast)' }}>
                                  <button onClick={(e) => { e.stopPropagation(); setReactionBarMsgId(reactionBarMsgId === msg._id ? null : msg._id); setEmojiPickerMsgId(null) }}
                                    style={{ background: isMe ? 'rgba(220,240,229,0.9)' : 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} title="React">
                                    <Icons.Smile size={15} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setActiveMenuMsgId(activeMenuMsgId === msg._id ? null : msg._id) }}
                                    style={{ background: isMe ? 'rgba(220,240,229,0.9)' : 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} title="More">
                                    <Icons.MoreVert size={14} />
                                  </button>
                                </div>
                              )}

                              {/* Delete menu */}
                              {activeMenuMsgId === msg._id && (
                                <div className="sc-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', ...(index >= messages.length - 2 ? { bottom: 28 } : { top: 28 }), right: 4, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden', minWidth: 180 }}>
                                  <button onClick={() => { setReplyingTo(msg); setActiveMenuMsgId(null); }} className="sc-chat-item"
                                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', borderBottom: '1px solid var(--border-color)' }}>
                                    <Icons.CornerUpLeft size={14} /> Reply
                                  </button>
                                  <button onClick={() => handleDeleteMessage(msg._id, 'me')} className="sc-chat-item"
                                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                                    <Icons.Trash size={14} /> Delete for me
                                  </button>
                                  {isMe && (
                                    <button onClick={() => handleDeleteMessage(msg._id, 'everyone')} className="sc-chat-item"
                                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', borderTop: '1px solid var(--border-color)' }}>
                                      <Icons.Trash size={14} /> Delete for everyone
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Emoji picker overlay */}
                          {emojiPickerMsgId === msg._id && (
                            <div onClick={() => setEmojiPickerMsgId(null)} className="sc-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                              <div onClick={e => e.stopPropagation()} className="sc-modal-content" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 16, width: '100%', maxWidth: 360, height: 400, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Select Reaction</span>
                                  <button onClick={() => setEmojiPickerMsgId(null)} className="sc-btn-icon"><Icons.X size={20} /></button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, alignContent: 'start', paddingRight: 4 }}>
                                  {ALL_EMOJIS.map((emoji, i) => (
                                    <button key={`${emoji}-${i}`} onClick={() => handleReactMessage(msg._id, emoji)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: 8, transition: 'transform 0.1s, background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'none' }}>
                                      <img src={getTwemojiUrl(emoji)} alt={emoji} style={{ width: 28, height: 28 }} />
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
              })()}

              {/* Upload progress */}
              {uploadingFiles.map(up => (
                <div key={up.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                  <div style={{ maxWidth: '65%', borderRadius: 'var(--radius-md)', borderTopRightRadius: 2, padding: 3, backgroundColor: 'var(--bg-msg-me)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: 250, height: 180, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
                      {up.type==='image' ? <img src={up.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}/> :
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', opacity: 0.5 }}><Icons.Video size={32} style={{ color: '#fff' }} /></div>}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 8 }}>Uploading {up.progress}%</span>
                        <div style={{ width: '70%', height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${up.progress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: 2, transition: 'width 0.3s' }}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area Container */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', zIndex: 20 }}>
              
              {/* Reply Preview */}
              {replyingTo && (
                <div style={{ margin: '0 10px 4px 10px', padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Replying to {replyingTo.sender?.name || 'Someone'}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {replyingTo.messageType === 'text' ? replyingTo.text : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {replyingTo.messageType === 'image' && <Icons.Image size={14} />}
                          {replyingTo.messageType === 'video' && <Icons.Video size={14} />}
                          {replyingTo.messageType === 'audio' && <Icons.Mic size={14} />}
                          {replyingTo.messageType.charAt(0).toUpperCase() + replyingTo.messageType.slice(1)}
                        </span>
                      )}
                    </span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="sc-btn-icon" style={{ padding: 4 }}><Icons.X size={16} /></button>
                </div>
              )}

              {/* Premium Glassmorphic Input Bar */}
              <div style={{ padding: '8px 10px', paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
              
              {/* Main Pill */}
              {isRecording ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)', borderRadius: 24, padding: '8px 14px', border: '1px solid var(--danger)', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="sc-pulse-dot" style={{ width: 10, height: 10, backgroundColor: 'var(--danger)', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: 14, color: 'var(--danger)', fontWeight: 600, fontFamily: 'monospace' }}>
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <button onClick={cancelRecording} onTouchEnd={(e) => { e.preventDefault(); cancelRecording() }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '6px 10px', borderRadius: 16, transition: 'background 0.2s', flexShrink: 0 }}>Cancel</button>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 24, padding: '4px 6px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', position: 'relative', transition: 'all 0.3s ease', minWidth: 0 }}>
                  
                  {/* Emoji Picker Overlay */}
                  {inputEmojiPickerOpen && (
                    <>
                      <div onClick={() => setInputEmojiPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }}></div>
                      <div className="sc-scale-in" onClick={e=>e.stopPropagation()} style={{ position: 'absolute', bottom: 56, left: 0, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100, width: 300, height: 300, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, alignContent: 'start', paddingRight: 4 }}>
                          {ALL_EMOJIS.map((emoji, i) => (
                            <button key={`${emoji}-${i}`} onClick={() => { setInputText(prev => prev + emoji); setInputEmojiPickerOpen(false) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: 6, transition: 'transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'none' }}>
                              <img src={getTwemojiUrl(emoji)} alt={emoji} style={{ width: 24, height: 24 }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <button onClick={(e) => { e.stopPropagation(); setInputEmojiPickerOpen(!inputEmojiPickerOpen) }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <Icons.Smile size={20} />
                  </button>
                  
                  <form onSubmit={(e) => handleSendMessage(e, false)} style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <input type="text" placeholder="Message..." value={inputText} onChange={handleInputChange}
                      style={{ flex: 1, minWidth: 0, padding: '0 8px', height: 36, border: 'none', outline: 'none', fontSize: 14.5, color: 'var(--text-primary)', backgroundColor: 'transparent', fontFamily: 'inherit' }} />
                  </form>
                  
                  {!inputText.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 2, flexShrink: 0 }}>
                      <label style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <Icons.Image size={18} />
                        <input type="file" accept="image/*" onChange={e => handleUploadFile(e, 'image')} style={{ display: 'none' }} />
                      </label>
                      <label style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <Icons.Video size={18} />
                        <input type="file" accept="video/*" onChange={e => handleUploadFile(e, 'video')} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>
              )}
              
              {/* Right Side Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {isRecording ? (
                  <button onClick={stopRecording} onTouchEnd={(e) => { e.preventDefault(); stopRecording() }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)', flexShrink: 0 }}>
                    <Icons.Send size={18} style={{ marginLeft: 2 }} />
                  </button>
                ) : inputText.trim() ? (
                  <button onClick={(e) => handleSendMessage(e, false)} onTouchEnd={(e) => { e.preventDefault(); handleSendMessage(e, false) }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 2px 8px rgba(91, 138, 114, 0.3)', flexShrink: 0 }}>
                    <Icons.Send size={18} style={{ marginLeft: 2 }} />
                  </button>
                ) : (
                  <>
                    <button onClick={startRecording} onTouchEnd={(e) => { e.preventDefault(); startRecording() }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                      <Icons.Mic size={20} />
                    </button>
                    <button onClick={(e) => handleSendMessage(e, true)} onTouchEnd={(e) => { e.preventDefault(); handleSendMessage(e, true) }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                      <Icons.ThumbsUp size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Contact Drawer */}
            {isDrawerOpen && (
              <div className="sc-slide-in sc-contact-drawer" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, backgroundColor: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-color)', zIndex: 100, boxShadow: '-4px 0 16px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-header)', display: 'flex', alignItems: 'center', gap: 16, minHeight: 56 }}>
                  <button onClick={() => setIsDrawerOpen(false)} className="sc-btn-icon-header"><Icons.X size={18} /></button>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-header)', margin: 0 }}>Contact Info</h3>
                </div>
                {/* Drawer Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                  {[{ key: 'info', label: 'Info' }, { key: 'media', label: 'Media' }].map(t => (
                    <button key={t.key} onClick={() => setDrawerTab(t.key)}
                      style={{ flex: 1, padding: '11px 0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: drawerTab === t.key ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: drawerTab === t.key ? '2px solid var(--primary)' : '2px solid transparent', transition: 'all var(--transition-fast)', fontFamily: 'inherit' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {drawerTab === 'info' && (
                    <>
                      <div style={{ padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '8px solid var(--bg-input)' }}>
                        {renderAvatar(activeFriend.name, activeFriend.avatar, 80, 32)}
                        <h4 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', margin: '12px 0 0' }}>{activeFriend.name}</h4>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{activeFriend.mobilenumber}</p>
                        <p style={{ fontSize: 13, marginTop: 4, color: activeFriend.isOnline ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500 }}>{activeFriend.isOnline ? 'Online' : 'Offline'}</p>
                      </div>
                      <div style={{ padding: 16, borderBottom: '8px solid var(--bg-input)' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, marginBottom: 4 }}>About</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Hey there! I am using SecretChat.</p>
                      </div>
                      <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)' }}>
                        <Icons.Lock size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Encryption</p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>Messages are end-to-end encrypted.</p>
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        {isBlocked(activeFriend._id) ? (
                          <button onClick={() => handleUnblock(activeFriend._id)} className="sc-btn" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 14, fontWeight: 500 }}>
                            Unblock {activeFriend.name}
                          </button>
                        ) : (
                          <button onClick={() => handleBlock(activeFriend._id)} className="sc-btn" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: 14, fontWeight: 500 }}>
                            Block {activeFriend.name}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {drawerTab === 'media' && (() => {
                    const mediaMessages = messages.filter(m => (m.messageType === 'image' || m.messageType === 'video') && !m.isDeletedForEveryone)
                    const [lightboxUrl, setLightboxUrl] = useState(null)
                    return (
                      <div style={{ padding: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                          {mediaMessages.length} shared item{mediaMessages.length !== 1 ? 's' : ''}
                        </p>
                        {mediaMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <PhotoGalleryIcon size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No photos or videos shared yet.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                            {mediaMessages.map((m, i) => (
                              <div key={m._id} onClick={() => setLightboxUrl(m.fileUrl)}
                                style={{ aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', position: 'relative', backgroundColor: 'var(--bg-input)' }}>
                                {m.messageType === 'image' ? (
                                  <img src={m.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
                                    <Icons.Video size={24} style={{ color: '#fff', opacity: 0.8 }} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {lightboxUrl && (
                          <div onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                            <button onClick={() => setLightboxUrl(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X size={18} /></button>
                            <img src={lightboxUrl} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </main>
        ) : (
          /* Empty State */
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32, backgroundColor: 'var(--bg-input)', transition: 'background-color var(--transition-smooth)' }}
            className="sc-hide-mobile">
            <div style={{ width: 320, maxWidth: '100%' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Icons.Chat size={36} style={{ color: 'var(--primary)' }} />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '-0.02em' }}>SecretChat</h1>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>Send and receive messages, photos and videos.<br/>Select a chat from the sidebar to start messaging.</p>
              <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 12.5 }}>
                <Icons.Lock size={13} /> End-to-end encrypted
              </div>
            </div>
          </main>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Avatar Modal */}
      {profileModalType === 'avatar' && (
        <div onClick={() => setProfileModalType(null)} className="sc-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div onClick={e => e.stopPropagation()} className="sc-modal-content" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Choose Avatar</h3>
              <button onClick={() => setProfileModalType(null)} className="sc-btn-icon"><Icons.X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
              {AVATAR_OPTIONS.map(av => (
                <button key={av} onClick={() => { setSelectedAvatar(av); handleUpdateProfile('avatar', av) }}
                  style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', border: selectedAvatar === av ? '3px solid var(--primary)' : '2px solid var(--border-color)', backgroundColor: selectedAvatar === av ? 'var(--primary-bg)' : 'var(--bg-surface)', cursor: 'pointer', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)' }}>
                  {av}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>Or upload an image as your profile picture</p>
            <label className="sc-btn sc-btn-primary" style={{ width: '100%', marginTop: 10, padding: '10px', justifyContent: 'center', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
              <Icons.Paperclip size={16} /> Upload Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return
                const formData = new FormData(); formData.append('file', file)
                try {
                  const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
                  const res = await axios.post(`${API_URL}/api/upload`, formData, config)
                  if (res.data.success) {
                    setSelectedAvatar(res.data.data.url)
                    handleUpdateProfile('avatar', res.data.data.url)
                  }
                } catch (_) { showToast('Upload failed.') }
              }} />
            </label>
          </div>
        </div>
      )}

      {/* Name Modal */}
      {profileModalType === 'name' && (
        <div onClick={() => setProfileModalType(null)} className="sc-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div onClick={e => e.stopPropagation()} className="sc-modal-content" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Change Profile Name</h3>
              <button onClick={() => setProfileModalType(null)} className="sc-btn-icon"><Icons.X size={18} /></button>
            </div>
            <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="Enter your name"
              className="sc-input" style={{ marginBottom: 16 }} maxLength={50} autoFocus />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setProfileModalType(null)} className="sc-btn" style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', fontSize: 14 }}>Cancel</button>
              <button onClick={() => { if (editingName.trim().length >= 2) handleUpdateProfile('name', editingName.trim()) }} className="sc-btn sc-btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal (from Settings tab) */}
      {themeModalOpen && (
        <div onClick={() => setThemeModalOpen(false)} className="sc-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div onClick={e => e.stopPropagation()} className="sc-modal-content" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Palette size={20} /> Select Theme
              </h3>
              <button onClick={() => setThemeModalOpen(false)} className="sc-btn-icon"><Icons.X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {THEMES.map(theme => (
                <div key={theme.id}
                  className={`sc-theme-card ${currentTheme === theme.id ? 'sc-theme-card--active' : ''}`}
                  onClick={() => { setCurrentTheme(theme.id); setTimeout(() => setThemeModalOpen(false), 300) }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: theme.color, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform var(--transition-fast)' }}>
                    {currentTheme === theme.id && <Icons.Check size={20} style={{ color: '#fff' }} />}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{theme.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, marginTop: 4 }}>{theme.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Wallpaper Modal (from Chat dropdown) */}
      {wallpaperModalOpen && (
        <div onClick={() => setWallpaperModalOpen(false)} className="sc-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div onClick={e => e.stopPropagation()} className="sc-modal-content" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Image size={20} /> Chat Wallpaper
              </h3>
              <button onClick={() => setWallpaperModalOpen(false)} className="sc-btn-icon"><Icons.X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {WALLPAPERS.map(wp => (
                <div key={wp.id}
                  className={`sc-theme-card ${currentWallpaper === wp.id ? 'sc-theme-card--active' : ''}`}
                  onClick={() => { setCurrentWallpaper(wp.id); setTimeout(() => setWallpaperModalOpen(false), 300) }}>
                  <div className="sc-chat-wallpaper" data-wallpaper={wp.id} style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-md)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                    {currentWallpaper === wp.id && <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '50%', padding: 4 }}><Icons.Check size={20} style={{ color: '#fff' }} /></div>}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{wp.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div onClick={() => setFullscreenImage(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <button onClick={() => setFullscreenImage(null)} style={{ position: 'absolute', top: 'env(safe-area-inset-top, 20px)', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#fff', transition: 'background 0.2s' }}>
            <Icons.X size={24} />
          </button>
          <img src={fullscreenImage} alt="Fullscreen" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
