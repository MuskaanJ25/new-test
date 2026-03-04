import crypto from 'crypto'

// Profanity and content moderation
export const PROFANITY_LIST = [
  'badword1', 'badword2', 'badword3', 'badword4', 'badword5'
]

// Patterns to automatically flag
const SUSPICIOUS_PATTERNS = [
  /http[s]?:\/\/[^\s]+/gi,  // URLs/links
  /\bviagra\b/gi,
  /\bcasino\b/gi,
  /\bporn\b/gi,
  /\bgambling\b/gi,
  /<script[^>]*>.*?<\/script>/gsi  // Script tags
]

// Settings
export const MODERATION_SETTINGS = {
  maxCommentLength: 1000,
  minCommentLength: 3,
  autoRejectOnProfanity: false,  // If true, auto-reject; if false, mark as pending
  autoRejectOnLinks: true,
  rateLimitPerHour: 5,
  rateLimitPerDay: 20
}

// In-memory rate tracking (in production, use Redis or database)
const rateTracker = new Map()

export function hashIp(ip) {
  return crypto.createHash('sha256')
    .update(ip + process.env.RATE_LIMIT_SALT || 'salt')
    .digest('hex')
    .substring(0, 16)
}

export function checkRateLimit(ipHash) {
  const now = Date.now()
  const hourAgo = now - (60 * 60 * 1000)
  const dayAgo = now - (24 * 60 * 60 * 1000)

  if (!rateTracker.has(ipHash)) {
    rateTracker.set(ipHash, { hourly: [], daily: [] })
  }

  const tracker = rateTracker.get(ipHash)
  
  // Clean old entries
  tracker.hourly = tracker.hourly.filter(t => t > hourAgo)
  tracker.daily = tracker.daily.filter(t => t > dayAgo)

  // Check limits
  if (tracker.hourly.length >= MODERATION_SETTINGS.rateLimitPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${MODERATION_SETTINGS.rateLimitPerHour} comments/hour)`
    }
  }

  if (tracker.daily.length >= MODERATION_SETTINGS.rateLimitPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${MODERATION_SETTINGS.rateLimitPerDay} comments/day)`
    }
  }

  // Add new timestamp
  tracker.hourly.push(now)
  tracker.daily.push(now)

  return { allowed: true }
}

export function moderateComment(displayName, body) {
  const flags = []

  // Check length
  if (!body || body.length < MODERATION_SETTINGS.minCommentLength) {
    return {
      status: 'rejected',
      flag_reason: 'Comment too short'
    }
  }

  if (body.length > MODERATION_SETTINGS.maxCommentLength) {
    return {
      status: 'rejected',
      flag_reason: 'Comment too long'
    }
  }

  // Check for profanity
  const lowerBody = body.toLowerCase()
  const lowerDisplayName = (displayName || '').toLowerCase()
  const hasProfanity = PROFANITY_LIST.some(word => 
    lowerBody.includes(word) || lowerDisplayName.includes(word)
  )

  if (hasProfanity) {
    if (MODERATION_SETTINGS.autoRejectOnProfanity) {
      return {
        status: 'rejected',
        flag_reason: 'Contains inappropriate language'
      }
    }
    flags.push('Contains profanity')
  }

  // Check for suspicious patterns (links, spam, etc.)
  const hasSuspiciousPattern = SUSPICIOUS_PATTERNS.some(pattern => 
    pattern.test(body) || pattern.test(displayName || '')
  )

  if (hasSuspiciousPattern) {
    if (MODERATION_SETTINGS.autoRejectOnLinks) {
      return {
        status: 'rejected',
        flag_reason: 'Contains links or suspicious content'
      }
    }
    flags.push('Contains links')
  }

  // Check for excessive repetition (spam detection)
  const repeatedChars = /(.)\1{4,}/g
  if (repeatedChars.test(body)) {
    flags.push('Excessive repetition')
  }

  // Check for all caps (shouting)
  if (body.length > 10 && body === body.toUpperCase()) {
    flags.push('All caps')
  }

  // Determine status
  if (flags.length > 0) {
    return {
      status: 'pending',
      flag_reason: flags.join('; ')
    }
  }

  // Clean comment - auto-approve
  return {
    status: 'approved',
    flag_reason: null
  }
}

// Clean up old rate tracker entries periodically
setInterval(() => {
  const now = Date.now()
  const dayAgo = now - (24 * 60 * 60 * 1000)
  
  for (const [key, tracker] of rateTracker.entries()) {
    tracker.daily = tracker.daily.filter(t => t > dayAgo)
    tracker.hourly = tracker.hourly.filter(t => t > now - (60 * 60 * 1000))
    
    // Remove empty entries
    if (tracker.daily.length === 0 && tracker.hourly.length === 0) {
      rateTracker.delete(key)
    }
  }
}, 60 * 60 * 1000) // Run every hour