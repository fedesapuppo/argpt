// Port of Argpt::Technicals::Analyzer.
// Turns a finance-query indicators payload (+ optional 52wk high/current price
// from fundamentals) into the shape used by technicals.json.
const TechnicalsAnalyzer = {
  analyze({ indicators, fiftyTwoWeekHigh = null, currentPrice = null }) {
    if (!indicators) return null;
    const result = this._extract(indicators);
    if (fiftyTwoWeekHigh > 0 && currentPrice) {
      result.ath = fiftyTwoWeekHigh;
      result.pct_below_ath = ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100;
    }
    return result;
  },

  _extract(ind) {
    const stoch = ind.stochastic || {};
    const supertrend = ind.supertrend || {};
    const bollinger = ind.bollingerBands || {};
    return {
      rsi14: ind.rsi14 ?? null,
      macd: ind.macd ?? null,
      stochastic_k: stoch['%K'] ?? null,
      stochastic_d: stoch['%D'] ?? null,
      supertrend_value: supertrend.value ?? null,
      supertrend_trend: supertrend.trend ?? null,
      sma20: ind.sma20 ?? null,
      sma50: ind.sma50 ?? null,
      sma200: ind.sma200 ?? null,
      bollinger_upper: bollinger.upper ?? null,
      bollinger_middle: bollinger.middle ?? null,
      bollinger_lower: bollinger.lower ?? null,
      atr14: ind.atr14 ?? null,
      ath: null,
      pct_below_ath: null
    };
  }
};

if (typeof module !== 'undefined') module.exports = TechnicalsAnalyzer;
