import { describe, it, expect } from 'vitest';
import Currency from '../frontend/js/currency.js';

describe('Currency.formatUSD', () => {
  it('formats positive numbers with 2 decimals and $ prefix', () => {
    expect(Currency.formatUSD(1234.56)).toBe('$1,234.56');
  });

  it('formats negative numbers', () => {
    expect(Currency.formatUSD(-42.5)).toBe('-$42.50');
  });

  it('returns -- for null, undefined, NaN, and non-numbers', () => {
    expect(Currency.formatUSD(null)).toBe('--');
    expect(Currency.formatUSD(undefined)).toBe('--');
    expect(Currency.formatUSD(NaN)).toBe('--');
    expect(Currency.formatUSD('123')).toBe('--');
  });
});

describe('Currency.formatARS', () => {
  it('formats with no decimals', () => {
    expect(Currency.formatARS(1234567)).toContain('1.234.567');
  });

  it('returns -- for invalid input', () => {
    expect(Currency.formatARS(null)).toBe('--');
  });
});

describe('Currency.formatPct', () => {
  it('adds + sign for positive and two decimals', () => {
    expect(Currency.formatPct(12.3456)).toBe('+12.35%');
  });

  it('uses negative sign for negative values', () => {
    expect(Currency.formatPct(-5)).toBe('-5.00%');
  });

  it('abbreviates values >= 1000 with K suffix and one decimal', () => {
    expect(Currency.formatPct(1234)).toBe('+1.2K%');
  });

  it('abbreviates values >= 10000 with K suffix and no decimals', () => {
    expect(Currency.formatPct(3326)).toBe('+3.3K%');
    expect(Currency.formatPct(10500)).toBe('+11K%');
  });

  it('returns -- for invalid input', () => {
    expect(Currency.formatPct(null)).toBe('--');
  });
});

describe('Currency.formatNum', () => {
  it('defaults to 2 decimals', () => {
    expect(Currency.formatNum(3.14159)).toBe('3.14');
  });

  it('honors custom decimals', () => {
    expect(Currency.formatNum(3.14159, 4)).toBe('3.1416');
  });

  it('returns -- for invalid', () => {
    expect(Currency.formatNum(null)).toBe('--');
  });
});

describe('Currency.pctClass', () => {
  it('returns text-gain for positive, text-loss for negative', () => {
    expect(Currency.pctClass(1)).toBe('text-gain');
    expect(Currency.pctClass(-1)).toBe('text-loss');
  });

  it('returns text-white for exactly 0', () => {
    expect(Currency.pctClass(0)).toBe('text-white');
  });

  it('returns text-muted for null / non-number', () => {
    expect(Currency.pctClass(null)).toBe('text-muted');
    expect(Currency.pctClass('abc')).toBe('text-muted');
  });
});

describe('Currency.thresholdClass', () => {
  it('maps green/yellow/red to Tailwind color classes', () => {
    expect(Currency.thresholdClass('green')).toBe('text-gain');
    expect(Currency.thresholdClass('yellow')).toBe('text-caution');
    expect(Currency.thresholdClass('red')).toBe('text-loss');
  });

  it('returns empty string for missing/unknown threshold', () => {
    expect(Currency.thresholdClass(null)).toBe('');
    expect(Currency.thresholdClass('purple')).toBe('');
  });
});

describe('Currency.pctArrow', () => {
  it('uses ▲ for positive, ▼ for negative, empty slot otherwise', () => {
    expect(Currency.pctArrow(5)).toContain('▲');
    expect(Currency.pctArrow(-5)).toContain('▼');
    expect(Currency.pctArrow(0)).not.toContain('▲');
    expect(Currency.pctArrow(0)).not.toContain('▼');
    expect(Currency.pctArrow(null)).not.toContain('▲');
  });
});

describe('Currency.thresholdArrow', () => {
  it('uses ▲ only for green, ▼ only for red, empty slot otherwise', () => {
    expect(Currency.thresholdArrow('green')).toContain('▲');
    expect(Currency.thresholdArrow('red')).toContain('▼');
    expect(Currency.thresholdArrow('yellow')).not.toContain('▲');
    expect(Currency.thresholdArrow(null)).not.toContain('▲');
  });
});
