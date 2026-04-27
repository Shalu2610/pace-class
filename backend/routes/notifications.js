const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Notifications table is created inline here as a migration-style comment.
// Run this SQL once against your database:
//
// CREATE TABLE IF NOT EXISTS notifications (
//   id          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
//   user_id     INT UNSIGNED NOT NULL,
//   title       VARCHAR(200) NOT NULL,
//   body        TEXT,
//   type        ENUM('info','success','warning','alert') NOT NULL DEFAULT 'info',
//   is_read     BOOLEAN NOT NULL DEFAULT FALSE,
//   link        VARCHAR(255),
//   created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//   INDEX idx_user_read (user_id, is_read)
// );

// ── GET /api/notifications ── own notifications ───────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const [[{ unread }]] = await db.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ notifications: rows, unread });
  } catch (err) {
    // Table may not exist yet — return empty gracefully
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ notifications: [], unread: 0 });
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/notifications/:id/read ── mark one read ────────
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/notifications/read-all ── mark all read ────────
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Helper used by other routes to push a notification ────────
async function pushNotification(userId, { title, body, type = 'info', link = null }) {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, title, body, type, link) VALUES (?,?,?,?,?)',
      [userId, title, body || null, type, link]
    );
  } catch (_) { /* non-critical */ }
}

module.exports = { router, pushNotification };