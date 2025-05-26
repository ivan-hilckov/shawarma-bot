import { createLogger } from '../logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<number, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private logger = createLogger('RateLimiter');

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Очищаем старые записи каждые 5 минут
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  isAllowed(userId: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry) {
      this.limits.set(userId, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (now > entry.resetTime) {
      // Окно сброшено
      entry.count = 1;
      entry.resetTime = now + this.windowMs;
      return true;
    }

    if (entry.count >= this.maxRequests) {
      this.logger.warn('Rate limit exceeded', {
        userId,
        count: entry.count,
        maxRequests: this.maxRequests,
      });
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(userId: number): number {
    const entry = this.limits.get(userId);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(userId: number): number {
    const entry = this.limits.get(userId);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.resetTime;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Rate limiter cleanup completed', { cleaned, remaining: this.limits.size });
    }
  }

  getStats(): { totalUsers: number; activeUsers: number } {
    const now = Date.now();
    let activeUsers = 0;

    for (const entry of this.limits.values()) {
      if (now <= entry.resetTime) {
        activeUsers++;
      }
    }

    return {
      totalUsers: this.limits.size,
      activeUsers,
    };
  }
}

export const rateLimiter = new RateLimiter();
