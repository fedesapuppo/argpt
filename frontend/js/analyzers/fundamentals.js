// Port of Argpt::Fundamentals::Analyzer + SectorBenchmarks.
// Turns a finance-query quote object into the shape used by fundamentals.json.
const FundamentalsAnalyzer = {
  ABSOLUTE_THRESHOLDS: {
    pe:             { direction: 'lower',  green: 15, yellow: 25 },
    forward_pe:     { direction: 'lower',  green: 15, yellow: 25 },
    pb:             { direction: 'lower',  green: 2,  yellow: 4 },
    roe:            { direction: 'higher', green: 15, yellow: 10 },
    debt_to_equity: { direction: 'lower',  green: 1,  yellow: 2 },
    profit_margin:  { direction: 'higher', green: 20, yellow: 10 }
  },

  RELATIVE_MULTIPLIERS: {
    pe:             { direction: 'lower',  yellow: 1.5 },
    forward_pe:     { direction: 'lower',  yellow: 1.5 },
    pb:             { direction: 'lower',  yellow: 1.5 },
    roe:            { direction: 'higher', yellow: 0.5 },
    debt_to_equity: { direction: 'lower',  yellow: 2.0 },
    profit_margin:  { direction: 'higher', yellow: 0.5 }
  },

  SECTOR_BENCHMARKS: {
    'Technology':           { pe: 28.0, pb: 6.0,  roe: 20.0, debt_to_equity: 0.6,  profit_margin: 22.0 },
    'Financial Services':   { pe: 12.0, pb: 1.2,  roe: 12.0, debt_to_equity: 3.0,  profit_margin: 25.0 },
    'Healthcare':           { pe: 22.0, pb: 4.0,  roe: 15.0, debt_to_equity: 0.8,  profit_margin: 12.0 },
    'Energy':               { pe: 10.0, pb: 1.5,  roe: 12.0, debt_to_equity: 0.5,  profit_margin: 10.0 },
    'Consumer Cyclical':    { pe: 20.0, pb: 3.0,  roe: 18.0, debt_to_equity: 1.0,  profit_margin: 8.0 },
    'Consumer Defensive':   { pe: 22.0, pb: 4.0,  roe: 20.0, debt_to_equity: 1.2,  profit_margin: 10.0 },
    'Industrials':          { pe: 20.0, pb: 3.5,  roe: 15.0, debt_to_equity: 1.0,  profit_margin: 10.0 },
    'Basic Materials':      { pe: 14.0, pb: 2.0,  roe: 12.0, debt_to_equity: 0.5,  profit_margin: 10.0 },
    'Real Estate':          { pe: 35.0, pb: 2.0,  roe: 6.0,  debt_to_equity: 1.5,  profit_margin: 20.0 },
    'Utilities':            { pe: 18.0, pb: 1.5,  roe: 10.0, debt_to_equity: 1.5,  profit_margin: 14.0 },
    'Communication Services': { pe: 18.0, pb: 3.0, roe: 14.0, debt_to_equity: 0.8, profit_margin: 15.0 }
  },

  BENCHMARK_KEYS: { forward_pe: 'pe' },

  analyze(quote) {
    if (!quote) return null;
    const benchmarks = this.SECTOR_BENCHMARKS[quote.sector] || null;

    const pe = this._safeDiv(quote.regularMarketPrice, quote.trailingEps);
    const forwardPe = this._safeDiv(quote.regularMarketPrice, quote.forwardEps);
    const roe = this._toPct(quote.returnOnEquity);
    const profitMargin = this._toPct(quote.profitMargins);
    const operatingMargin = this._toPct(quote.operatingMargins);
    const dividendYield = this._toPct(quote.dividendYield);
    const epsGrowth = this._toPct(quote.earningsGrowth);
    const deRatio = typeof quote.debtToEquity === 'number' ? quote.debtToEquity / 100 : null;

    return {
      pe,
      forward_pe: forwardPe,
      pb: quote.priceToBook ?? null,
      roe,
      eps_growth: epsGrowth,
      dividend_yield: dividendYield,
      debt_to_equity: deRatio,
      profit_margin: profitMargin,
      operating_margin: operatingMargin,
      sector: quote.sector || null,
      industry: quote.industry || null,
      current_price: quote.regularMarketPrice ?? null,
      fifty_two_week_high: quote.fiftyTwoWeekHigh ?? null,
      fifty_two_week_low: quote.fiftyTwoWeekLow ?? null,
      market_cap: quote.marketCap ?? null,
      thresholds: {
        pe: this._threshold('pe', pe, benchmarks),
        forward_pe: this._threshold('forward_pe', forwardPe, benchmarks),
        pb: this._threshold('pb', quote.priceToBook, benchmarks),
        roe: this._threshold('roe', roe, benchmarks),
        debt_to_equity: this._threshold('debt_to_equity', deRatio, benchmarks),
        profit_margin: this._threshold('profit_margin', profitMargin, benchmarks)
      },
      medians: benchmarks || {}
    };
  },

  _safeDiv(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number' || b === 0) return null;
    return a / b;
  },

  _toPct(value) {
    return typeof value === 'number' ? value * 100 : null;
  },

  _threshold(metric, value, benchmarks) {
    if (typeof value !== 'number') return null;
    const benchmarkKey = this.BENCHMARK_KEYS[metric] || metric;
    const benchmark = benchmarks?.[benchmarkKey];
    return benchmark != null
      ? this._relativeThreshold(metric, value, benchmark)
      : this._absoluteThreshold(metric, value);
  },

  _relativeThreshold(metric, value, benchmark) {
    const spec = this.RELATIVE_MULTIPLIERS[metric];
    if (spec.direction === 'lower') {
      if (value <= benchmark) return 'green';
      if (value <= benchmark * spec.yellow) return 'yellow';
      return 'red';
    } else {
      if (value >= benchmark) return 'green';
      if (value >= benchmark * spec.yellow) return 'yellow';
      return 'red';
    }
  },

  _absoluteThreshold(metric, value) {
    const spec = this.ABSOLUTE_THRESHOLDS[metric];
    if (spec.direction === 'lower') {
      if (value < spec.green) return 'green';
      if (value <= spec.yellow) return 'yellow';
      return 'red';
    } else {
      if (value > spec.green) return 'green';
      if (value >= spec.yellow) return 'yellow';
      return 'red';
    }
  }
};

export default FundamentalsAnalyzer;
