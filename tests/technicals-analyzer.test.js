import { describe, it, expect } from 'vitest';
import TechnicalsAnalyzer from '../frontend/js/analyzers/technicals.js';

const indicators = (overrides = {}) => ({
  rsi14: 55,
  macd: 1.2,
  stochastic: { '%K': 60, '%D': 58 },
  supertrend: { value: 150, trend: 'up' },
  bollingerBands: { upper: 160, middle: 150, lower: 140 },
  sma20: 148,
  sma50: 145,
  sma200: 140,
  atr14: 3.5,
  ...overrides
});

describe('TechnicalsAnalyzer.analyze', () => {
  it('returns null for missing indicators', () => {
    expect(TechnicalsAnalyzer.analyze({ indicators: null })).toBeNull();
  });

  it('extracts rsi, macd, stochastic K/D, supertrend, SMAs, bollinger, atr', () => {
    const r = TechnicalsAnalyzer.analyze({ indicators: indicators() });
    expect(r.rsi14).toBe(55);
    expect(r.macd).toBe(1.2);
    expect(r.stochastic_k).toBe(60);
    expect(r.stochastic_d).toBe(58);
    expect(r.supertrend_value).toBe(150);
    expect(r.supertrend_trend).toBe('up');
    expect(r.sma20).toBe(148);
    expect(r.sma50).toBe(145);
    expect(r.sma200).toBe(140);
    expect(r.bollinger_upper).toBe(160);
    expect(r.bollinger_middle).toBe(150);
    expect(r.bollinger_lower).toBe(140);
    expect(r.atr14).toBe(3.5);
  });

  it('nulls missing nested fields instead of throwing', () => {
    const r = TechnicalsAnalyzer.analyze({ indicators: { rsi14: 70 } });
    expect(r.rsi14).toBe(70);
    expect(r.stochastic_k).toBeNull();
    expect(r.supertrend_trend).toBeNull();
    expect(r.bollinger_upper).toBeNull();
  });

  it('computes ATH and pct_below_ath when both fiftyTwoWeekHigh and currentPrice are provided', () => {
    const r = TechnicalsAnalyzer.analyze({
      indicators: indicators(),
      fiftyTwoWeekHigh: 200,
      currentPrice: 150
    });
    expect(r.ath).toBe(200);
    expect(r.pct_below_ath).toBeCloseTo(25, 5); // (200 - 150) / 200 * 100
  });

  it('leaves ath and pct_below_ath null when 52wk high is zero or missing', () => {
    const r1 = TechnicalsAnalyzer.analyze({ indicators: indicators(), fiftyTwoWeekHigh: 0, currentPrice: 150 });
    expect(r1.ath).toBeNull();
    expect(r1.pct_below_ath).toBeNull();

    const r2 = TechnicalsAnalyzer.analyze({ indicators: indicators() });
    expect(r2.ath).toBeNull();
    expect(r2.pct_below_ath).toBeNull();
  });

  it('handles a stock at its all-time high (pct_below_ath = 0)', () => {
    const r = TechnicalsAnalyzer.analyze({
      indicators: indicators(),
      fiftyTwoWeekHigh: 200,
      currentPrice: 200
    });
    expect(r.pct_below_ath).toBeCloseTo(0, 5);
  });
});
