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
        query = <<~GQL
          { ticker(symbol: "#{symbol}") { indicators(interval: "#{interval}", range: "#{range}") } }
        GQL
        graphql(query)
      end

      def financials(symbol, statement:, frequency:)
        query = <<~GQL
          { ticker(symbol: "#{symbol}") { financials(statement: "#{statement}", frequency: "#{frequency}") } }
        GQL
        graphql(query)
      end

      def risk(symbol, interval:, range:)
        query = <<~GQL
          { ticker(symbol: "#{symbol}") { risk(interval: "#{interval}", range: "#{range}") } }
        GQL
        graphql(query)
      end

      def chart(symbol, interval:, range:)
        query = <<~GQL
          { ticker(symbol: "#{symbol}") { chart(interval: "#{interval}", range: "#{range}") } }
        GQL
        graphql(query)
      end

      private

      def graphql(query)
        result = @client.post(GRAPHQL_URL,
          body: { query: query },
          headers: { "Content-Type" => "application/json" })

        raise GraphqlError, result[:errors].map { |e| e[:message] }.join(", ") if result[:errors]

        result.dig(:data, :ticker)
      end
    end
  end
end
