module Argpt
  class HttpClient
    RETRYABLE_ERRORS = [Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNRESET, Argpt::ServerError].freeze

    def initialize(delay: 0.5, max_retries: 3)
      @delay = delay
      @max_retries = max_retries
    end

    def get(url, params: {})
      with_cache("GET", url, params) do
        response = HTTParty.get(url, query: params, timeout: 10)
        handle_response(response)
      end
    end

    def post(url, body:, headers: {})
      with_cache("POST", url, body) do
        response = HTTParty.post(url, body: body.to_json, headers: headers, timeout: 10)
        handle_response(response)
      end
    end

    private

    def with_cache(method, url, params, &block)
      key = cache_key_for(method, url, params)
      cached = read_cache(key)
      return cached if cached

      result = with_retry(&block)
      write_cache(key, result)
      result
    end

    def with_retry(&block)
      attempts = 0
      begin
        attempts += 1
        block.call
      rescue *RETRYABLE_ERRORS => e
        if attempts >= @max_retries
          raise e.is_a?(HttpError) ? e : HttpError.new(e.message)
        end
        sleep(@delay) if @delay > 0
        retry
      end
    end

    def handle_response(response)
      raise ServerError, "Server error #{response.code}" if response.code >= 500
      raise HttpError, "HTTP #{response.code}" if response.code >= 400

      JSON.parse(response.body, symbolize_names: true)
    end

    def caching_enabled?
      ENV["CACHE_JSON"] == "1"
    end

    def cache_key_for(method, url, params)
      Digest::SHA256.hexdigest("#{method}\n#{url}\n#{params.to_json}")
    end

    def read_cache(key)
      return nil unless caching_enabled?

      JSON.parse(File.read(cache_path(key)), symbolize_names: true)
    rescue Errno::ENOENT, JSON::ParserError
      nil
    end

    def write_cache(key, data)
      return unless caching_enabled?

      path = cache_path(key)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, JSON.generate(data))
    end

    def cache_path(key)
      "tmp/cache/#{key}.json"
    end
  end
end
