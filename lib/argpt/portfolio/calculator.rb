module Argpt
  module Portfolio
    class Calculator
      Result = Data.define(:holdings, :total_value_usd, :total_value_ars, :total_pnl_usd, :total_pnl_ars, :daily_change_pct)

      HoldingResult = Data.define(
        :ticker, :type, :shares, :avg_price,
        :current_price, :current_price_usd, :current_price_ars,
        :daily_change_pct, :pnl_ars, :pnl_usd, :pnl_pct,
        :capital_return_pct, :currency_return_pct, :total_return_usd_pct,
        :weight_pct
      )

      def initialize(holdings:, prices:, mep_rate:, ccl_rate:)
        @holdings = holdings
        @prices = prices
        @mep_rate = mep_rate
        @ccl_rate = ccl_rate
      end

      def call
        return empty_result if @holdings.empty?

        computed = @holdings.map { |h| compute_holding(h) }
        total_usd = computed.sum { |c| c[:value_usd] }
        total_ars = computed.sum { |c| c[:value_ars] }

        holding_results = computed.map do |c|
          HoldingResult.new(**c[:attrs], weight_pct: weight(c[:value_usd], total_usd))
        end

        total_pnl_usd = computed.sum { |c| c[:pnl_usd] || 0 }
        total_pnl_ars = computed.sum { |c| c[:pnl_ars] }
        daily = weighted_daily_change(computed, total_usd)

        Result.new(holdings: holding_results, total_value_usd: total_usd, total_value_ars: total_ars,
                   total_pnl_usd: total_pnl_usd, total_pnl_ars: total_pnl_ars, daily_change_pct: daily)
      end

      private

      def compute_holding(h)
        price_key = "#{h.ticker}:#{h.type}"
        price_data = @prices.fetch(price_key) { @prices.fetch(h.ticker) { raise Argpt::Error, "Missing price for #{h.ticker}" } }
        last = price_data[:last] || raise(Argpt::Error, "Missing :last in price for #{h.ticker}")

        price_usd, price_ars = convert_prices(h, last)
        value_usd = h.shares * price_usd
        value_ars = h.shares * price_ars
        pnl_ars, pnl_usd, pnl_pct = compute_pnl(h, last, price_usd)
        capital, currency, total_usd_ret = decompose_return(h, last)

        attrs = {
          ticker: h.ticker, type: h.type, shares: h.shares, avg_price: h.avg_price,
          current_price: last, current_price_usd: price_usd, current_price_ars: price_ars,
          daily_change_pct: price_data[:change], pnl_ars:, pnl_usd:, pnl_pct:,
          capital_return_pct: capital, currency_return_pct: currency, total_return_usd_pct: total_usd_ret
        }

        { attrs:, value_usd:, value_ars:, pnl_ars:, pnl_usd: }
      end

      def convert_prices(h, last)
        if h.original_currency == :ars
          [last / @mep_rate.mark, last]
        else
          [last, last * @ccl_rate.mark]
        end
      end

      def compute_pnl(h, last, current_price_usd)
        if h.original_currency == :ars
          pnl_ars = (last - h.avg_price) * h.shares
          pnl_pct = ((last - h.avg_price) / h.avg_price) * 100
          pnl_usd = if h.purchase_fx_rate
                      entry_usd = h.avg_price / h.purchase_fx_rate
                      (current_price_usd - entry_usd) * h.shares
                    end
          [pnl_ars, pnl_usd, pnl_pct]
        else
          pnl_usd = (last - h.avg_price) * h.shares
          pnl_ars = pnl_usd * @ccl_rate.mark
          pnl_pct = ((last - h.avg_price) / h.avg_price) * 100
          [pnl_ars, pnl_usd, pnl_pct]
        end
      end

      def decompose_return(h, last)
        capital = ((last - h.avg_price) / h.avg_price) * 100

        if h.original_currency == :usd
          [capital, 0.0, capital]
        elsif h.purchase_fx_rate
          currency = (h.purchase_fx_rate / @mep_rate.mark - 1) * 100
          total = ((1 + capital / 100.0) * (1 + currency / 100.0) - 1) * 100
          [capital, currency, total]
        else
          [capital, nil, nil]
        end
      end

      def weight(value_usd, total_usd)
        return 0 if total_usd.zero?

        (value_usd / total_usd) * 100
      end

      def weighted_daily_change(computed, total_usd)
        return 0 if total_usd.zero?

        computed.sum { |c| c[:attrs][:daily_change_pct] * c[:value_usd] } / total_usd
      end

      def empty_result
        Result.new(holdings: [], total_value_usd: 0, total_value_ars: 0,
                   total_pnl_usd: 0, total_pnl_ars: 0, daily_change_pct: 0)
      end
    end
  end
end
