import { describe, it, expect } from 'vitest';
import FundamentalsAnalyzer from '../frontend/js/analyzers/fundamentals.js';

const quote = (overrides = {}) => ({
  regularMarketPrice: 150,
  trailingEps: 10,       // → P/E = 15
  forwardEps: 12,        // → forward_pe = 12.5
  priceToBook: 5,
  returnOnEquity: 0.2,   // → 20%
  profitMargins: 0.15,   // → 15%
  operatingMargins: 0.18,
  dividendYield: 0.02,   // → 2%
  earningsGrowth: 0.1,   // → 10%
  debtToEquity: 80,      // finance-query sends this as percent*100 → 0.8 ratio
  sector: 'Technology',
  industry: 'Software',
  fiftyTwoWeekHigh: 200,
  fiftyTwoWeekLow: 100,
  marketCap: 1_000_000_000,
  ...overrides
});

describe('FundamentalsAnalyzer.analyze', () => {
  it('returns null for a missing quote', () => {
    expect(FundamentalsAnalyzer.analyze(null)).toBeNull();
  });

  it('computes pe, forward_pe, roe, profit_margin, and debt_to_equity correctly', () => {
    const r = FundamentalsAnalyzer.analyze(quote());
    expect(r.pe).toBe(15);
    expect(r.forward_pe).toBe(12.5);
    expect(r.roe).toBeCloseTo(20, 5);
    expect(r.profit_margin).toBeCloseTo(15, 5);
    expect(r.debt_to_equity).toBeCloseTo(0.8, 5);
    expect(r.dividend_yield).toBeCloseTo(2, 5);
    expect(r.eps_growth).toBeCloseTo(10, 5);
  });

  it('returns null for pe when eps is zero (safeDiv)', () => {
    const r = FundamentalsAnalyzer.analyze(quote({ trailingEps: 0 }));
    expect(r.pe).toBeNull();
  });

  it('passes through priceToBook, sector, industry, current_price, market_cap', () => {
    const r = FundamentalsAnalyzer.analyze(quote());
    expect(r.pb).toBe(5);
    expect(r.sector).toBe('Technology');
    expect(r.industry).toBe('Software');
    expect(r.current_price).toBe(150);
    expect(r.fifty_two_week_high).toBe(200);
    expect(r.market_cap).toBe(1_000_000_000);
  });

  describe('sector-relative thresholds (Technology)', () => {
    // Technology benchmarks: pe 28, pb 6, roe 20, debt_to_equity 0.6, profit_margin 22
    it('flags pe=15 as green for Tech (below benchmark 28)', () => {
      const r = FundamentalsAnalyzer.analyze(quote({ trailingEps: 10 })); // pe=15
      expect(r.thresholds.pe).toBe('green');
    });

    it('flags pe=40 as yellow for Tech (above 28, within 28*1.5=42)', () => {
      const r = FundamentalsAnalyzer.analyze(quote({ trailingEps: 3.75 })); // pe=40
      expect(r.thresholds.pe).toBe('yellow');
    });

    it('flags pe=50 as red for Tech (above 42)', () => {
      const r = FundamentalsAnalyzer.analyze(quote({ trailingEps: 3 })); // pe=50
      expect(r.thresholds.pe).toBe('red');
    });

    it('flags roe=20 as green for Tech (meets benchmark 20)', () => {
      const r = FundamentalsAnalyzer.analyze(quote({ returnOnEquity: 0.2 }));
      expect(r.thresholds.roe).toBe('green');
    });

    it('flags roe=12 as yellow (above 20*0.5=10) and roe=8 as red', () => {
      expect(FundamentalsAnalyzer.analyze(quote({ returnOnEquity: 0.12 })).thresholds.roe).toBe('yellow');
      expect(FundamentalsAnalyzer.analyze(quote({ returnOnEquity: 0.08 })).thresholds.roe).toBe('red');
    });
  });

  describe('absolute thresholds (no sector match)', () => {
    it('uses absolute pe thresholds when sector is unknown', () => {
      // Unknown sector → ABSOLUTE_THRESHOLDS.pe: green if <15, yellow if <=25, else red
      const r = FundamentalsAnalyzer.analyze(quote({ sector: 'Nonexistent', trailingEps: 15 })); // pe=10
      expect(r.thresholds.pe).toBe('green');
      expect(FundamentalsAnalyzer.analyze(quote({ sector: 'Nonexistent', trailingEps: 7.5 })).thresholds.pe).toBe('yellow'); // pe=20
      expect(FundamentalsAnalyzer.analyze(quote({ sector: 'Nonexistent', trailingEps: 5 })).thresholds.pe).toBe('red');      // pe=30
    });
  });

  describe('P/E vs Forward P/E share the same benchmark key', () => {
    it('uses the sector pe benchmark for forward_pe via BENCHMARK_KEYS', () => {
      // Tech pe benchmark = 28; forward_pe of 15 → green
      const r = FundamentalsAnalyzer.analyze(quote({ forwardEps: 10 })); // forward_pe = 15
      expect(r.thresholds.forward_pe).toBe('green');
    });
  });
});
