const test = require('node:test');
const assert = require('node:assert/strict');
const FundamentalsAnalyzer = require('../../../frontend/js/analyzers/fundamentals.js');

// Realistic AAPL quote from finance-query graphql (captured 2026-04-05)
const aaplQuote = {
  regularMarketPrice: 255.92,
  trailingEps: 7.91,
  forwardEps: 9.31526,
  priceToBook: 42.667553,
  returnOnEquity: 1.5202099,
  profitMargins: 0.27037,
  operatingMargins: 0.35374,
  debtToEquity: 102.63,
  dividendYield: 0.0041,
  earningsGrowth: 0.183,
  fiftyTwoWeekHigh: 288.62,
  fiftyTwoWeekLow: 169.21,
  sector: 'Technology',
  industry: 'Consumer Electronics',
  shortName: 'Apple Inc.',
  marketCap: 3761492983808
};

test('returns null when quote is missing', () => {
  assert.equal(FundamentalsAnalyzer.analyze(null), null);
  assert.equal(FundamentalsAnalyzer.analyze(undefined), null);
});

test('computes pe from price and trailing eps', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.ok(Math.abs(result.pe - (255.92 / 7.91)) < 0.001);
});

test('computes forward_pe from price and forward eps', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.ok(Math.abs(result.forward_pe - (255.92 / 9.31526)) < 0.001);
});

test('converts returnOnEquity from fraction to percent', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.ok(Math.abs(result.roe - 152.02099) < 0.001);
});

test('converts debtToEquity from 0-100 scale to ratio', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.ok(Math.abs(result.debt_to_equity - 1.0263) < 0.0001);
});

test('converts profitMargins to percent', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.ok(Math.abs(result.profit_margin - 27.037) < 0.001);
});

test('converts dividendYield to percent', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.ok(Math.abs(result.dividend_yield - 0.41) < 0.001);
});

test('passes through priceToBook, marketCap, sector, fifty_two_week_high', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.equal(result.pb, 42.667553);
  assert.equal(result.market_cap, 3761492983808);
  assert.equal(result.sector, 'Technology');
  assert.equal(result.fifty_two_week_high, 288.62);
  assert.equal(result.current_price, 255.92);
});

test('uses sector benchmarks as medians when available', () => {
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.deepEqual(result.medians, {
    pe: 28.0, pb: 6.0, roe: 20.0, debt_to_equity: 0.6, profit_margin: 22.0
  });
});

test('empty medians when sector is unknown', () => {
  const q = { ...aaplQuote, sector: 'Unknown' };
  const result = FundamentalsAnalyzer.analyze(q);
  assert.deepEqual(result.medians, {});
});

test('returns null fields for missing numeric data', () => {
  const result = FundamentalsAnalyzer.analyze({ regularMarketPrice: 100 });
  assert.equal(result.pe, null);
  assert.equal(result.roe, null);
  assert.equal(result.profit_margin, null);
  assert.equal(result.debt_to_equity, null);
});

test('threshold returns green when roe exceeds benchmark', () => {
  // Technology benchmark roe = 20. aapl roe = 152 → green (higher direction)
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.equal(result.thresholds.roe, 'green');
});

test('threshold returns red when pb is far above benchmark', () => {
  // Technology benchmark pb = 6. aapl pb = 42.7 → well above 6 * 1.5 = 9 → red
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.equal(result.thresholds.pb, 'red');
});

test('threshold uses absolute scale when sector is unknown', () => {
  const q = { ...aaplQuote, sector: 'Unknown', priceToBook: 1.5 };
  const result = FundamentalsAnalyzer.analyze(q);
  // absolute pb: < 2 → green
  assert.equal(result.thresholds.pb, 'green');
});

test('forward_pe threshold uses pe benchmark key', () => {
  // sector pe benchmark = 28. forward_pe = 255.92/9.31526 ≈ 27.47 → below 28 → green
  const result = FundamentalsAnalyzer.analyze(aaplQuote);
  assert.equal(result.thresholds.forward_pe, 'green');
});
