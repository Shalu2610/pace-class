const { pool } = require('../config/db');

// @POST /api/engagement/log
exports.logEvent = async (req, res) => {
  try {
    const { session_id, event_type, event_data } = req.body;
    const scoreMap = { content_view: 5, quiz_answer: 20, poll_answer: 15, question_asked: 10, idle: -5, reconnect: 2 };
    const score = scoreMap[event_type] || 0;

    await pool.query(
      'INSERT INTO engagement_logs (session_id, learner_id, event_type, event_data, engagement_score) VALUES (?, ?, ?, ?, ?)',
      [session_id, req.user.id, event_type, JSON.stringify(event_data || {}), score]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/engagement/session/:id
exports.getSessionEngagement = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT u.id, u.name,
        COALESCE(SUM(el.engagement_score), 0) as total_score,
        COUNT(el.id) as events_count,
        MAX(el.logged_at) as last_active
       FROM enrollments e
       JOIN users u ON e.learner_id = u.id
       LEFT JOIN engagement_logs el ON el.session_id = e.session_id AND el.learner_id = u.id
       WHERE e.session_id = ?
       GROUP BY u.id
       ORDER BY total_score DESC`,
      [req.params.id]
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/engagement/learner/me
exports.getMyEngagement = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT s.title, s.scheduled_at,
        COALESCE(SUM(el.engagement_score), 0) as score,
        COUNT(DISTINCT qr.quiz_id) as quizzes_taken,
        SUM(qr.points_earned) as quiz_points
       FROM enrollments e
       JOIN sessions s ON e.session_id = s.id
       LEFT JOIN engagement_logs el ON el.session_id = s.id AND el.learner_id = ?
       LEFT JOIN quiz_responses qr ON qr.learner_id = ?
       WHERE e.learner_id = ?
       GROUP BY s.id
       ORDER BY s.scheduled_at DESC`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
