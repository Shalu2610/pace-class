-- ============================================================
-- PACE CLASSROOM - COMPLETE MySQL DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS pace_classroom_new;
USE pace_classroom_new;

-- ─────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'trainer', 'learner') NOT NULL DEFAULT 'learner',
  department VARCHAR(100),
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- 2. SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  trainer_id INT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  duration_minutes INT DEFAULT 60,
  status ENUM('upcoming', 'live', 'completed', 'cancelled') DEFAULT 'upcoming',
  session_code VARCHAR(10) UNIQUE,
  max_learners INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 3. SESSION CONTENT
-- ─────────────────────────────────────────
CREATE TABLE session_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_type ENUM('slide', 'video', 'document', 'link') NOT NULL,
  content_url VARCHAR(500),
  content_text LONGTEXT,
  order_index INT DEFAULT 0,
  difficulty ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 4. ENROLLMENTS
-- ─────────────────────────────────────────
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  learner_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('enrolled', 'completed', 'dropped') DEFAULT 'enrolled',
  UNIQUE KEY unique_enrollment (session_id, learner_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 5. ATTENDANCE
-- ─────────────────────────────────────────
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  learner_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  duration_minutes INT DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 6. QUIZZES
-- ─────────────────────────────────────────
CREATE TABLE quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  trigger_after_content_id INT,
  time_limit_seconds INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (trigger_after_content_id) REFERENCES session_content(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- 7. QUIZ QUESTIONS
-- ─────────────────────────────────────────
CREATE TABLE quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255),
  option_d VARCHAR(255),
  correct_option ENUM('A','B','C','D') NOT NULL,
  points INT DEFAULT 10,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 8. QUIZ RESPONSES
-- ─────────────────────────────────────────
CREATE TABLE quiz_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_id INT NOT NULL,
  learner_id INT NOT NULL,
  selected_option ENUM('A','B','C','D'),
  is_correct BOOLEAN DEFAULT FALSE,
  points_earned INT DEFAULT 0,
  response_time_seconds INT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 9. POLLS
-- ─────────────────────────────────────────
CREATE TABLE polls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 10. POLL RESPONSES
-- ─────────────────────────────────────────
CREATE TABLE poll_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poll_id INT NOT NULL,
  learner_id INT NOT NULL,
  selected_option VARCHAR(255) NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_poll_response (poll_id, learner_id),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 11. ENGAGEMENT LOGS
-- ─────────────────────────────────────────
CREATE TABLE engagement_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  learner_id INT NOT NULL,
  event_type ENUM('content_view','quiz_answer','poll_answer','question_asked','idle','reconnect') NOT NULL,
  event_data JSON,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 12. QUESTIONS (Live Q&A)
-- ─────────────────────────────────────────
CREATE TABLE live_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  learner_id INT NOT NULL,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE,
  upvotes INT DEFAULT 0,
  asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 13. REPORTS
-- ─────────────────────────────────────────
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  generated_by INT NOT NULL,
  report_type ENUM('session_summary','learner_performance','engagement_analysis') DEFAULT 'session_summary',
  file_path VARCHAR(500),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 14. NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('session_reminder','quiz_result','report_ready','general') DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- SEED: Default Admin User
-- Password: admin123
-- ─────────────────────────────────────────
INSERT INTO users (name, email, password, role, department) VALUES
('Super Admin', 'admin@pace.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'IT');
