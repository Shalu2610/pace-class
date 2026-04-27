const { pool } = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @POST /api/reports/generate/:sessionId
exports.generateReport = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    const [sessions] = await pool.query(
      'SELECT s.*, u.name as trainer_name FROM sessions s JOIN users u ON s.trainer_id = u.id WHERE s.id = ?',
      [sessionId]
    );
    if (!sessions.length) return res.status(404).json({ success: false, message: 'Session not found' });
    const session = sessions[0];

    const [attendance] = await pool.query(
      'SELECT u.name, u.email, a.joined_at, a.duration_minutes FROM attendance a JOIN users u ON a.learner_id = u.id WHERE a.session_id = ?',
      [sessionId]
    );

    const [engagement] = await pool.query(
      `SELECT u.name, COALESCE(SUM(el.engagement_score),0) as score
       FROM enrollments e JOIN users u ON e.learner_id = u.id
       LEFT JOIN engagement_logs el ON el.session_id = e.session_id AND el.learner_id = u.id
       WHERE e.session_id = ? GROUP BY u.id ORDER BY score DESC`,
      [sessionId]
    );

    const [quizSummary] = await pool.query(
      `SELECT u.name, SUM(qr.points_earned) as total_points, SUM(qr.is_correct) as correct_answers
       FROM quiz_responses qr JOIN users u ON qr.learner_id = u.id
       JOIN quizzes q ON qr.quiz_id = q.id
       WHERE q.session_id = ? GROUP BY u.id`,
      [sessionId]
    );

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `report_session_${sessionId}_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../reports', filename);
    if (!fs.existsSync(path.join(__dirname, '../reports'))) fs.mkdirSync(path.join(__dirname, '../reports'));

    doc.pipe(fs.createWriteStream(filepath));

    // PDF Header
    doc.fontSize(22).fillColor('#1a73e8').text('PACE Classroom — Session Report', { align: 'center' });
    doc.moveDown().fontSize(14).fillColor('#333').text(`Session: ${session.title}`, { align: 'center' });
    doc.fontSize(11).fillColor('#666').text(`Trainer: ${session.trainer_name} | Date: ${new Date(session.scheduled_at).toLocaleString()}`, { align: 'center' });
    doc.moveDown().moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc').moveDown();

    // Attendance
    doc.fontSize(14).fillColor('#1a73e8').text('Attendance');
    doc.moveDown(0.5);
    attendance.forEach(a => {
      doc.fontSize(10).fillColor('#333').text(`• ${a.name} (${a.email}) — Joined: ${a.joined_at}`);
    });
    doc.moveDown();

    // Engagement
    doc.fontSize(14).fillColor('#1a73e8').text('Engagement Scores');
    doc.moveDown(0.5);
    engagement.forEach(e => {
      doc.fontSize(10).fillColor('#333').text(`• ${e.name}: ${parseFloat(e.score).toFixed(1)} pts`);
    });
    doc.moveDown();

    // Quiz Results
    doc.fontSize(14).fillColor('#1a73e8').text('Quiz Performance');
    doc.moveDown(0.5);
    quizSummary.forEach(q => {
      doc.fontSize(10).fillColor('#333').text(`• ${q.name}: ${q.total_points} pts | ${q.correct_answers} correct answers`);
    });

    doc.end();

    await pool.query(
      'INSERT INTO reports (session_id, generated_by, file_path) VALUES (?, ?, ?)',
      [sessionId, req.user.id, filename]
    );

    res.json({ success: true, message: 'Report generated', filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reports/download/:filename
exports.downloadReport = (req, res) => {
  const filepath = path.join(__dirname, '../reports', req.params.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ success: false, message: 'File not found' });
  res.download(filepath);
};
