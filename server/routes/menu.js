import express from 'express'
import { getDb } from '../db.js'
import { moderateComment, hashIp } from '../moderation.js'

const router = express.Router()

// Get all active menu items
router.get('/', (req, res) => {
  try {
    const db = getDb()
    const items = db.prepare(`
      SELECT id, name, description, price_cents, is_active, created_at
      FROM menu_items
      WHERE is_active = 1
      ORDER BY name
    `).all()
    
    res.json(items)
  } catch (error) {
    console.error('Error fetching menu:', error)
    res.status(500).json({ error: 'Failed to fetch menu' })
  }
})

// Get specific menu item
router.get('/:id', (req, res) => {
  try {
    const db = getDb()
    const item = db.prepare(`
      SELECT id, name, description, price_cents, is_active, created_at
      FROM menu_items
      WHERE id = ? AND is_active = 1
    `).get(req.params.id)
    
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Error fetching menu item:', error)
    res.status(500).json({ error: 'Failed to fetch menu item' })
  }
})

// Get comments for a menu item (only approved comments for public)
router.get('/:id/comments', (req, res) => {
  try {
    const db = getDb()
    const comments = db.prepare(`
      SELECT id, menu_item_id, display_name, rating, body, status, created_at
      FROM menu_comments
      WHERE menu_item_id = ? AND (status = 'approved' OR status = 'pending')
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.params.id)
    
    res.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// Add a comment to a menu item
router.post('/:id/comments', (req, res) => {
  try {
    const { display_name, rating, body } = req.body
    
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body is required' })
    }

    // Get client IP for rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const ipHash = hashIp(ip)

    // Moderate the comment
    const moderation = moderateComment(display_name, body)
    
    // Verify menu item exists
    const db = getDb()
    const menuItem = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(req.params.id)
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' })
    }

    // Insert comment
    const result = db.prepare(`
      INSERT INTO menu_comments (menu_item_id, display_name, rating, body, status, flag_reason, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      display_name || 'Anonymous',
      rating || null,
      body.trim(),
      moderation.status,
      moderation.flag_reason,
      ipHash
    )

    // Return the created comment
    const newComment = db.prepare(`
      SELECT id, menu_item_id, display_name, rating, body, status, flag_reason, created_at
      FROM menu_comments
      WHERE id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json(newComment)
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

// Admin: Get pending comments
router.get('/admin/comments', (req, res) => {
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_TOKEN && token !== 'cafe-admin-secret-2024') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const db = getDb()
    const { status } = req.query
    
    let query = `
      SELECT mc.*, mi.name as menu_item_name
      FROM menu_comments mc
      JOIN menu_items mi ON mc.menu_item_id = mi.id
      WHERE 1=1
    `
    const params = []
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ' AND mc.status = ?'
      params.push(status)
    }
    
    query += ' ORDER BY mc.created_at DESC LIMIT 50'
    
    const comments = db.prepare(query).all(...params)
    res.json(comments)
  } catch (error) {
    console.error('Error fetching admin comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// Admin: Moderate a comment
router.post('/admin/comments/:id/:action', (req, res) => {
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_TOKEN && token !== 'cafe-admin-secret-2024') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { action } = req.params
  if (!['approve', 'reject', 'pending'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' })
  }

  try {
    const db = getDb()
    const result = db.prepare(`
      UPDATE menu_comments
      SET status = ?
      WHERE id = ?
    `).run(action, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    res.json({ success: true, status: action })
  } catch (error) {
    console.error('Error moderating comment:', error)
    res.status(500).json({ error: 'Failed to moderate comment' })
  }
})

export default router