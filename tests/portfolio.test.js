import { describe, it, expect } from 'vitest';
import Portfolio from '../frontend/js/portfolio.js';

// MEP/CCL rate shape matches the contract from lib/argpt/pipeline/fetch.rb:36-38.
const mep = (mark) => ({ ticker: 'AL30', bid: mark - 1, ask: mark + 1, mark });
const ccl = (mark) => ({ ticker: 'AL30C', bid: mark - 1, ask: mark + 1, mark });

// Price shape matches what pipeline/price_fetcher.rb emits, keyed "TICKER:type".
const price = (last, change = 0) => ({ last, change, volume: 0, currency: 'ars', type: 'arg_stock' });

describe('Portfolio.calculate', () => {
  describe('with no holdings', () => {
    it('returns zeroed totals', () => {
      const result = Portfolio.calculate([], {}, mep(1000), ccl(1100));
      expect(result.holdings).toEqual([]);
      expect(result.total_value_usd).toBe(0);
      expect(result.total_value_ars).toBe(0);
      expect(result.total_pnl_usd).toBe(0);
      expect(result.total_pnl_ars).toBe(0);
      expect(result.daily_change_pct).toBe(0);
      expect(result.has_estimated_fx).toBe(false);
    });
  });

  describe('argentine stock (ARS)', () => {
    it('computes USD value using the MEP rate and full decomposition when entry_fx is known', () => {
      // GGAL Sep 2021 example from README.md lines 22–23.
      const holdings = [
        { ticker: 'GGAL', type: 'arg_stock', shares: 1, avg_price: 194, entry_fx_rate: 173, broker: 'ib' }
      ];
      const prices = { 'GGAL:arg_stock': price(6650) };
      const result = Portfolio.calculate(holdings, prices, mep(1419.24), ccl(1500));
      const h = result.holdings[0];

      expect(h.current_price).toBe(6650);
      expect(h.current_price_usd).toBeCloseTo(4.685, 2);
      expect(h.value_usd).toBeCloseTo(4.685, 2);
      expect(h.cost_basis_usd).toBeCloseTo(1.121, 2);

      // Capital return: (6650 - 194) / 194 * 100 ≈ +3328%
      expect(h.capital_return_pct).toBeCloseTo(3327.83, 1);
      // Currency return: (173 / 1419.24 - 1) * 100 ≈ -87.81%
      expect(h.currency_return_pct).toBeCloseTo(-87.81, 1);
      // Total USD return: (1 + 33.28)(1 + -0.8781) - 1 ≈ +318% (README says ~+316%, within rounding)
      expect(h.total_return_usd_pct).toBeCloseTo(318, 0);

      expect(result.has_estimated_fx).toBe(false);
      expect(h.weight_pct).toBe(100);
    });

    it('falls back to current MEP when entry_fx is missing and flags has_estimated_fx', () => {
      const holdings = [
        { ticker: 'GGAL', type: 'arg_stock', shares: 1, avg_price: 1000, entry_fx_rate: null, broker: 'ib' }
      ];
      const prices = { 'GGAL:arg_stock': price(2000) };
      const result = Portfolio.calculate(holdings, prices, mep(1000), ccl(1100));
      const h = result.holdings[0];

      // With effective entry_fx = current mep.mark (1000), currency_return collapses to 0
      // and total_return_usd equals capital_return.
      expect(h.currency_return_pct).toBeCloseTo(0, 5);
      expect(h.capital_return_pct).toBeCloseTo(100, 5);
      expect(h.total_return_usd_pct).toBeCloseTo(100, 5);
      expect(result.has_estimated_fx).toBe(true);
    });

    it('returns empty holding when MEP or CCL is missing for an ARS position', () => {
      const holdings = [
        { ticker: 'GGAL', type: 'arg_stock', shares: 10, avg_price: 100, broker: 'ib' }
      ];
      const prices = { 'GGAL:arg_stock': price(200) };
      const result = Portfolio.calculate(holdings, prices, null, null);
      const h = result.holdings[0];

      expect(h.value_usd).toBe(0);
      expect(h.current_price).toBeNull();
      expect(h.pnl_usd).toBeNull();
    });
  });

  describe('us stock (USD)', () => {
    it('uses the price directly as USD and CCL for the ARS column', () => {
      const holdings = [
        { ticker: 'AAPL', type: 'us_stock', shares: 10, avg_price: 150, broker: 'ib' }
      ];
      const prices = {
        'AAPL:us_stock': { last: 200, change: 1.5, volume: 0, currency: 'usd', type: 'us_stock' }
      };
      const result = Portfolio.calculate(holdings, prices, mep(1000), ccl(1100));
      const h = result.holdings[0];

      expect(h.current_price_usd).toBe(200);
      expect(h.value_usd).toBe(2000);
      expect(h.value_ars).toBe(10 * 200 * 1100);
      expect(h.cost_basis_usd).toBe(150);
      expect(h.pnl_usd).toBe(500);
      expect(h.pnl_pct).toBeCloseTo(33.333, 2);
      expect(h.capital_return_pct).toBeCloseTo(33.333, 2);
      expect(h.currency_return_pct).toBe(0);
      expect(h.total_return_usd_pct).toBeCloseTo(33.333, 2);
      expect(result.has_estimated_fx).toBe(false);
    });
  });

  describe('CEDEAR free lots (stock split / ratio change artifacts)', () => {
    it('nulls P&L for lots with avg_price <= 0.01 (zero-cost shares from ratio changes)', () => {
      const holdings = [
        { ticker: 'NVDA', type: 'cedear', shares: 54, avg_price: 0, entry_fx_rate: 500, broker: 'balanz' }
      ];
      const prices = { 'NVDA:cedear': price(8000) };
      const result = Portfolio.calculate(holdings, prices, mep(1400), ccl(1500));
      const h = result.holdings[0];

      expect(h.pnl_usd).toBeNull();
      expect(h.pnl_pct).toBeNull();
      expect(h.pnl_ars).toBe(0);
      expect(h.cost_basis_usd).toBeNull();
      expect(h.capital_return_pct).toBeNull();
      expect(h.total_return_usd_pct).toBeNull();
      // But value_usd is still computed — the shares exist and are worth something.
      expect(h.value_usd).toBeGreaterThan(0);
    });
  });

  describe('missing price data', () => {
    it('returns empty holding when the ticker:type key is absent from prices', () => {
      const holdings = [
        { ticker: 'XYZ', type: 'arg_stock', shares: 5, avg_price: 100, broker: 'ib' }
      ];
      const result = Portfolio.calculate(holdings, {}, mep(1000), ccl(1100));
      const h = result.holdings[0];

      expect(h.current_price).toBeNull();
      expect(h.value_usd).toBe(0);
      expect(h.weight_pct).toBe(0);
    });
  });

  describe('totals and weighting', () => {
    it('sums value_usd across holdings and weighs daily_change_pct by value', () => {
      const holdings = [
        { ticker: 'A', type: 'us_stock', shares: 10, avg_price: 50, broker: 'ib' },
        { ticker: 'B', type: 'us_stock', shares: 5,  avg_price: 100, broker: 'ib' }
      ];
      const prices = {
        'A:us_stock': { last: 100, change: 10, volume: 0, currency: 'usd', type: 'us_stock' }, // value_usd 1000, weight 50%
        'B:us_stock': { last: 200, change: 0,  volume: 0, currency: 'usd', type: 'us_stock' }  // value_usd 1000, weight 50%
      };
      const result = Portfolio.calculate(holdings, prices, mep(1000), ccl(1100));

      expect(result.total_value_usd).toBe(2000);
      expect(result.total_pnl_usd).toBe(500 + 500);
      // Value-weighted daily change: (10 * 1000 + 0 * 1000) / 2000 = 5
      expect(result.daily_change_pct).toBeCloseTo(5, 5);
      expect(result.holdings[0].weight_pct).toBeCloseTo(50, 5);
      expect(result.holdings[1].weight_pct).toBeCloseTo(50, 5);
    });
  });
});
