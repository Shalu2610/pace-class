const { pool } = require('../config/db');


// @GET /api/sessions
exports.getSessions = async (req, res) => {
  try {
    const { role, id } = req.user;
    let query, params = [];

    if (role === 'admin') {
      query = `SELECT s.*, u.name as trainer_name, 
        (SELECT COUNT(*) FROM enrollments WHERE session_id = s.id) as enrolled_count
        FROM sessions s JOIN users u ON s.trainer_id = u.id ORDER BY s.scheduled_at DESC`;
    } else if (role === 'trainer') {
      query = `SELECT s.*, 
        (SELECT COUNT(*) FROM enrollments WHERE session_id = s.id) as enrolled_count
        FROM sessions s WHERE s.trainer_id = ? ORDER BY s.scheduled_at DESC`;
      params = [id];
    } else {
      query = `SELECT s.*, u.name as trainer_name, e.status as enrollment_status
        FROM sessions s 
        JOIN users u ON s.trainer_id = u.id
        JOIN enrollments e ON e.session_id = s.id AND e.learner_id = ?
        ORDER BY s.scheduled_at DESC`;
      params = [id];
    }

    const [sessions] = await pool.query(query, params);
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/sessions
exports.createSession = async (req, res) => {
  try {
    const { title, description, scheduled_at, duration_minutes, max_learners } = req.body;
    const session_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const [result] = await pool.query(
      `INSERT INTO sessions (title, description, trainer_id, scheduled_at, duration_minutes, session_code, max_learners)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, req.user.id, scheduled_at, duration_minutes || 60, session_code, max_learners || 100]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, session_code } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/sessions/:id
exports.getSession = async (req, res) => {
  try {
    const [sessions] = await pool.query(
      `SELECT s.*, u.name as trainer_name FROM sessions s JOIN users u ON s.trainer_id = u.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!sessions.length) return res.status(404).json({ success: false, message: 'Session not found' });

    const [content] = await pool.query('SELECT * FROM session_content WHERE session_id = ? ORDER BY order_index', [req.params.id]);
    const [quizzes] = await pool.query('SELECT * FROM quizzes WHERE session_id = ?', [req.params.id]);

    res.json({ success: true, data: { ...sessions[0], content, quizzes } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/sessions/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE sessions SET status = ? WHERE id = ? AND trainer_id = ?',
      [status, req.params.id, req.user.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/sessions/:id/enroll
exports.enrollLearner = async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO enrollments (session_id, learner_id) VALUES (?, ?)',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/sessions/:id/learners
exports.getEnrolledLearners = async (req, res) => {
  try {
    const [learners] = await pool.query(
      `SELECT u.id, u.name, u.email, u.department, e.enrolled_at, e.status,
        COALESCE(SUM(el.engagement_score), 0) as total_engagement
       FROM enrollments e
       JOIN users u ON e.learner_id = u.id
       LEFT JOIN engagement_logs el ON el.session_id = e.session_id AND el.learner_id = u.id
       WHERE e.session_id = ?
       GROUP BY u.id`,
      [req.params.id]
    );
    res.json({ success: true, data: learners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
