const { pool } = require('../config/db');

// @POST /api/quizzes
exports.createQuiz = async (req, res) => {
  try {
    const { session_id, title, questions, time_limit_seconds, trigger_after_content_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO quizzes (session_id, title, time_limit_seconds, trigger_after_content_id) VALUES (?, ?, ?, ?)',
      [session_id, title, time_limit_seconds || 60, trigger_after_content_id || null]
    );
    const quizId = result.insertId;

    if (questions && questions.length) {
      const qValues = questions.map(q => [quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.points || 10]);
      await pool.query(
        'INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points) VALUES ?',
        [qValues]
      );
    }
    res.status(201).json({ success: true, data: { id: quizId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/quizzes/:id
exports.getQuiz = async (req, res) => {
  try {
    const [quiz] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
    if (!quiz.length) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const [questions] = await pool.query(
      'SELECT id, question_text, option_a, option_b, option_c, option_d, points FROM quiz_questions WHERE quiz_id = ?',
      [req.params.id]
    );
    res.json({ success: true, data: { ...quiz[0], questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/quizzes/:id/submit
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{question_id, selected_option, response_time_seconds}]
    const learnerId = req.user.id;
    const quizId = req.params.id;

    const [questions] = await pool.query(
      'SELECT id, correct_option, points FROM quiz_questions WHERE quiz_id = ?', [quizId]
    );

    let totalScore = 0;
    const responses = answers.map(ans => {
      const question = questions.find(q => q.id === ans.question_id);
      const isCorrect = question && question.correct_option === ans.selected_option;
      const points = isCorrect ? question.points : 0;
      totalScore += points;
      return [quizId, ans.question_id, learnerId, ans.selected_option, isCorrect, points, ans.response_time_seconds || null];
    });

    await pool.query(
      'INSERT INTO quiz_responses (quiz_id, question_id, learner_id, selected_option, is_correct, points_earned, response_time_seconds) VALUES ?',
      [responses]
    );

    // Log engagement
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const engagementScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const [quiz] = await pool.query('SELECT session_id FROM quizzes WHERE id = ?', [quizId]);
    await pool.query(
      'INSERT INTO engagement_logs (session_id, learner_id, event_type, event_data, engagement_score) VALUES (?, ?, ?, ?, ?)',
      [quiz[0].session_id, learnerId, 'quiz_answer', JSON.stringify({ quiz_id: quizId, score: totalScore }), engagementScore]
    );

    res.json({ success: true, data: { total_score: totalScore, max_score: maxScore, percentage: engagementScore.toFixed(1) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/quizzes/:id/results
exports.getResults = async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT u.name, u.email, SUM(qr.points_earned) as score,
        COUNT(qr.id) as answered, SUM(qr.is_correct) as correct
       FROM quiz_responses qr
       JOIN users u ON qr.learner_id = u.id
       WHERE qr.quiz_id = ?
       GROUP BY u.id`,
      [req.params.id]
    );
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
