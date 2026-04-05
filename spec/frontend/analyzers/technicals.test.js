const test = require('node:test');
const assert = require('node:assert/strict');
const TechnicalsAnalyzer = require('../../../frontend/js/analyzers/technicals.js');

const indicators = {
  rsi14: 55.3,
  macd: 1.2,
  stochastic: { '%K': 72.1, '%D': 68.4 },
  supertrend: { value: 250.5, trend: 'UP' },
  sma20: 254.0,
  sma50: 258.0,
  sma200: 240.0,
  bollingerBands: { upper: 261.5, middle: 253.4, lower: 245.2 },
  atr14: 5.6
};

test('returns null when indicators are missing', () => {
  assert.equal(TechnicalsAnalyzer.analyze({ indicators: null }), null);
});

test('extracts all indicator fields', () => {
  const result = TechnicalsAnalyzer.analyze({ indicators });
  assert.equal(result.rsi14, 55.3);
  assert.equal(result.stochastic_k, 72.1);
  assert.equal(result.stochastic_d, 68.4);
  assert.equal(result.supertrend_value, 250.5);
  assert.equal(result.supertrend_trend, 'UP');
  assert.equal(result.sma20, 254.0);
  assert.equal(result.sma50, 258.0);
  assert.equal(result.sma200, 240.0);
  assert.equal(result.bollinger_upper, 261.5);
  assert.equal(result.bollinger_middle, 253.4);
  assert.equal(result.bollinger_lower, 245.2);
  assert.equal(result.atr14, 5.6);
});

test('ath and pct_below_ath are null when no 52wk data', () => {
  const result = TechnicalsAnalyzer.analyze({ indicators });
  assert.equal(result.ath, null);
  assert.equal(result.pct_below_ath, null);
});

test('computes ath and pct_below_ath from fiftyTwoWeekHigh', () => {
  const result = TechnicalsAnalyzer.analyze({
    indicators,
    fiftyTwoWeekHigh: 288.62,
    currentPrice: 255.92
  });
  assert.equal(result.ath, 288.62);
  const expected = ((288.62 - 255.92) / 288.62) * 100;
  assert.ok(Math.abs(result.pct_below_ath - expected) < 0.0001);
});

test('skips ath computation when fiftyTwoWeekHigh is zero', () => {
  const result = TechnicalsAnalyzer.analyze({
    indicators,
    fiftyTwoWeekHigh: 0,
    currentPrice: 255.92
  });
  assert.equal(result.ath, null);
});

test('skips ath computation when currentPrice is missing', () => {
  const result = TechnicalsAnalyzer.analyze({
    indicators,
    fiftyTwoWeekHigh: 288.62,
    currentPrice: null
  });
  assert.equal(result.ath, null);
});

test('handles partial indicator data without throwing', () => {
  const result = TechnicalsAnalyzer.analyze({ indicators: { rsi14: 50 } });
  assert.equal(result.rsi14, 50);
  assert.equal(result.stochastic_k, null);
  assert.equal(result.bollinger_upper, null);
});
