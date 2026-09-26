const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Available categories
const VALID_CATEGORIES = [
  'Programming',
  'Design',
  'Mathematics',
  'Languages',
  'Music',
  'Science',
  'Business',
  'Writing',
  'Other'
];

// GET /api/skills - Browse and search all skills
router.get('/', (req, res) => {
  try {
    const { search, category, proficiency } = req.query;

    let query = `
      SELECT 
        s.id, 
        s.user_id, 
        s.title, 
        s.category, 
        s.description, 
        s.proficiency, 
        s.availability, 
        s.created_at,
        u.name AS teacher_name,
        u.college AS teacher_college,
        u.major AS teacher_major,
        u.email AS teacher_email,
        u.contact AS teacher_contact
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (s.title LIKE ? OR s.description LIKE ? OR u.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'All' && category.trim()) {
      query += ` AND s.category = ?`;
      params.push(category.trim());
    }

    if (proficiency && proficiency !== 'All' && proficiency.trim()) {
      query += ` AND s.proficiency = ?`;
      params.push(proficiency.trim());
    }

    query += ` ORDER BY s.created_at DESC`;

    const skills = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve skills.' });
  }
});

// GET /api/skills/categories - Get category breakdown and counts
router.get('/categories', (req, res) => {
  try {
    const categoryCounts = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM skills
      GROUP BY category
    `).all();

    return res.json({
      success: true,
      categories: VALID_CATEGORIES,
      counts: categoryCounts
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
});

// GET /api/skills/my-skills - Get current logged-in user's skills
router.get('/my-skills', authenticateToken, (req, res) => {
  try {
    const mySkills = db.prepare(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM requests r WHERE r.skill_id = s.id) as request_count
      FROM skills s
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);

    return res.json({
      success: true,
      skills: mySkills
    });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your skills.' });
  }
});

// GET /api/skills/:id - Get specific skill details
router.get('/:id', (req, res) => {
  try {
    const skill = db.prepare(`
      SELECT 
        s.id, 
        s.user_id, 
        s.title, 
        s.category, 
        s.description, 
        s.proficiency, 
        s.availability, 
        s.created_at,
        u.name AS teacher_name,
        u.college AS teacher_college,
        u.major AS teacher_major,
        u.bio AS teacher_bio,
        u.email AS teacher_email,
        u.contact AS teacher_contact
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    return res.json({
      success: true,
      skill
    });
  } catch (error) {
    console.error('Error fetching skill details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve skill details.' });
  }
});

// POST /api/skills - Create a new skill
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, category, description, proficiency, availability } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Skill title is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const insert = db.prepare(`
      INSERT INTO skills (user_id, title, category, description, proficiency, availability)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      req.user.id,
      title.trim(),
      category.trim(),
      description.trim(),
      proficiency && proficiency.trim() ? proficiency.trim() : 'Intermediate',
      availability && availability.trim() ? availability.trim() : 'Flexible'
    );

    const newSkill = db.prepare(`
      SELECT s.*, u.name as teacher_name
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Skill posted successfully!',
      skill: newSkill
    });
  } catch (error) {
    console.error('Error creating skill:', error);
    return res.status(500).json({ success: false, message: 'Failed to post skill.' });
  }
});

// DELETE /api/skills/:id - Delete a skill
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    if (skill.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this skill.' });
    }

    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);

    return res.json({
      success: true,
      message: 'Skill deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete skill.' });
  }
});

module.exports = router;
