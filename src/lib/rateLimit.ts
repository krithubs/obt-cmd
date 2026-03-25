/**
 * Simple in-memory rate limiter for API routes
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function checkRateLimit(
  ip: string, 
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60 * 60 * 1000 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `rate:${ip}`
  
  let entry = store.get(key)
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }
  
  entry.count++
  
  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
