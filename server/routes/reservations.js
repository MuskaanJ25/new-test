import express from 'express'
import { getDb } from '../db.js'

const router = express.Router()

// Constants for availability calculation
const SLOT_DURATION_MINUTES = 90 // 90-minute time slots
const MAX_SEATS = 30
const MAX_PARTY_SIZE = 20

// Helper function to calculate time slot bounds
function getTimeSlotBounds(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const slotStartMinutes = Math.floor(minutes / 15) * 15 // Round down to nearest 15 min
  const slotStart = `${String(hours).padStart(2, '0')}:${String(slotStartMinutes).padStart(2, '0')}`
  
  // Calculate end time
  const totalMinutes = hours * 60 + slotStartMinutes + SLOT_DURATION_MINUTES
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  
  // Handle overflow to next day
  const slotEnd = endHours >= 24 ? '23:59' : `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  
  return { slotStart, slotEnd }
}

// Helper function to convert time string to minutes for comparison
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper function to convert minutes to time string
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// Check availability
router.get('/availability', (req, res) => {
  try {
    const { date, time, partySize } = req.query
    
    if (!date || !time || !partySize) {
      return res.status(400).json({ error: 'date, time, and partySize are required' })
    }

    const size = parseInt(partySize)
    if (size < 1 || size > MAX_PARTY_SIZE) {
      return res.status(400).json({ 
        error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` 
      })
    }

    const db = getDb()
    const { slotStart, slotEnd } = getTimeSlotBounds(time)
    
    // Get all reservations for this date
    const reservations = db.prepare(`
      SELECT party_size, time, status
      FROM reservations
      WHERE date = ? AND status IN ('confirmed', 'pending')
      ORDER BY time
    `).all(date)

    // Calculate occupied seats for the time slot
    let occupiedSeats = 0
    
    for (const res of reservations) {
      const resTimeMins = timeToMinutes(res.time)
      const slotStartMins = timeToMinutes(slotStart)
      const slotEndMins = timeToMinutes(slotEnd)
      
      // Check if reservation overlaps with our time slot
      // A reservation occupies a slot from its time to time + SLOT_DURATION_MINUTES
      const resSlotEndMins = resTimeMins + SLOT_DURATION_MINUTES
      
      // Overlap exists if:
      // - reservation starts before our slot ends AND
      // - reservation's slot ends after our slot starts
      if (resTimeMins < slotEndMins && resSlotEndMins > slotStartMins) {
        occupiedSeats += res.party_size
      }
    }

    const remainingSeats = MAX_SEATS - occupiedSeats
    const available = remainingSeats >= size

    // Generate suggestions if not available
    let suggestions = []
    if (!available) {
      const baseTime = timeToMinutes(time)
      const suggestionIntervals = [-60, -30, 30, 60, 90, 120] // minutes before/after
      
      for (const offset of suggestionIntervals) {
        const suggestedTime = baseTime + offset
        if (suggestedTime >= 7 * 60 && suggestedTime <= 21 * 60) { // Between 7 AM and 9 PM
          suggestions.push(minutesToTime(suggestedTime))
        }
      }
    }

    res.json({
      available,
      remainingSeats,
      occupiedSeats,
      maxSeats: MAX_SEATS,
      requiredSeats: size,
      slotStart,
      slotEnd,
      suggestions
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    res.status(500).json({ error: 'Failed to check availability' })
  }
})

// Create a reservation
router.post('/', (req, res) => {
  try {
    const { name, contact, party_size, date, time, notes } = req.body
    
    // Validation
    if (!name || !contact || !party_size || !date || !time) {
      return res.status(400).json({ 
        error: 'name, contact, party_size, date, and time are required' 
      })
    }

    const size = parseInt(party_size)
    if (size < 1 || size > MAX_PARTY_SIZE) {
      return res.status(400).json({ 
        error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` 
      })
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' })
    }

    // Check business hours
    const [hours, minutes] = time.split(':').map(Number)
    const timeMinutes = hours * 60 + minutes
    if (timeMinutes < 7 * 60 || timeMinutes > 21 * 60) {
      // Allow reservations up until 9 PM (last booking)
      return res.status(400).json({ 
        error: 'Reservation time must be between 7:00 AM and 9:00 PM' 
      })
    }

    // Check availability once more before confirming
    const db = getDb()
    const { slotStart, slotEnd } = getTimeSlotBounds(time)
    
    const reservations = db.prepare(`
      SELECT party_size, time
      FROM reservations
      WHERE date = ? AND status IN ('confirmed', 'pending')
    `).all(date)

    let occupiedSeats = 0
    for (const res of reservations) {
      const resTimeMins = timeToMinutes(res.time)
      const slotStartMins = timeToMinutes(slotStart)
      const slotEndMins = timeToMinutes(slotEnd)
      const resSlotEndMins = resTimeMins + SLOT_DURATION_MINUTES
      
      if (resTimeMins < slotEndMins && resSlotEndMins > slotStartMins) {
        occupiedSeats += res.party_size
      }
    }

    if (MAX_SEATS - occupiedSeats < size) {
      return res.status(409).json({ 
        error: 'No available tables for this time slot',
        available: false
      })
    }

    // Create reservation
    const result = db.prepare(`
      INSERT INTO reservations (name, contact, party_size, date, time, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(name.trim(), contact.trim(), size, date, time, notes ? notes.trim() : null)

    // Return the created reservation
    const newReservation = db.prepare(`
      SELECT id, name, contact, party_size, date, time, notes, status, created_at
      FROM reservations
      WHERE id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json(newReservation)
  } catch (error) {
    console.error('Error creating reservation:', error)
    res.status(500).json({ error: 'Failed to create reservation' })
  }
})

// Get reservations by date (admin endpoint)
router.get('/admin/by-date', (req, res) => {
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_TOKEN && token !== 'cafe-admin-secret-2024') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { date } = req.query
    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' })
    }

    const db = getDb()
    const reservations = db.prepare(`
      SELECT id, name, contact, party_size, date, time, notes, status, created_at
      FROM reservations
      WHERE date = ?
      ORDER BY time
    `).all(date)

    res.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

export default router