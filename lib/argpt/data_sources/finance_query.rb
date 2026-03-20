module Argpt
  module DataSources
    class FinanceQuery
      BASE_URL = "https://finance-query.com"
      GRAPHQL_URL = "#{BASE_URL}/graphql"

      def initialize(client:)
        @client = client
      end

      def quotes(symbols)
        @client.get("#{BASE_URL}/v2/quotes", params: { symbols: symbols.join(",") })
      end

      def indicators(symbol, interval:, range:)
        ticker_query(symbol, "indicators", interval:, range:)
      end

      def financials(symbol, statement:, frequency:)
        ticker_query(symbol, "financials", statement:, frequency:)
      end

      def risk(symbol, interval:, range:)
        ticker_query(symbol, "risk", interval:, range:)
      end

      def chart(symbol, interval:, range:)
        ticker_query(symbol, "chart", interval:, range:)
      end

      private

      def ticker_query(symbol, field, **params)
        validate_inputs!(symbol, *params.values)
        args = params.map { |k, v| "#{k}: \"#{v}\"" }.join(", ")
        query = "{ ticker(symbol: \"#{symbol}\") { #{field}(#{args}) } }"
        graphql(query)
      end

      SAFE_INPUT = /\A[\w.\-^]+\z/

      def validate_inputs!(*values)
        values.each do |v|
          raise ArgumentError, "Invalid input: #{v}" unless v.match?(SAFE_INPUT)
        end
      end

      def graphql(query)
        result = @client.post(GRAPHQL_URL,
          body: { query: query },
          headers: { "Content-Type" => "application/json" })

        raise GraphqlError, result[:errors].map { |e| e[:message] }.join(", ") if result[:errors]&.any?

        result.dig(:data, :ticker)
      end
    end
  end
end
