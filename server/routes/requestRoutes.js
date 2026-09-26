const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/requests - Send a learning request to a teacher
router.post('/', authenticateToken, (req, res) => {
  try {
    const { skill_id, message, preferred_time } = req.body;

    if (!skill_id) {
      return res.status(400).json({ success: false, message: 'Skill ID is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a message explaining what you would like to learn.' });
    }

    // Verify skill exists and find the teacher
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skill_id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'The requested skill does not exist.' });
    }

    // Cannot request to learn your own skill
    if (skill.user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a learning request for a skill you posted yourself.'
      });
    }

    // Check if an active/pending request already exists for this skill from this requester
    const existingPending = db.prepare(`
      SELECT id, status FROM requests 
      WHERE skill_id = ? AND requester_id = ? AND status = 'pending'
    `).get(skill_id, req.user.id);

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this skill. Please wait for the teacher to respond.'
      });
    }

    const insert = db.prepare(`
      INSERT INTO requests (skill_id, requester_id, teacher_id, message, preferred_time, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    const result = insert.run(
      skill_id,
      req.user.id,
      skill.user_id,
      message.trim(),
      preferred_time ? preferred_time.trim() : ''
    );

    return res.status(201).json({
      success: true,
      message: 'Learning request sent successfully! The teacher will be notified.',
      requestId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ success: false, message: 'Failed to send learning request.' });
  }
});

// GET /api/requests/received - Requests sent to current user (as teacher)
router.get('/received', authenticateToken, (req, res) => {
  try {
    const receivedRequests = db.prepare(`
      SELECT 
        r.id,
        r.skill_id,
        r.requester_id,
        r.teacher_id,
        r.message,
        r.preferred_time,
        r.status,
        r.created_at,
        r.updated_at,
        s.title AS skill_title,
        s.category AS skill_category,
        u.name AS requester_name,
        u.email AS requester_email,
        u.college AS requester_college,
        u.major AS requester_major,
        u.contact AS requester_contact
      FROM requests r
      JOIN skills s ON r.skill_id = s.id
      JOIN users u ON r.requester_id = u.id
      WHERE r.teacher_id = ?
      ORDER BY 
        CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
        r.created_at DESC
    `).all(req.user.id);

    return res.json({
      success: true,
      count: receivedRequests.length,
      requests: receivedRequests
    });
  } catch (error) {
    console.error('Error fetching received requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve received requests.' });
  }
});

// GET /api/requests/sent - Requests current user has sent (as learner)
router.get('/sent', authenticateToken, (req, res) => {
  try {
    const sentRequests = db.prepare(`
      SELECT 
        r.id,
        r.skill_id,
        r.requester_id,
        r.teacher_id,
        r.message,
        r.preferred_time,
        r.status,
        r.created_at,
        r.updated_at,
        s.title AS skill_title,
        s.category AS skill_category,
        u.name AS teacher_name,
        u.email AS teacher_email,
        u.college AS teacher_college,
        u.major AS teacher_major,
        u.contact AS teacher_contact
      FROM requests r
      JOIN skills s ON r.skill_id = s.id
      JOIN users u ON r.teacher_id = u.id
      WHERE r.requester_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    return res.json({
      success: true,
      count: sentRequests.length,
      requests: sentRequests
    });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve sent requests.' });
  }
});

// PUT /api/requests/:id - Accept or reject a request (Teacher only)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['accepted', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'accepted' or 'rejected'."
      });
    }

    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Only the teacher can update the status
    if (request.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this request.'
      });
    }

    db.prepare(`
      UPDATE requests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.params.id);

    return res.json({
      success: true,
      message: `Request successfully marked as ${status}.`
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update request status.' });
  }
});

// DELETE /api/requests/:id - Cancel sent request (Requester only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.requester_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel requests you have submitted.'
      });
    }

    db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);

    return res.json({
      success: true,
      message: 'Request cancelled successfully.'
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel request.' });
  }
});

module.exports = router;
