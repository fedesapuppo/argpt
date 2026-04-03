module Argpt
  module Fundamentals
    module SectorBenchmarks
      BENCHMARKS = {
        "Technology" =>           { pe: 28.0, pb: 6.0,  roe: 20.0, debt_to_equity: 0.6,  profit_margin: 22.0 },
        "Financial Services" =>   { pe: 12.0, pb: 1.2,  roe: 12.0, debt_to_equity: 3.0,  profit_margin: 25.0 },
        "Healthcare" =>           { pe: 22.0, pb: 4.0,  roe: 15.0, debt_to_equity: 0.8,  profit_margin: 12.0 },
        "Energy" =>               { pe: 10.0, pb: 1.5,  roe: 12.0, debt_to_equity: 0.5,  profit_margin: 10.0 },
        "Consumer Cyclical" =>    { pe: 20.0, pb: 3.0,  roe: 18.0, debt_to_equity: 1.0,  profit_margin: 8.0 },
        "Consumer Defensive" =>   { pe: 22.0, pb: 4.0,  roe: 20.0, debt_to_equity: 1.2,  profit_margin: 10.0 },
        "Industrials" =>          { pe: 20.0, pb: 3.5,  roe: 15.0, debt_to_equity: 1.0,  profit_margin: 10.0 },
        "Basic Materials" =>      { pe: 14.0, pb: 2.0,  roe: 12.0, debt_to_equity: 0.5,  profit_margin: 10.0 },
        "Real Estate" =>          { pe: 35.0, pb: 2.0,  roe: 6.0,  debt_to_equity: 1.5,  profit_margin: 20.0 },
        "Utilities" =>            { pe: 18.0, pb: 1.5,  roe: 10.0, debt_to_equity: 1.5,  profit_margin: 14.0 },
        "Communication Services" => { pe: 18.0, pb: 3.0, roe: 14.0, debt_to_equity: 0.8, profit_margin: 15.0 }
      }.freeze

      def self.for(sector)
        BENCHMARKS[sector]
      end
    end
  end
end
