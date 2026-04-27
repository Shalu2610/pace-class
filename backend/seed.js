require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./config/db');

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');

    // 1. Clear existing data (optional, but good for fresh seed)
    // Be careful with order due to foreign keys
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE notifications');
    await pool.query('TRUNCATE TABLE reports');
    await pool.query('TRUNCATE TABLE live_questions');
    await pool.query('TRUNCATE TABLE engagement_logs');
    await pool.query('TRUNCATE TABLE poll_responses');
    await pool.query('TRUNCATE TABLE polls');
    await pool.query('TRUNCATE TABLE quiz_responses');
    await pool.query('TRUNCATE TABLE quiz_questions');
    await pool.query('TRUNCATE TABLE quizzes');
    await pool.query('TRUNCATE TABLE attendance');
    await pool.query('TRUNCATE TABLE enrollments');
    await pool.query('TRUNCATE TABLE session_content');
    await pool.query('TRUNCATE TABLE sessions');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🧹 Database cleared.');

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      ['Admin User', 'admin@pace.com', hashedPassword, 'admin', 'IT'],
      ['Trainer John', 'john@pace.com', hashedPassword, 'trainer', 'Oceanography'],
      ['Learner Alice', 'alice@pace.com', hashedPassword, 'learner', 'Science'],
      ['Learner Bob', 'bob@pace.com', hashedPassword, 'learner', 'Engineering'],
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
        user
      );
    }
    console.log('👤 Users created.');

    // 3. Create a Session
    const [trainer] = await pool.query('SELECT id FROM users WHERE role = "trainer" LIMIT 1');
    const trainerId = trainer[0].id;

    const [sessionResult] = await pool.query(
      `INSERT INTO sessions (title, description, trainer_id, scheduled_at, duration_minutes, status, session_code) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      ['Introduction to Satellite Data', 'Learn the basics of PACE satellite data.', trainerId, 60, 'upcoming', 'PACE101']
    );
    const sessionId = sessionResult.insertId;
    console.log('📅 Session created.');

    // 4. Create Session Content
    await pool.query(
      'INSERT INTO session_content (session_id, title, content_type, content_url, order_index) VALUES (?, ?, ?, ?, ?)',
      [sessionId, 'Ocean Color Basics', 'slide', 'https://example.com/slides/1', 1]
    );
    console.log('text-snippet Content created.');

    // 5. Create a Quiz
    const [quizResult] = await pool.query(
      'INSERT INTO quizzes (session_id, title) VALUES (?, ?)',
      [sessionId, 'Satellite Knowledge Check']
    );
    const quizId = quizResult.insertId;

    await pool.query(
      `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quizId, 'What does PACE stand for?', 'Plankton, Aerosol, Cloud, ocean Ecosystem', 'Power and Climate Energy', 'Pacific Aerosol Cloud Experiment', 'None of the above', 'A']
    );
    console.log('🧪 Quiz and questions created.');

    // 6. Enroll Learners
    const [learners] = await pool.query('SELECT id FROM users WHERE role = "learner"');
    for (const learner of learners) {
      await pool.query('INSERT INTO enrollments (session_id, learner_id) VALUES (?, ?)', [sessionId, learner.id]);
    }
    console.log('🎓 Learners enrolled.');

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
