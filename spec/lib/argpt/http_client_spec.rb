require "spec_helper"

RSpec.describe Argpt::HttpClient do
  describe "#get" do
    it "returns parsed JSON with symbol keys" do
      stub_request(:get, "https://example.com/data")
        .to_return(body: '[{"name":"GGAL","price":100}]', headers: { "Content-Type" => "application/json" })

      client = Argpt::HttpClient.new(delay: 0)
      result = client.get("https://example.com/data")

      expect(result).to eq([{ name: "GGAL", price: 100 }])
    end

    it "forwards query params" do
      stub_request(:get, "https://example.com/data?symbols=AAPL,MSFT")
        .to_return(body: '{"ok":true}', headers: { "Content-Type" => "application/json" })

      client = Argpt::HttpClient.new(delay: 0)
      result = client.get("https://example.com/data", params: { symbols: "AAPL,MSFT" })

      expect(result).to eq({ ok: true })
    end

    it "retries on 5xx and succeeds" do
      stub_request(:get, "https://example.com/data")
        .to_return({ status: 503 }, { body: '{"ok":true}', headers: { "Content-Type" => "application/json" } })

      client = Argpt::HttpClient.new(delay: 0, max_retries: 3)
      result = client.get("https://example.com/data")

      expect(result).to eq({ ok: true })
    end

    it "retries on timeout and succeeds" do
      stub_request(:get, "https://example.com/data")
        .to_timeout
        .then.to_return(body: '{"ok":true}', headers: { "Content-Type" => "application/json" })

      client = Argpt::HttpClient.new(delay: 0, max_retries: 3)
      result = client.get("https://example.com/data")

      expect(result).to eq({ ok: true })
    end

    it "retries on connection reset and succeeds" do
      stub_request(:get, "https://example.com/data")
        .to_raise(Errno::ECONNRESET)
        .then.to_return(body: '{"ok":true}', headers: { "Content-Type" => "application/json" })

      client = Argpt::HttpClient.new(delay: 0, max_retries: 3)
      result = client.get("https://example.com/data")

      expect(result).to eq({ ok: true })
    end

    it "raises HttpError after exhausting retries" do
      stub_request(:get, "https://example.com/data")
        .to_return(status: 500)

      client = Argpt::HttpClient.new(delay: 0, max_retries: 2)

      expect { client.get("https://example.com/data") }.to raise_error(Argpt::HttpError)
    end

    context "when the API returns 5xx" do
      it "raises ServerError after exhausting retries" do
        stub_request(:get, "https://example.com/data")
          .to_return(status: 503)

        client = Argpt::HttpClient.new(delay: 0, max_retries: 2)

        expect { client.get("https://example.com/data") }.to raise_error(Argpt::ServerError)
      end
    end

    context "when the response is malformed JSON" do
      it "raises JSON::ParserError" do
        stub_request(:get, "https://example.com/data")
          .to_return(body: "not json", status: 200)

        client = Argpt::HttpClient.new(delay: 0)

        expect { client.get("https://example.com/data") }.to raise_error(JSON::ParserError)
      end
    end

    context "when the API returns 4xx" do
      it "raises HttpError without retrying" do
        stub_request(:get, "https://example.com/data")
          .to_return(status: 404, body: "Not Found")

        client = Argpt::HttpClient.new(delay: 0, max_retries: 3)

        expect { client.get("https://example.com/data") }.to raise_error(Argpt::HttpError)
        expect(a_request(:get, "https://example.com/data")).to have_been_made.once
      end
    end
  end

  describe "#post" do
    it "sends JSON body and returns parsed response" do
      stub_request(:post, "https://example.com/graphql")
        .with(body: '{"query":"{ ticker }"}', headers: { "Content-Type" => "application/json" })
        .to_return(body: '{"data":{"ticker":{"symbol":"AAPL"}}}', headers: { "Content-Type" => "application/json" })

      client = Argpt::HttpClient.new(delay: 0)
      result = client.post("https://example.com/graphql",
        body: { query: "{ ticker }" },
        headers: { "Content-Type" => "application/json" })

      expect(result).to eq({ data: { ticker: { symbol: "AAPL" } } })
    end
  end

  describe "file caching" do
    it "writes cache on miss and reads on hit" do
      stub_request(:get, "https://example.com/data")
        .to_return(body: '{"cached":true}', headers: { "Content-Type" => "application/json" })

      with_cache_enabled do
        client = Argpt::HttpClient.new(delay: 0)

        result1 = client.get("https://example.com/data")
        expect(result1).to eq({ cached: true })

        result2 = client.get("https://example.com/data")
        expect(result2).to eq({ cached: true })
        expect(a_request(:get, "https://example.com/data")).to have_been_made.once
      end
    end

    it "caches POST requests" do
      stub_request(:post, "https://example.com/graphql")
        .to_return(body: '{"data":"ok"}', headers: { "Content-Type" => "application/json" })

      with_cache_enabled do
        client = Argpt::HttpClient.new(delay: 0)

        client.post("https://example.com/graphql", body: { q: "test" }, headers: {})
        client.post("https://example.com/graphql", body: { q: "test" }, headers: {})

        expect(a_request(:post, "https://example.com/graphql")).to have_been_made.once
      end
    end
  end

  private

  def with_cache_enabled
    original = ENV["CACHE_JSON"]
    ENV["CACHE_JSON"] = "1"
    yield
  ensure
    ENV["CACHE_JSON"] = original
    FileUtils.rm_rf("tmp/cache")
  end
end
