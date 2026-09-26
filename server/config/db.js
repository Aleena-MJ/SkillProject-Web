const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Ensure database directory exists
const dbPath = process.env.DB_PATH || './data/skills.db';
const fullDbPath = path.resolve(process.cwd(), dbPath);
const dbDir = path.dirname(fullDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(fullDbPath);

// Enable foreign key constraints and WAL mode for better concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      college TEXT DEFAULT '',
      major TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      proficiency TEXT DEFAULT 'Intermediate',
      availability TEXT DEFAULT 'Flexible',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      requester_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      preferred_time TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE,
      FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
    CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_teacher ON requests(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
  `);

  // Seed sample data if empty
  seedSampleData();
}

function seedSampleData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('🌱 Seeding initial college student profiles and skills...');

    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('student123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, college, major, bio, contact)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const alex = insertUser.run(
      'Alex Johnson',
      'alex@college.edu',
      demoPasswordHash,
      'School of Engineering',
      'Computer Science (Junior)',
      'Passionate about full-stack web development, Python, and open-source software.',
      'alex.johnson#1234 (Discord) / alex@college.edu'
    );

    const priya = insertUser.run(
      'Priya Sharma',
      'priya@college.edu',
      demoPasswordHash,
      'School of Design',
      'Digital Media & UX Design',
      'Figma addict and typography lover. Happy to help anyone create intuitive web and mobile app interfaces!',
      'priya_ux on Telegram'
    );

    const marcus = insertUser.run(
      'Marcus Chen',
      'marcus@college.edu',
      demoPasswordHash,
      'Department of Mathematics',
      'Applied Mathematics & Statistics',
      'Math tutor with 2+ years of experience helping students ace Calculus and Linear Algebra.',
      'marcus.chen@college.edu'
    );

    const sophia = insertUser.run(
      'Sophia Martinez',
      'sophia@college.edu',
      demoPasswordHash,
      'Faculty of Arts & Humanities',
      'Linguistics & Spanish Literature',
      'Native Spanish speaker. Love language exchanges and conversational practice!',
      'sophia.m@college.edu'
    );

    const insertSkill = db.prepare(`
      INSERT INTO skills (user_id, title, category, description, proficiency, availability)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertSkill.run(
      alex.lastInsertRowid,
      'Python & Algorithms for Beginners',
      'Programming',
      'I can teach Python fundamentals, data structures (lists, dicts, trees), and basic algorithmic problem solving. Great for CS101 students.',
      'Advanced',
      'Tue/Thu evenings, Remote or Campus Library'
    );

    insertSkill.run(
      alex.lastInsertRowid,
      'Git & GitHub Team Workflows',
      'Programming',
      'Learn branching, merge conflict resolution, pull requests, and Git best practices for your group projects.',
      'Intermediate',
      'Saturday afternoons'
    );

    insertSkill.run(
      priya.lastInsertRowid,
      'UI/UX Design in Figma from Scratch',
      'Design',
      'Master Figma components, auto-layout, interactive prototypes, and modern design principles. Perfect for hackathons or portfolio projects.',
      'Advanced',
      'Weekends (Online / Zoom)'
    );

    insertSkill.run(
      marcus.lastInsertRowid,
      'Calculus II & Differential Equations',
      'Mathematics',
      'Clear, intuitive explanations for integration techniques, series convergence, and differential equations. We will solve practice problems together.',
      'Expert',
      'Mon/Wed 4-6 PM in Science Hall'
    );

    insertSkill.run(
      sophia.lastInsertRowid,
      'Conversational Spanish & Pronunciation',
      'Languages',
      'Friendly conversational practice for intermediate Spanish learners wanting to improve fluency, confidence, and natural idioms.',
      'Expert',
      'Friday afternoons at Campus Cafe'
    );

    insertSkill.run(
      marcus.lastInsertRowid,
      'Intro to Data Analysis with Excel & SQL',
      'Business',
      'Learn pivot tables, VLOOKUP/XLOOKUP, and basic SQL queries to analyze datasets for business case studies.',
      'Intermediate',
      'Flexible / On Demand'
    );

    console.log('✅ Demo data seeded successfully. (Demo credentials: alex@college.edu / student123)');
  }
}

initDatabase();

module.exports = db;
