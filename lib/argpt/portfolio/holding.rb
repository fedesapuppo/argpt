module Argpt
  module Portfolio
    class Holding
      VALID_TYPES = %i[cedear arg_stock us_stock].freeze
      ARS_TYPES = %i[cedear arg_stock].freeze

      attr_reader :ticker, :type, :shares, :avg_price, :purchase_date, :purchase_fx_rate

      def initialize(ticker:, type:, shares:, avg_price:, purchase_date:, purchase_fx_rate: nil)
        raise ArgumentError, "Invalid type: #{type}" unless VALID_TYPES.include?(type)
        raise ArgumentError, "Shares must be positive" unless shares.positive?
        raise ArgumentError, "avg_price must be positive" unless avg_price.positive?
        raise ArgumentError, "purchase_fx_rate must be positive" if purchase_fx_rate && !purchase_fx_rate.positive?

        @ticker = ticker
        @type = type
        @shares = shares
        @avg_price = avg_price
        @purchase_date = purchase_date
        @purchase_fx_rate = purchase_fx_rate
        freeze
      end

      def original_currency
        ARS_TYPES.include?(type) ? :ars : :usd
      end

      def cost_basis_usd
        return avg_price if original_currency == :usd
        return nil unless purchase_fx_rate

        avg_price / purchase_fx_rate
      end
    end
  end
end
