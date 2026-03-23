const Portfolio = {
  calculate(holdings, prices, mep, ccl) {
    if (!holdings.length || !mep || !ccl) {
      return { holdings: [], total_value_usd: 0, total_value_ars: 0, total_pnl_usd: 0, total_pnl_ars: 0, daily_change_pct: 0, has_estimated_fx: false };
    }

    const computed = holdings.map((h, index) => this._computeHolding(h, index, prices, mep, ccl));
    const totalUsd = computed.reduce((s, c) => s + c.value_usd, 0);
    const totalArs = computed.reduce((s, c) => s + c.value_ars, 0);

    const results = computed.map(c => ({
      ...c,
      weight_pct: totalUsd > 0 ? (c.value_usd / totalUsd) * 100 : 0
    }));

    const totalPnlUsd = computed.reduce((s, c) => s + (c.pnl_usd || 0), 0);
    const totalPnlArs = computed.reduce((s, c) => s + c.pnl_ars, 0);
    const dailyChange = totalUsd > 0
      ? computed.reduce((s, c) => s + (c.daily_change_pct || 0) * c.value_usd, 0) / totalUsd
      : 0;

    const hasEstimatedFx = holdings.some(h =>
      (h.type === 'cedear' || h.type === 'arg_stock') && !h.entry_fx_rate
    );

    return {
      holdings: results,
      total_value_usd: totalUsd,
      total_value_ars: totalArs,
      total_pnl_usd: totalPnlUsd,
      total_pnl_ars: totalPnlArs,
      daily_change_pct: dailyChange,
      has_estimated_fx: hasEstimatedFx
    };
  },

  _computeHolding(h, index, prices, mep, ccl) {
    const priceKey = `${h.ticker}:${h.type}`;
    const priceData = prices[priceKey];
    if (!priceData) return this._emptyHolding(h, index);

    const last = priceData.last;
    const isArs = h.type === 'cedear' || h.type === 'arg_stock';
    const priceUsd = isArs ? last / mep.mark : last;
    const priceArs = isArs ? last : last * ccl.mark;
    const valueUsd = h.shares * priceUsd;
    const valueArs = h.shares * priceArs;

    const pnlArs = isArs
      ? (last - h.avg_price) * h.shares
      : (last - h.avg_price) * h.shares * ccl.mark;
    const pnlPct = ((last - h.avg_price) / h.avg_price) * 100;

    let pnlUsd = null;
    if (isArs && h.entry_fx_rate) {
      const entryUsd = h.avg_price / h.entry_fx_rate;
      pnlUsd = (priceUsd - entryUsd) * h.shares;
    } else if (!isArs) {
      pnlUsd = (last - h.avg_price) * h.shares;
    }

    const capitalReturn = pnlPct;
    let currencyReturn = null;
    let totalReturnUsd = null;

    if (!isArs) {
      currencyReturn = 0;
      totalReturnUsd = capitalReturn;
    } else if (h.entry_fx_rate) {
      currencyReturn = (h.entry_fx_rate / mep.mark - 1) * 100;
      totalReturnUsd = ((1 + capitalReturn / 100) * (1 + currencyReturn / 100) - 1) * 100;
    }

    return {
      index, ticker: h.ticker, type: h.type, shares: h.shares,
      avg_price: h.avg_price, current_price: last,
      current_price_usd: priceUsd, current_price_ars: priceArs,
      daily_change_pct: priceData.change || 0,
      pnl_ars: pnlArs, pnl_usd: pnlUsd, pnl_pct: pnlPct,
      capital_return_pct: capitalReturn,
      currency_return_pct: currencyReturn,
      total_return_usd_pct: totalReturnUsd,
      value_usd: valueUsd, value_ars: valueArs,
      weight_pct: 0
    };
  },

  _emptyHolding(h, index) {
    return {
      index, ticker: h.ticker, type: h.type, shares: h.shares,
      avg_price: h.avg_price, current_price: null,
      current_price_usd: null, current_price_ars: null,
      daily_change_pct: 0, pnl_ars: 0, pnl_usd: null, pnl_pct: null,
      capital_return_pct: null, currency_return_pct: null,
      total_return_usd_pct: null, value_usd: 0, value_ars: 0, weight_pct: 0
    };
  }
};
