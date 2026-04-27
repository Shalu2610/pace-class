const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/progress/stats
 * @desc    Get current learner's overall progress stats
 * @access  Private (Learner)
 */
router.get('/stats', protect, authorize('learner'), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Quiz Performance
    const [quizStats] = await pool.query(
      `SELECT COUNT(*) as completed_quizzes, AVG(score) as avg_score 
       FROM quiz_submissions 
       WHERE learner_id = ?`,
      [userId]
    );

    // 2. Engagement Points
    const [engagementStats] = await pool.query(
      `SELECT SUM(points) as total_points 
       FROM engagement_logs 
       WHERE learner_id = ?`,
      [userId]
    );

    // 3. Enrolled Sessions
    const [sessionStats] = await pool.query(
      `SELECT COUNT(*) as enrolled_sessions 
       FROM session_enrollments 
       WHERE learner_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        completed_quizzes: quizStats[0].completed_quizzes || 0,
        avg_score: parseFloat(quizStats[0].avg_score || 0).toFixed(2),
        total_points: engagementStats[0].total_points || 0,
        enrolled_sessions: sessionStats[0].enrolled_sessions || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/progress/leaderboard
 * @desc    Get top learners based on engagement points
 * @access  Private
 */
router.get('/leaderboard', protect, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.name, SUM(el.points) as total_points
       FROM users u
       JOIN engagement_logs el ON u.id = el.learner_id
       WHERE u.role = 'learner'
       GROUP BY u.id
       ORDER BY total_points DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
