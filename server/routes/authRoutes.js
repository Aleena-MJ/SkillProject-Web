const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Email validation helper
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, college, major, bio, contact } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password, college, major, bio, contact)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      normalizedEmail,
      hashedPassword,
      college ? college.trim() : '',
      major ? major.trim() : '',
      bio ? bio.trim() : '',
      contact ? contact.trim() : ''
    );

    const newUser = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: normalizedEmail,
      college: college ? college.trim() : '',
      major: major ? major.trim() : '',
      bio: bio ? bio.trim() : '',
      contact: contact ? contact.trim() : ''
    };

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      college: user.college,
      major: user.major,
      bio: user.bio,
      contact: user.contact,
      created_at: user.created_at
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
});

// GET /api/auth/me - Current user profile & statistics
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, college, major, bio, contact, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Get count metrics for user dashboard
    const skillsCount = db.prepare('SELECT COUNT(*) as count FROM skills WHERE user_id = ?').get(req.user.id).count;
    const receivedRequestsCount = db.prepare('SELECT COUNT(*) as count FROM requests WHERE teacher_id = ?').get(req.user.id).count;
    const sentRequestsCount = db.prepare('SELECT COUNT(*) as count FROM requests WHERE requester_id = ?').get(req.user.id).count;
    const acceptedCount = db.prepare(`
      SELECT COUNT(*) as count FROM requests 
      WHERE (teacher_id = ? OR requester_id = ?) AND status = 'accepted'
    `).get(req.user.id, req.user.id).count;

    return res.json({
      success: true,
      user,
      stats: {
        skillsCount,
        receivedRequestsCount,
        sentRequestsCount,
        acceptedCount
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile - Update current user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, college, major, bio, contact } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, college = ?, major = ?, bio = ?, contact = ?
      WHERE id = ?
    `).run(
      name.trim(),
      college !== undefined ? college.trim() : '',
      major !== undefined ? major.trim() : '',
      bio !== undefined ? bio.trim() : '',
      contact !== undefined ? contact.trim() : '',
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, name, email, college, major, bio, contact, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
