import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import {
  MessageSquare, Users, Settings, LogOut, Plus, Search, Send,
  Image as ImageIcon, Video as VideoIcon, Smile, X, Check, CheckCheck,
  Trash2, MoreVertical, ArrowLeft, Lock
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const EMOJI_LIST = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🤫','🤥','😶','😐','😑','😬','🫠','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👋','🤚','✋','👌','✌️','🤞','🤟','🤘','🤙','👍','👎','✊','👊','👏','🙌','🤝','🙏','❤️','🧡','💛','💚','💙','💜','🖤','💔','💖','💗','💓','💞','💕','🔥','⭐','✨','💥','🌟']
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export default function Chat() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const myData = JSON.parse(localStorage.getItem('user') || '{}')

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
  const [lastMessages, setLastMessages] = useState({}) // Track last message per friend

  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null)
  const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const [friendTypingId, setFriendTypingId] = useState(null)
  const [amTyping, setAmTyping] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState([])

  // ── Data fetching ───────────────────────────────────────
  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const friendsRes = await axios.get(`${API_URL}/api/friends`, config)
      if (friendsRes.data.success) {
        setFriends(friendsRes.data.data.friends)
        // Fetch last message for each friend
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
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchData()

    const socket = io(API_URL, { auth: { token: `Bearer ${token}` } })
    socketRef.current = socket
    socket.on('connect', () => console.log('🔌 Connected'))

    socket.on('message:receive', ({ message }) => {
      if (activeFriend && (message.sender._id === activeFriend._id || message.receiver === activeFriend._id)) {
        setMessages(prev => [...prev, message])
        socket.emit('message:read', { senderId: activeFriend._id })
      } else {
        fetchData()
      }
      // Update last message
      const friendId = message.sender._id === myData.id ? message.receiver : message.sender._id
      setLastMessages(prev => ({ ...prev, [friendId]: message }))
    })

    socket.on('message:delivered', ({ messageId }) => {
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, status: 'delivered' } : msg))
    })
    socket.on('message:read', ({ readBy }) => {
      if (activeFriend && readBy === activeFriend._id) {
        setMessages(prev => prev.map(msg => msg.status !== 'read' ? { ...msg, status: 'read' } : msg))
      }
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
    socket.on('friend:request', () => { showToast('📩 New friend request!'); fetchData() })
    socket.on('friend:accepted', ({ friend }) => { showToast(`🎉 ${friend.name} accepted your request!`); fetchData() })
    socket.on('typing:start', ({ senderId }) => { if (activeFriend?._ === senderId) setFriendTypingId(senderId) })
    socket.on('typing:stop', ({ senderId }) => { if (activeFriend?._id === senderId) setFriendTypingId(null) })

    return () => socket.disconnect()
  }, [token, activeFriend?._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, uploadingFiles])

  // ── Helpers ─────────────────────────────────────────────
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000) }
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const getDateHeader = (d) => {
    const date = new Date(d), today = new Date(), yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'TODAY'
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
  }
  const getInitial = (n) => (n || '?')[0].toUpperCase()
  const COLORS = ['#25D366','#128C7E','#075E54','#34B7F1','#00A884','#FF6B6B','#C084FC','#FB923C']
  const getColor = (n) => { let h=0; for(let i=0;i<(n||'').length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

  const getLastMsgPreview = (friendId) => {
    const msg = lastMessages[friendId]
    if (!msg) return ''
    if (msg.isDeletedForEveryone) return '🚫 This message was deleted'
    if (msg.messageType === 'image') return '📷 Photo'
    if (msg.messageType === 'video') return '📹 Video'
    return msg.text || ''
  }
  const getLastMsgTime = (friendId) => {
    const msg = lastMessages[friendId]
    if (!msg) return ''
    return formatTime(msg.createdAt)
  }

  // ── Actions ─────────────────────────────────────────────
  const selectFriend = async (friend) => {
    setActiveFriend(friend); setIsDrawerOpen(false); setMessages([])
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.get(`${API_URL}/api/messages/conversation/${friend._id}`, config)
      if (res.data.success) {
        setMessages(res.data.data.messages)
        socketRef.current?.emit('message:read', { senderId: friend._id })
        // Update last message
        if (res.data.data.messages.length > 0) {
          setLastMessages(prev => ({ ...prev, [friend._id]: res.data.data.messages[res.data.data.messages.length - 1] }))
        }
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

  const handleSendMessage = (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || !activeFriend) return
    socketRef.current?.emit('message:send', { receiverId: activeFriend._id, text: inputText.trim(), messageType: 'text' }, (res) => {
      if (res.success) {
        setMessages(prev => [...prev, res.message])
        setLastMessages(prev => ({ ...prev, [activeFriend._id]: res.message }))
      }
    })
    setInputText(''); stopTyping()
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
    const tempId = Date.now(); const previewUrl = URL.createObjectURL(file)
    setUploadingFiles(prev => [...prev, { id: tempId, type, previewUrl, progress: 10 }])
    const formData = new FormData(); formData.append('file', file)
    try {
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => { const pct = Math.round((p.loaded*100)/p.total); setUploadingFiles(prev => prev.map(f => f.id===tempId ? {...f, progress:pct} : f)) }
      }
      const res = await axios.post(`${API_URL}/api/upload`, formData, config)
      if (res.data.success) {
        socketRef.current?.emit('message:send', { receiverId: activeFriend._id, text: '', fileUrl: res.data.data.url, messageType: res.data.data.fileType }, (socketRes) => {
          if (socketRes.success) {
            setMessages(prev => [...prev, socketRes.message])
            setLastMessages(prev => ({ ...prev, [activeFriend._id]: socketRes.message }))
          }
        })
      }
    } catch(_) { showToast('Upload failed.') }
    finally { setUploadingFiles(prev => prev.filter(f => f.id !== tempId)); URL.revokeObjectURL(previewUrl) }
  }

  const handleReactMessage = (messageId, emoji) => {
    socketRef.current?.emit('message:react', { messageId, emoji }, (res) => {
      if (res.success) setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions: res.reactions } : msg))
    })
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

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.mobilenumber.includes(searchQuery)
  )

  // ── Inline styles (WhatsApp exact) ──────────────────────
  const S = {
    // Layout
    root: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#dddbd1' },
    container: { display: 'flex', width: '100%', height: '100%', maxWidth: 1600, margin: '0 auto', position: 'relative' },
    // Sidebar
    sidebar: { width: 380, minWidth: 380, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRight: '1px solid #e9edef' },
    sidebarHeader: { padding: '10px 16px', backgroundColor: '#008069', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
    // Chat panel
    chatPanel: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', backgroundColor: '#ECE5DD' },
    chatHeader: { padding: '8px 16px', backgroundColor: '#008069', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, flexShrink: 0 },
    // Input
    inputBar: { padding: '6px 8px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'flex-end', gap: 8, flexShrink: 0 },
    inputRow: { flex: 1, display: 'flex', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 8, padding: '4px 4px 4px 10px', gap: 2 },
    sendBtn: { width: 48, height: 48, borderRadius: '50%', border: 'none', backgroundColor: '#00A884', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
    // Buttons
    iconBtn: { width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: '#54656f', flexShrink: 0 },
    headerIconBtn: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#E0F2F1' },
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={S.root}>
      {/* Toast */}
      {toastMessage && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', backgroundColor:'#323739', color:'#E9EDEF', fontSize:14, padding:'10px 24px', borderRadius:8, zIndex:9999, boxShadow:'0 4px 12px rgba(0,0,0,0.25)' }}>
          {toastMessage}
        </div>
      )}

      <div style={S.container}>
        {/* ═══ SIDEBAR ═══ */}
        <aside style={S.sidebar} className={`wa-sidebar ${activeFriend ? 'wa-hide-mobile' : ''}`}>
          {/* Header */}
          <div style={S.sidebarHeader}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', backgroundColor:getColor(myData.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:16 }}>
                {getInitial(myData.name)}
              </div>
              <span style={{ fontSize:16, fontWeight:500, color:'#fff' }}>{myData.name}</span>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setIsAddFriendOpen(!isAddFriendOpen)} style={{...S.headerIconBtn, transform: isAddFriendOpen ? 'rotate(45deg)' : 'none', transition:'transform 0.2s'}} title="Add Contact">
                <Plus style={{ width:22, height:22 }} />
              </button>
              <button onClick={handleLogout} style={S.headerIconBtn} title="Log Out">
                <LogOut style={{ width:20, height:20 }} />
              </button>
            </div>
          </div>

          {/* Add Friend */}
          {isAddFriendOpen && (
            <form onSubmit={handleAddFriend} style={{ padding:'12px 16px', backgroundColor:'#f0f2f5', borderBottom:'1px solid #e9edef' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#008069', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Add New Contact</p>
              <div style={{ display:'flex', gap:8 }}>
                <input type="text" placeholder="Enter mobile number..." value={newFriendMobile} onChange={(e)=>setNewFriendMobile(e.target.value)}
                  style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'none', fontSize:14, outline:'none', backgroundColor:'#fff' }} />
                <button type="submit" style={{ padding:'8px 16px', borderRadius:8, border:'none', backgroundColor:'#00A884', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>Send</button>
              </div>
              {addFriendError && <p style={{ color:'#ea0038', fontSize:12, marginTop:6 }}>{addFriendError}</p>}
              {addFriendSuccess && <p style={{ color:'#00A884', fontSize:12, marginTop:6 }}>{addFriendSuccess}</p>}
            </form>
          )}

          {/* Search */}
          <div style={{ padding:'8px 12px', backgroundColor:'#f0f2f5' }}>
            <div style={{ position:'relative' }}>
              <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#8696a0' }} />
              <input type="text" placeholder="Search or start new chat" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}
                style={{ width:'100%', padding:'8px 12px 8px 36px', borderRadius:8, border:'none', fontSize:14, backgroundColor:'#fff', outline:'none', color:'#111b21' }} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', backgroundColor:'#fff', borderBottom:'1px solid #e9edef' }}>
            {[
              { key:'chats', label:'Chats', icon:<MessageSquare style={{width:16,height:16}}/> },
              { key:'requests', label:'Requests', icon:<Users style={{width:16,height:16}}/> },
              { key:'settings', label:'Settings', icon:<Settings style={{width:16,height:16}}/> },
            ].map(tab => (
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                style={{ flex:1, padding:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, backgroundColor:'transparent', color:activeTab===tab.key?'#008069':'#54656f', borderBottom:activeTab===tab.key?'3px solid #008069':'3px solid transparent', position:'relative' }}>
                {tab.icon} {tab.label}
                {tab.key==='requests' && pendingRequests.length>0 && (
                  <span style={{ width:18, height:18, borderRadius:'50%', backgroundColor:'#25D366', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{pendingRequests.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {/* CHATS LIST */}
            {activeTab === 'chats' && (
              <div>
                {filteredFriends.length === 0 ? (
                  <p style={{ padding:32, textAlign:'center', fontSize:14, color:'#8696a0' }}>No chats yet.<br/>Tap "+" to add contacts!</p>
                ) : filteredFriends.map(friend => (
                  <div key={friend._id} onClick={()=>selectFriend(friend)}
                    className={`wa-chat-item ${activeFriend?._id===friend._id?'wa-chat-item-active':''}`}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f0f2f5', backgroundColor: activeFriend?._id===friend._id ? '#f0f2f5' : '#fff', transition:'background 0.12s' }}>
                    {/* Avatar */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{ width:49, height:49, borderRadius:'50%', backgroundColor:getColor(friend.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, color:'#fff', fontSize:20 }}>
                        {getInitial(friend.name)}
                      </div>
                      {friend.isOnline && <span style={{ position:'absolute', bottom:1, right:1, width:12, height:12, borderRadius:'50%', backgroundColor:'#25D366', border:'2px solid #fff' }} />}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:2 }}>
                        <h4 style={{ fontSize:16.5, fontWeight:400, color:'#111b21', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{friend.name}</h4>
                        <span style={{ fontSize:12, color: '#667781', flexShrink:0 }}>{getLastMsgTime(friend._id)}</span>
                      </div>
                      <p style={{ fontSize:13.5, color:'#667781', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
                        {getLastMsgPreview(friend._id) || (friend.isOnline ? <span style={{color:'#00A884'}}>online</span> : <span style={{color:'#8696a0'}}>Tap to chat</span>)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <div style={{ padding:16 }}>
                <h4 style={{ fontSize:12, fontWeight:600, color:'#008069', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Pending Requests</h4>
                {pendingRequests.length === 0 ? (
                  <p style={{ textAlign:'center', fontSize:14, color:'#8696a0', padding:24 }}>No pending requests.</p>
                ) : pendingRequests.map(req => (
                  <div key={req._id} style={{ backgroundColor:'#f0f2f5', padding:12, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                    <div style={{ minWidth:0 }}>
                      <h5 style={{ fontSize:14, fontWeight:500, color:'#111b21', margin:0 }}>{req.from.name}</h5>
                      <p style={{ fontSize:12, color:'#00A884', margin:0 }}>{req.from.mobilenumber}</p>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>handleRequestResponse(req.from._id,'accept')} style={{ padding:'6px 14px', borderRadius:8, border:'none', backgroundColor:'#00A884', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer' }}>Accept</button>
                      <button onClick={()=>handleRequestResponse(req.from._id,'reject')} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #d1d5db', backgroundColor:'#fff', color:'#667781', fontWeight:600, fontSize:12, cursor:'pointer' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <div style={{ padding:20 }}>
                <div style={{ backgroundColor:'#fff', borderRadius:12, padding:24, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:16 }}>
                  <div style={{ width:80, height:80, borderRadius:'50%', backgroundColor:getColor(myData.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:32, marginBottom:12 }}>
                    {getInitial(myData.name)}
                  </div>
                  <h4 style={{ fontSize:18, fontWeight:600, color:'#111b21', margin:0 }}>{myData.name}</h4>
                  <p style={{ fontSize:14, color:'#00A884', fontWeight:500, marginTop:4 }}>{myData.mobilenumber}</p>
                </div>
                <div style={{ backgroundColor:'#fff', borderRadius:12, padding:16 }}>
                  <h5 style={{ fontSize:12, fontWeight:600, color:'#008069', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>About</h5>
                  {[['Encryption','End-to-end encrypted'],['Server','NodeJS WebSockets'],['Media','Cloudinary CDN']].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f2f5', fontSize:14 }}>
                      <span style={{ color:'#667781' }}>{l}</span>
                      <span style={{ color:'#111b21', fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ═══ CHAT PANEL ═══ */}
        {activeFriend ? (
          <main style={S.chatPanel} className="wa-chat-panel">
            {/* Chat Header */}
            <div style={S.chatHeader}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={()=>setActiveFriend(null)} className="wa-show-mobile-only" style={{ padding:4, border:'none', background:'transparent', cursor:'pointer', color:'#E0F2F1' }}>
                  <ArrowLeft style={{ width:22, height:22 }} />
                </button>
                <div onClick={()=>setIsDrawerOpen(true)} style={{ position:'relative', flexShrink:0, cursor:'pointer' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', backgroundColor:getColor(activeFriend.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:16 }}>
                    {getInitial(activeFriend.name)}
                  </div>
                  {activeFriend.isOnline && <span style={{ position:'absolute', bottom:0, right:0, width:10, height:10, borderRadius:'50%', backgroundColor:'#25D366', border:'2px solid #008069' }} />}
                </div>
                <div style={{ cursor:'pointer' }} onClick={()=>setIsDrawerOpen(true)}>
                  <h3 style={{ fontSize:16, fontWeight:500, color:'#fff', margin:0 }}>{activeFriend.name}</h3>
                  <p style={{ fontSize:12.5, color:'#E0F2F1', margin:0 }}>
                    {friendTypingId === activeFriend._id ? (
                      <span style={{ fontStyle:'italic' }}>typing...</span>
                    ) : activeFriend.isOnline ? 'online' : activeFriend.lastSeen ? `last seen at ${formatTime(activeFriend.lastSeen)}` : 'offline'}
                  </p>
                </div>
              </div>
              <button onClick={()=>setIsDrawerOpen(true)} style={S.headerIconBtn} title="Contact Info">
                <MoreVertical style={{ width:20, height:20 }} />
              </button>
            </div>

            {/* Messages */}
            <div className="wa-chat-wallpaper wa-messages-padding" style={{ flex:1, overflowY:'auto', padding:'8px 60px' }}>
              {messages.length === 0 && uploadingFiles.length === 0 ? (
                <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ backgroundColor:'#FFECD2', color:'#54656f', fontSize:12.5, padding:'8px 16px', borderRadius:8, textAlign:'center', maxWidth:320, lineHeight:1.5 }}>
                    <Lock style={{ width:12, height:12, display:'inline', verticalAlign:'middle', marginRight:4 }} />
                    Messages are end-to-end encrypted. No one outside of this chat can read them.
                  </div>
                </div>
              ) : (() => {
                let lastH = null
                return (
                  <>
                    {messages.map(msg => {
                      const dh = getDateHeader(msg.createdAt), show = dh !== lastH; lastH = dh
                      const isMe = msg.sender._id === myData.id || msg.sender === myData.id
                      const hasMedia = (msg.messageType==='image'||msg.messageType==='video') && !msg.isDeletedForEveryone
                      const hasText = msg.text && !msg.isDeletedForEveryone

                      return (
                        <React.Fragment key={msg._id}>
                          {show && (
                            <div style={{ display:'flex', justifyContent:'center', margin:'12px 0' }}>
                              <span style={{ backgroundColor:'#E2DACD', color:'#54656f', fontSize:12, fontWeight:500, padding:'5px 12px', borderRadius:8, boxShadow:'0 1px 1px rgba(0,0,0,0.06)', letterSpacing:0.3 }}>{dh}</span>
                            </div>
                          )}
                          <div className="wa-msg-row" style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', marginBottom:2, position:'relative' }}>
                            {/* Quick react bar */}
                            {!msg.isDeletedForEveryone && (
                              <div className="wa-quick-react" style={{ position:'absolute', top:-30, display:'none', alignItems:'center', gap:2, backgroundColor:'#fff', border:'1px solid #e9edef', padding:'4px 8px', borderRadius:20, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', zIndex:30, ...(isMe?{right:0}:{left:0}) }}>
                                {QUICK_REACTIONS.map(emoji => (
                                  <button key={emoji} onClick={()=>handleReactMessage(msg._id,emoji)} style={{ background:'none', border:'none', fontSize:16, cursor:'pointer', padding:'2px 3px' }}>{emoji}</button>
                                ))}
                                <button onClick={()=>setEmojiPickerMsgId(msg._id)} style={{ background:'none', border:'none', fontSize:13, cursor:'pointer', color:'#667781', fontWeight:700, padding:'2px 4px' }}>+</button>
                              </div>
                            )}

                            {/* Bubble */}
                            <div className="wa-msg-bubble" style={{
                              maxWidth:'65%', borderRadius:8,
                              borderTopRightRadius: isMe?0:8, borderTopLeftRadius: isMe?8:0,
                              padding: hasMedia ? 3 : '6px 7px 8px 9px',
                              position:'relative', boxShadow:'0 1px 0.5px rgba(11,20,26,0.13)',
                              backgroundColor: isMe ? '#D9FDD3' : '#fff',
                            }}>
                              {msg.isDeletedForEveryone ? (
                                <p style={{ fontSize:14.2, fontStyle:'italic', color:'#8696a0', margin:0, padding:'4px 6px' }}>🚫 This message was deleted</p>
                              ) : (
                                <>
                                  {msg.messageType==='image' && (
                                    <div style={{ borderRadius:6, overflow:'hidden', lineHeight:0 }}>
                                      <img src={msg.fileUrl} alt="Photo" style={{ maxWidth:330, width:'100%', maxHeight:400, objectFit:'cover', display:'block' }} />
                                    </div>
                                  )}
                                  {msg.messageType==='video' && (
                                    <div style={{ borderRadius:6, overflow:'hidden', lineHeight:0 }}>
                                      <video src={msg.fileUrl} controls style={{ maxWidth:330, width:'100%', maxHeight:400, objectFit:'contain', display:'block', backgroundColor:'#000', borderRadius:6 }} />
                                    </div>
                                  )}
                                  {msg.text && <p style={{ fontSize:14.2, lineHeight:1.45, margin:0, color:'#111b21', whiteSpace:'pre-wrap', padding:hasMedia?'4px 5px 0 5px':0 }}>{msg.text}</p>}
                                </>
                              )}

                              {/* Time + ticks */}
                              <div style={{
                                display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3, marginTop:1,
                                ...(hasMedia && !hasText ? { position:'absolute', bottom:6, right:8, backgroundColor:'rgba(0,0,0,0.35)', borderRadius:5, padding:'2px 6px' } : {}),
                              }}>
                                <span style={{ fontSize:11, color: hasMedia&&!hasText ? '#fff' : '#667781' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && !msg.isDeletedForEveryone && (
                                  <span style={{ display:'flex', alignItems:'center' }}>
                                    {msg.status==='sent' && <Check style={{ width:16, height:16, color:hasMedia&&!hasText?'#fff':'#667781' }} />}
                                    {msg.status==='delivered' && <CheckCheck style={{ width:16, height:16, color:hasMedia&&!hasText?'#fff':'#667781' }} />}
                                    {msg.status==='read' && <CheckCheck style={{ width:16, height:16, color:'#53BDEB' }} />}
                                  </span>
                                )}
                              </div>

                              {/* Reactions */}
                              {msg.reactions?.length > 0 && (
                                <div style={{ position:'absolute', bottom:-10, right:8, display:'flex', alignItems:'center', gap:2, backgroundColor:'#fff', border:'1px solid #e9edef', padding:'2px 6px', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.1)', fontSize:14 }}>
                                  {msg.reactions.map((r,i)=><span key={i}>{r.emoji}</span>)}
                                </div>
                              )}

                              {/* Actions btn */}
                              {!msg.isDeletedForEveryone && (
                                <button className="wa-msg-action" onClick={()=>setActiveMenuMsgId(activeMenuMsgId===msg._id?null:msg._id)}
                                  style={{ position:'absolute', right:4, top:4, background:isMe?'rgba(217,253,211,0.9)':'rgba(255,255,255,0.9)', border:'none', cursor:'pointer', padding:2, borderRadius:4, display:'none', alignItems:'center', justifyContent:'center', color:'#667781' }}>
                                  <MoreVertical style={{ width:16, height:16 }} />
                                </button>
                              )}

                              {/* Delete menu */}
                              {activeMenuMsgId===msg._id && (
                                <div style={{ position:'absolute', top:28, right:4, backgroundColor:'#fff', border:'1px solid #e9edef', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.12)', zIndex:50, overflow:'hidden', minWidth:160 }}>
                                  <button onClick={()=>handleDeleteMessage(msg._id,'me')} className="wa-chat-item"
                                    style={{ width:'100%', textAlign:'left', padding:'10px 16px', border:'none', backgroundColor:'transparent', cursor:'pointer', fontSize:14, color:'#111b21', display:'flex', alignItems:'center', gap:8 }}>
                                    <Trash2 style={{width:14,height:14}}/> Delete for me
                                  </button>
                                  {isMe && (
                                    <button onClick={()=>handleDeleteMessage(msg._id,'everyone')} className="wa-chat-item"
                                      style={{ width:'100%', textAlign:'left', padding:'10px 16px', border:'none', backgroundColor:'transparent', cursor:'pointer', fontSize:14, color:'#ea0038', display:'flex', alignItems:'center', gap:8, borderTop:'1px solid #f0f2f5' }}>
                                      <Trash2 style={{width:14,height:14}}/> Delete for everyone
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Emoji picker overlay */}
                          {emojiPickerMsgId===msg._id && (
                            <div onClick={()=>setEmojiPickerMsgId(null)} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
                              <div onClick={e=>e.stopPropagation()} style={{ backgroundColor:'#fff', borderRadius:12, padding:20, width:'100%', maxWidth:340, maxHeight:320, display:'flex', flexDirection:'column', boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                                  <span style={{ fontSize:14, fontWeight:600, color:'#008069' }}>Pick a reaction</span>
                                  <button onClick={()=>setEmojiPickerMsgId(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#667781' }}><X style={{width:18,height:18}}/></button>
                                </div>
                                <div style={{ overflowY:'auto', flex:1, display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
                                  {EMOJI_LIST.slice(0,36).map(emoji=>(
                                    <button key={emoji} onClick={()=>{handleReactMessage(msg._id,emoji);setEmojiPickerMsgId(null)}}
                                      style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', borderRadius:8, padding:4 }}>{emoji}</button>
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
                <div key={up.id} style={{ display:'flex', justifyContent:'flex-end', marginBottom:2 }}>
                  <div style={{ maxWidth:'65%', borderRadius:8, borderTopRightRadius:0, padding:3, backgroundColor:'#D9FDD3', boxShadow:'0 1px 0.5px rgba(11,20,26,0.13)' }}>
                    <div style={{ width:250, height:180, backgroundColor:'rgba(0,0,0,0.05)', borderRadius:6, overflow:'hidden', position:'relative' }}>
                      {up.type==='image' ? <img src={up.previewUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.5}}/> :
                        <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#000',opacity:0.5}}><VideoIcon style={{width:32,height:32,color:'#fff'}}/></div>}
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.4)' }}>
                        <span style={{ fontSize:13, color:'#fff', fontWeight:600, marginBottom:8 }}>Uploading {up.progress}%</span>
                        <div style={{ width:'70%', height:4, backgroundColor:'rgba(255,255,255,0.3)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:`${up.progress}%`, height:'100%', backgroundColor:'#00A884', borderRadius:2, transition:'width 0.3s' }}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={S.inputBar}>
              {/* Emoji popup */}
              {isInputEmojiOpen && (
                <div style={{ position:'absolute', bottom:60, left:12, backgroundColor:'#fff', border:'1px solid #e9edef', borderRadius:12, padding:16, width:280, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', zIndex:50 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, paddingBottom:8, borderBottom:'1px solid #f0f2f5' }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#008069' }}>Emoji</span>
                    <button onClick={()=>setIsInputEmojiOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#667781' }}><X style={{width:16,height:16}}/></button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, maxHeight:160, overflowY:'auto' }}>
                    {EMOJI_LIST.slice(0,30).map(emoji=>(
                      <button key={emoji} onClick={()=>{setInputText(p=>p+emoji);setIsInputEmojiOpen(false)}} style={{ fontSize:22, background:'none', border:'none', cursor:'pointer' }}>{emoji}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={S.inputRow}>
                <button onClick={()=>setIsInputEmojiOpen(!isInputEmojiOpen)} style={S.iconBtn} title="Emoji"><Smile style={{width:22,height:22}}/></button>
                <label style={{...S.iconBtn, cursor:'pointer'}} title="Photo"><ImageIcon style={{width:22,height:22}}/><input type="file" accept="image/*" onChange={e=>handleUploadFile(e,'image')} style={{display:'none'}}/></label>
                <label style={{...S.iconBtn, cursor:'pointer'}} title="Video"><VideoIcon style={{width:22,height:22}}/><input type="file" accept="video/*" onChange={e=>handleUploadFile(e,'video')} style={{display:'none'}}/></label>
                <form onSubmit={handleSendMessage} style={{ flex:1, display:'flex' }}>
                  <input type="text" placeholder="Type a message" value={inputText} onChange={handleInputChange}
                    style={{ flex:1, padding:'8px 12px', border:'none', outline:'none', fontSize:15, color:'#111b21', backgroundColor:'transparent' }} />
                </form>
              </div>
              <button onClick={handleSendMessage} style={S.sendBtn}><Send style={{width:20,height:20}}/></button>
            </div>

            {/* Contact Drawer */}
            {isDrawerOpen && (
              <div style={{ position:'absolute', top:0, right:0, bottom:0, width:340, backgroundColor:'#fff', borderLeft:'1px solid #e9edef', zIndex:100, boxShadow:'-2px 0 8px rgba(0,0,0,0.08)', display:'flex', flexDirection:'column' }}>
                <div style={{ padding:'12px 16px', backgroundColor:'#008069', display:'flex', alignItems:'center', gap:16, minHeight:56 }}>
                  <button onClick={()=>setIsDrawerOpen(false)} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', border:'none', background:'transparent', cursor:'pointer', color:'#E0F2F1' }}><X style={{width:20,height:20}}/></button>
                  <h3 style={{ fontSize:16, fontWeight:500, color:'#fff', margin:0 }}>Contact info</h3>
                </div>
                <div style={{ flex:1, overflowY:'auto' }}>
                  <div style={{ padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', borderBottom:'8px solid #f0f2f5' }}>
                    <div style={{ width:80, height:80, borderRadius:'50%', backgroundColor:getColor(activeFriend.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:32, marginBottom:12 }}>{getInitial(activeFriend.name)}</div>
                    <h4 style={{ fontSize:20, fontWeight:500, color:'#111b21', margin:0 }}>{activeFriend.name}</h4>
                    <p style={{ fontSize:14, color:'#667781', marginTop:4 }}>{activeFriend.mobilenumber}</p>
                    <p style={{ fontSize:13, marginTop:4, color:activeFriend.isOnline?'#00A884':'#667781', fontWeight:500 }}>{activeFriend.isOnline?'Online':'Offline'}</p>
                  </div>
                  <div style={{ padding:16, borderBottom:'8px solid #f0f2f5' }}>
                    <p style={{ fontSize:14, color:'#667781', margin:0, marginBottom:4 }}>About</p>
                    <p style={{ fontSize:14, color:'#111b21', margin:0 }}>Hey there! I am using SecretChat.</p>
                  </div>
                  <div style={{ padding:16, display:'flex', alignItems:'center', gap:12 }}>
                    <Lock style={{ width:20, height:20, color:'#667781' }} />
                    <div>
                      <p style={{ fontSize:14, color:'#111b21', margin:0 }}>Encryption</p>
                      <p style={{ fontSize:13, color:'#667781', margin:0, marginTop:2 }}>Messages are end-to-end encrypted.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        ) : (
          /* Empty State */
          <main style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:32, backgroundColor:'#f0f2f5' }}
            className="wa-hide-mobile">
            <div style={{ width:320, maxWidth:'100%' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', backgroundColor:'#E0F2F1', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
                <MessageSquare style={{ width:36, height:36, color:'#00A884' }} />
              </div>
              <h3 style={{ fontSize:28, fontWeight:300, color:'#41525d', marginBottom:12 }}>SecretChat Web</h3>
              <p style={{ fontSize:14, color:'#667781', lineHeight:1.6 }}>Send and receive messages, photos and videos.<br/>Select a chat from the sidebar to start messaging.</p>
              <div style={{ marginTop:40, display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'#8696a0', fontSize:13 }}>
                <Lock style={{ width:14, height:14 }} /> End-to-end encrypted
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
