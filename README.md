# ChatApp Backend

A WhatsApp-style private chat backend built with **Node.js**, **Express**, **Socket.IO**, and **MongoDB**.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
```
Then fill in your values in `.env`:
- `MONGO_URI` — Your MongoDB connection string
- `JWT_SECRET` — Any long random string
- `EMAIL_USER` — Your Gmail address
- `EMAIL_PASS` — Your Gmail **App Password** (not your real password)

> To get a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

### 3. Run the Server
```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

---

## 📁 Project Structure

```
chatapp/
├── server.js                  ← Entry point
├── config/
│   └── database.js            ← MongoDB connection
├── models/
│   ├── User.js                ← User schema
│   └── Message.js             ← Message schema with tick states
├── middleware/
│   ├── auth.js                ← JWT middleware for REST routes
│   └── socketAuth.js          ← JWT middleware for Socket.IO
├── controllers/
│   ├── authController.js      ← Register, OTP, Login
│   ├── friendController.js    ← Friend requests
│   └── messageController.js   ← Conversation history
├── routes/
│   ├── authRoutes.js
│   ├── friendRoutes.js
│   └── messageRoutes.js
├── socket/
│   └── socketHandlers.js      ← All real-time events
└── utils/
    ├── email.js               ← Nodemailer OTP sender
    ├── jwt.js                 ← Token helpers
    └── response.js            ← Standard API response format
```

---

## 🔑 Authentication Flow

```
1. POST /api/auth/register    → Submit name, email, password → Receive OTP email
2. POST /api/auth/verify-otp  → Submit email + OTP → Receive JWT token
3. POST /api/auth/login       → Submit email + password → Receive JWT token
```

All protected routes need this header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📡 REST API Endpoints

### Auth
| Method | Endpoint                  | Auth | Description                  |
|--------|---------------------------|------|------------------------------|
| POST   | `/api/auth/register`      | No   | Register + send OTP email    |
| POST   | `/api/auth/verify-otp`    | No   | Verify OTP → get token       |
| POST   | `/api/auth/resend-otp`    | No   | Resend OTP email             |
| POST   | `/api/auth/login`         | No   | Login → get token            |
| GET    | `/api/auth/me`            | Yes  | Get my profile               |

### Friends
| Method | Endpoint                                | Auth | Description                  |
|--------|-----------------------------------------|------|------------------------------|
| POST   | `/api/friends/request`                  | Yes  | Send friend request by email |
| PUT    | `/api/friends/accept/:requesterId`      | Yes  | Accept a friend request      |
| DELETE | `/api/friends/reject/:requesterId`      | Yes  | Reject a friend request      |
| GET    | `/api/friends`                          | Yes  | Get my friends list          |
| GET    | `/api/friends/requests/pending`         | Yes  | Get pending requests         |

### Messages
| Method | Endpoint                                      | Auth | Description                        |
|--------|-----------------------------------------------|------|------------------------------------|
| GET    | `/api/messages/conversation/:friendId`        | Yes  | Load chat history (marks as read)  |
| DELETE | `/api/messages/:messageId/for-me`             | Yes  | Delete message for yourself only   |
| DELETE | `/api/messages/:messageId/for-everyone`       | Yes  | Delete message for both sides      |

---

## ⚡ Socket.IO Real-Time Events

### How to Connect (Frontend)
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "Bearer <your_jwt_token>"
  }
});
```

### Events You EMIT (send to server)

| Event           | Payload                              | Description               |
|-----------------|--------------------------------------|---------------------------|
| `message:send`  | `{ receiverId, text }`               | Send a text message       |
| `message:read`  | `{ senderId }`                       | Mark messages as read     |
| `typing:start`  | `{ receiverId }`                     | Tell friend you're typing |
| `typing:stop`   | `{ receiverId }`                     | Stop typing indicator     |

### Events You LISTEN TO (from server)

| Event               | Payload                              | Description                         |
|---------------------|--------------------------------------|-------------------------------------|
| `message:receive`   | `{ message }`                        | New message arrived                 |
| `message:delivered` | `{ messageId, deliveredAt }`         | Your message was delivered ✓✓       |
| `message:read`      | `{ readBy, readAt }`                 | Your message was read ✓✓ (blue)     |
| `typing:start`      | `{ senderId }`                       | Friend is typing...                 |
| `typing:stop`       | `{ senderId }`                       | Friend stopped typing               |
| `friend:online`     | `{ userId }`                         | A friend came online                |
| `friend:offline`    | `{ userId, lastSeen }`               | A friend went offline               |

### Message Tick System

| Status      | Meaning                  | Display       |
|-------------|--------------------------|---------------|
| `sent`      | Server received message  | ✓ (grey)      |
| `delivered` | Receiver's device got it | ✓✓ (grey)     |
| `read`      | Receiver opened the chat | ✓✓ (blue)     |

### Frontend Example: Sending a Message
```javascript
// Send a message
socket.emit("message:send", { receiverId: "friend_user_id", text: "Hello!" }, (response) => {
  if (response.success) {
    // Show single grey tick ✓
    console.log("Message sent:", response.message);
  }
});

// Listen for delivery confirmation (double grey tick)
socket.on("message:delivered", ({ messageId }) => {
  // Update UI: show ✓✓ grey for messageId
});

// Listen for read confirmation (double blue tick)
socket.on("message:read", ({ readBy }) => {
  // Update UI: show ✓✓ blue for all messages sent to readBy
});

// When user opens a chat, mark messages as read
socket.emit("message:read", { senderId: "friend_user_id" });
```
