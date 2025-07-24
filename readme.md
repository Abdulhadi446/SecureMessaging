# Secure Messaging App with Authentication

A real-time messaging application built with Node.js, Express, Socket.IO, and JWT authentication.

## Features

### 🔐 Authentication System

- **User Registration** with validation
- **Secure Login** with bcrypt password hashing
- **JWT Token-based** authentication
- **Session Management** with automatic logout
- **Rate Limiting** to prevent brute force attacks
- **Persistent Login** (remembers users between sessions)

### 💬 Messaging Features

- **Real-time messaging** using WebSockets
- **Message history** for new users
- **Typing indicators**
- **Online user list** with email display
- **System notifications** (user join/leave)
- **Message validation** and XSS protection

### 🛡️ Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with expiration
- Input validation and sanitization
- Rate limiting on auth endpoints
- CORS protection
- HTML escaping to prevent XSS

## Installation

### 1. Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### 2. Clone and Setup

```bash
# Create project directory
mkdir secure-messaging-app
cd secure-messaging-app

# Create the required files (copy the code from artifacts)
# - server.js
# - package.json
# - public/index.html

# Install dependencies
npm install
```

### 3. Environment Variables (Optional)

Create a `.env` file for production:

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
PORT=3000
NODE_ENV=production
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access the App

Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
secure-messaging-app/
├── server.js              # Main server file with auth & socket handling
├── package.json           # Dependencies and scripts
├── database.js            # Optional database configuration
├── public/
│   └── index.html         # Client-side application
└── README.md             # This file
```

## Usage

### Registration

1. Click "Register here" on the login page
2. Fill in username (3-20 characters), email, and password (6+ characters)
3. Confirm your password
4. Click "Register" to create your account

### Login

1. Enter your email and password
2. Click "Login" to access the chat
3. Your session will be remembered for 7 days

### Messaging

1. Type your message in the input field
2. Press Enter or click Send
3. See real-time typing indicators
4. View online users in the sidebar

## Security Considerations

### Current Implementation (Development)

- Uses in-memory storage (not persistent)
- Default JWT secret (change in production)
- No HTTPS (add reverse proxy in production)

### Production Recommendations

1. **Use a real database** (MongoDB/PostgreSQL)
2. **Set strong JWT secret** (32+ random characters)
3. **Enable HTTPS** with SSL certificates
4. **Add environment variables** for all secrets
5. **Implement logging** for security events
6. **Add email verification** for new accounts
7. **Implement password reset** functionality
8. **Add admin moderation** features

## Database Integration

The app currently uses in-memory storage. For production, use the provided `database.js` file:

### MongoDB Setup

```bash
# Install MongoDB dependencies
npm install mongoose

# Update server.js to use database
const { connectToDatabase, User, Message } = require('./database');
```

### PostgreSQL Setup

```bash
# Install PostgreSQL dependencies
npm install sequelize pg pg-hstore

# Uncomment PostgreSQL section in database.js
```

## API Endpoints

### Authentication

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (requires token)

### WebSocket Events

- `send_message` - Send a new message
- `typing` - Indicate user is typing
- `stop_typing` - Stop typing indicator

## Troubleshooting

### Common Issues

1. **"Too many authentication attempts"** - Wait 15 minutes or restart server
2. **"Invalid token"** - Clear browser localStorage and login again
3. **Connection issues** - Check if server is running on correct port
4. **Password errors** - Ensure password is at least 6 characters

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code for your own projects!

## Future Enhancements

- [ ] Private messaging
- [ ] File/image uploads
- [ ] Message reactions
- [ ] Chat rooms/channels
- [ ] Push notifications
- [ ] Message encryption
- [ ] Admin panel
- [ ] Mobile app (React Native)
- [ ] Voice/video calling
