const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const path = require("path");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const { connectToDatabase, User, Message } = require("./database");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
connectToDatabase();

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts. Try again later." },
});

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const connectedUsers = new Map(); // userId -> { socketId, username, email }

// JWT Verification
const authenticateToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register
app.post("/api/register", authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Profile
app.get("/api/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = authenticateToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isOnline: user.isOnline,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Socket.IO Auth Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = authenticateToken(token);
    if (!decoded) return next(new Error("Invalid token"));

    const user = await User.findById(decoded.userId);
    if (!user) return next(new Error("User not found"));

    socket.userId = user._id;
    socket.userData = user;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

// Socket.IO Connection
io.on("connection", async (socket) => {
  console.log(
    `User connected: ${socket.userData.username} (${socket.userData.email})`
  );

  connectedUsers.set(socket.userId.toString(), {
    socketId: socket.id,
    username: socket.userData.username,
    email: socket.userData.email,
    connectedAt: new Date(),
  });

  await User.findByIdAndUpdate(socket.userId, { isOnline: true });

  // Send message history
  const history = await Message.find()
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();
  socket.emit("message_history", history.reverse());

  // Notify others
  socket.broadcast.emit("user_joined", {
    username: socket.userData.username,
    timestamp: new Date(),
  });

  // Send updated online users
  io.emit("users_update", Array.from(connectedUsers.values()));

  // Receive messages
  socket.on("send_message", async (data) => {
    const text = data.text?.trim();
    if (!text || text.length > 500) return;

    const newMessage = new Message({
      userId: socket.userId,
      username: socket.userData.username,
      text,
    });

    await newMessage.save();

    io.emit("new_message", {
      id: newMessage._id,
      userId: newMessage.userId,
      username: newMessage.username,
      text: newMessage.text,
      timestamp: newMessage.timestamp,
    });
  });

  // Typing indicators
  socket.on("typing", () => {
    socket.broadcast.emit("user_typing", socket.userData.username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("user_stop_typing", socket.userData.username);
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.userData.username}`);

    connectedUsers.delete(socket.userId.toString());
    await User.findByIdAndUpdate(socket.userId, { isOnline: false });

    socket.broadcast.emit("user_left", {
      username: socket.userData.username,
      timestamp: new Date(),
    });

    io.emit("users_update", Array.from(connectedUsers.values()));
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
