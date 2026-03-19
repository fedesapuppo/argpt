module Argpt
  class HttpClient
    RETRYABLE_ERRORS = [Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNRESET].freeze

    def initialize(delay: 0.5, max_retries: 3)
      @delay = delay
      @max_retries = max_retries
    end

    def get(url, params: {})
      cache_key = cache_key_for(url, params)
      cached = read_cache(cache_key)
      return cached if cached

      result = with_retry do
        sleep(@delay) if @delay > 0
        response = HTTParty.get(url, query: params)
        handle_response(response)
      end

      write_cache(cache_key, result)
      result
    end

    def post(url, body:, headers: {})
      cache_key = cache_key_for(url, body)
      cached = read_cache(cache_key)
      return cached if cached

      result = with_retry do
        sleep(@delay) if @delay > 0
        response = HTTParty.post(url, body: body.to_json, headers: headers)
        handle_response(response)
      end

      write_cache(cache_key, result)
      result
    end

    private

    def with_retry(&block)
      attempts = 0
      begin
        attempts += 1
        block.call
      rescue *RETRYABLE_ERRORS => e
        raise HttpError, e.message if attempts >= @max_retries
        sleep(@delay) if @delay > 0
        retry
      end
    end

    def handle_response(response)
      if response.code >= 500
        raise Net::OpenTimeout, "Server error #{response.code}"
      end

      JSON.parse(response.body, symbolize_names: true)
    end

    def cache_key_for(url, params)
      Digest::SHA256.hexdigest("#{url}#{params}")
    end

    def read_cache(key)
      return nil unless ENV["CACHE_JSON"] == "1"

      path = cache_path(key)
      return nil unless File.exist?(path)

      JSON.parse(File.read(path), symbolize_names: true)
    end

    def write_cache(key, data)
      return unless ENV["CACHE_JSON"] == "1"

      path = cache_path(key)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, JSON.generate(data))
    end

    def cache_path(key)
      "tmp/cache/#{key}.json"
    end
  end
end
