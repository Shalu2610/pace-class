const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectDB, pool } = require('./config/db');
const routes = require('./routes/index');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Routes
app.use('/api', routes);
app.get('/', (req, res) => res.json({ message: 'PACE Classroom API Running ✅' }));

// ── Socket.io — Real-time Engine ──────────────────
const activeRooms = {}; // { sessionId: { trainerId, learners: Set } }

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join session room
  socket.on('join_session', ({ sessionId, userId, role, name }) => {
    const room = `session_${sessionId}`;
    socket.join(room);
    socket.data = { sessionId, userId, role, name };

    if (!activeRooms[sessionId]) activeRooms[sessionId] = { learners: new Set() };
    if (role === 'trainer') activeRooms[sessionId].trainerId = socket.id;
    else activeRooms[sessionId].learners.add({ socketId: socket.id, userId, name });

    // Notify trainer about new learner
    if (role === 'learner') {
      io.to(room).emit('learner_joined', { userId, name, timestamp: new Date() });
    }
    console.log(`👥 ${name} (${role}) joined session ${sessionId}`);
  });

  // Trainer sends content update
  socket.on('content_update', ({ sessionId, contentId, contentTitle }) => {
    socket.to(`session_${sessionId}`).emit('content_changed', { contentId, contentTitle });
  });

  // Trainer launches quiz
  socket.on('launch_quiz', ({ sessionId, quizId, quizTitle }) => {
    io.to(`session_${sessionId}`).emit('quiz_started', { quizId, quizTitle, timestamp: new Date() });
  });

  // Trainer launches poll
  socket.on('launch_poll', ({ sessionId, pollId, question, options }) => {
    io.to(`session_${sessionId}`).emit('poll_started', { pollId, question, options });
  });

  // Learner sends engagement event
  socket.on('engagement_event', ({ sessionId, userId, eventType, score }) => {
    io.to(`session_${sessionId}`).emit('engagement_update', { userId, eventType, score, timestamp: new Date() });
  });

  // Learner asks question
  socket.on('ask_question', ({ sessionId, userId, name, question }) => {
    io.to(`session_${sessionId}`).emit('new_question', { userId, name, question, timestamp: new Date() });
    // Save to DB
    pool.query('INSERT INTO live_questions (session_id, learner_id, question) VALUES (?, ?, ?)', [sessionId, userId, question]);
  });

  // Poll response
  socket.on('poll_response', ({ sessionId, pollId, userId, option }) => {
    pool.query('INSERT IGNORE INTO poll_responses (poll_id, learner_id, selected_option) VALUES (?, ?, ?)', [pollId, userId, option]);
    io.to(`session_${sessionId}`).emit('poll_update', { pollId, userId, option });
  });

  // Chat message
  socket.on('chat_message', ({ sessionId, userId, name, message }) => {
    io.to(`session_${sessionId}`).emit('new_chat', { userId, name, message, timestamp: new Date() });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const { sessionId, userId, role, name } = socket.data || {};
    if (sessionId && role === 'learner') {
      io.to(`session_${sessionId}`).emit('learner_left', { userId, name });
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`🚀 PACE Classroom Server running on port ${PORT}`));
});
