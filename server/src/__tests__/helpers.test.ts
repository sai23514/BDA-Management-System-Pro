import { describe, it, expect } from 'vitest';
import {
  calculateLeadScore,
  calculateWinProbability,
  buildPaginationResponse,
  getPaginationParams,
  generateLeadNumber,
  generateClientNumber,
  formatCurrency,
} from '../utils/helpers.js';
import { LEAD_STATUS, LEAD_PRIORITY, LEAD_SOURCES } from '../utils/constants.js';

describe('helpers: identifiers', () => {
  it('generates prefixed, unique lead numbers', () => {
    expect(generateLeadNumber()).toMatch(/^LEAD-/);
    expect(generateLeadNumber()).not.toBe(generateLeadNumber());
  });

  it('generates prefixed client numbers', () => {
    expect(generateClientNumber()).toMatch(/^CLT-/);
  });
});

describe('helpers: calculateLeadScore', () => {
  it('caps the score at 100', () => {
    const score = calculateLeadScore(
      { estimatedValue: 5_000_000, source: LEAD_SOURCES.REFERRAL },
      Array.from({ length: 12 }, () => ({ createdAt: new Date() })),
    );
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(0);
  });

  it('returns a low score for a small, unengaged lead', () => {
    const score = calculateLeadScore({ estimatedValue: 1000, source: LEAD_SOURCES.OTHER });
    expect(score).toBeLessThan(20);
  });
});

describe('helpers: calculateWinProbability', () => {
  it('stays within 0-100', () => {
    const probability = calculateWinProbability(
      { status: LEAD_STATUS.NEGOTIATION, score: 90, priority: LEAD_PRIORITY.HIGH },
      5,
    );
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(100);
  });

  it('penalises leads stuck in a stage for too long', () => {
    const fresh = calculateWinProbability(
      { status: LEAD_STATUS.PROPOSAL, score: 50, priority: LEAD_PRIORITY.MEDIUM },
      1,
    );
    const stale = calculateWinProbability(
      { status: LEAD_STATUS.PROPOSAL, score: 50, priority: LEAD_PRIORITY.MEDIUM },
      90,
    );
    expect(stale).toBeLessThan(fresh);
  });
});

describe('helpers: pagination', () => {
  it('computes skip from page and limit', () => {
    expect(getPaginationParams(3, 10)).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('builds pagination metadata', () => {
    const result = buildPaginationResponse([1, 2, 3], 25, 2, 10);
    expect(result.pagination).toMatchObject({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });
});

describe('helpers: formatCurrency', () => {
  it('formats amounts as INR by default', () => {
    expect(formatCurrency(1000)).toContain('1,000');
  });
});
