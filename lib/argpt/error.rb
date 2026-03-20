module Argpt
  class Error < StandardError; end
  class HttpError < Error; end
  class ServerError < HttpError; end
  class GraphqlError < Error; end
end
