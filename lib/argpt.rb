require "httparty"
require "json"
require "digest"
require "fileutils"

require_relative "argpt/error"
require_relative "argpt/http_client"
require_relative "argpt/data_sources/data912"
require_relative "argpt/data_sources/finance_query"
require_relative "argpt/data_sources/argentina_datos"
require_relative "argpt/portfolio/holding"
require_relative "argpt/portfolio/exchange_rate"
require_relative "argpt/portfolio/calculator"
require_relative "argpt/technicals/analyzer"
require_relative "argpt/fundamentals/analyzer"

module Argpt
end
