module Argpt
  class Error < StandardError; end
  class HttpError < Error; end
  class GraphqlError < Error; end
end
