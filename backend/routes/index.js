const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const session = require('../controllers/sessionController');
const quiz = require('../controllers/quizController');
const engagement = require('../controllers/engagementController');
const report = require('../controllers/reportController');
const admin = require('../controllers/adminController');
const progress = require('./progress');
const { pool } = require('../config/db');

// ── Auth ──────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.getMe);
router.put('/auth/profile', protect, auth.updateProfile);

// ── Sessions ──────────────────────────────────────
router.get('/sessions', protect, session.getSessions);
router.post('/sessions', protect, authorize('trainer', 'admin'), session.createSession);

// IMPORTANT: These must be BEFORE /sessions/:id
router.get('/sessions/all', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.name as trainer_name 
       FROM sessions s 
       JOIN users u ON s.trainer_id = u.id
       WHERE s.status IN ('upcoming','live') 
       ORDER BY s.scheduled_at ASC`
    );
    res.json({ success: true, data: rows });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sessions/content', protect, authorize('trainer','admin'), async (req, res) => {
  try {
    const { session_id, title, content_type, content_text, content_url, difficulty, order_index } = req.body;
    await pool.query(
      'INSERT INTO session_content (session_id, title, content_type, content_text, content_url, difficulty, order_index) VALUES (?,?,?,?,?,?,?)',
      [session_id, title, content_type, content_text, content_url, difficulty, order_index]
    );
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/sessions/:id', protect, session.getSession);
router.put('/sessions/:id/status', protect, authorize('trainer', 'admin'), session.updateStatus);
router.post('/sessions/:id/enroll', protect, authorize('learner'), session.enrollLearner);
router.get('/sessions/:id/learners', protect, authorize('trainer', 'admin'), session.getEnrolledLearners);

// ── Quizzes ───────────────────────────────────────
router.post('/quizzes', protect, authorize('trainer', 'admin'), quiz.createQuiz);
router.get('/quizzes/:id', protect, quiz.getQuiz);
router.post('/quizzes/:id/submit', protect, authorize('learner'), quiz.submitQuiz);
router.get('/quizzes/:id/results', protect, authorize('trainer', 'admin'), quiz.getResults);

// ── Engagement ────────────────────────────────────
router.post('/engagement/log', protect, engagement.logEvent);
router.get('/engagement/session/:id', protect, authorize('trainer', 'admin'), engagement.getSessionEngagement);
router.get('/engagement/learner/me', protect, engagement.getMyEngagement);

// ── Admin ─────────────────────────────────────────
router.get('/admin/users', protect, authorize('admin'), admin.getAllUsers);
router.put('/admin/users/:id/toggle', protect, authorize('admin'), admin.toggleUser);
router.delete('/admin/users/:id', protect, authorize('admin'), admin.deleteUser);

// ── Reports ───────────────────────────────────────
router.post('/reports/generate/:sessionId', protect, authorize('trainer', 'admin'), report.generateReport);
router.get('/reports/download/:filename', protect, report.downloadReport);

// ── Progress ──────────────────────────────────────
router.use('/progress', progress);

// ── Notifications ─────────────────────────────────
router.get('/notifications', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Session Search ────────────────────────────────
router.get('/sessions/search', protect, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      `SELECT s.*, u.name as trainer_name FROM sessions s
       JOIN users u ON s.trainer_id = u.id
       WHERE s.title LIKE ? OR s.description LIKE ? OR u.name LIKE ?
       ORDER BY s.scheduled_at DESC LIMIT 20`,
      [q, q, q]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;