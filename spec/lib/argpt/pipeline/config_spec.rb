require "spec_helper"
require "tempfile"

RSpec.describe Argpt::Pipeline::Config do
  describe "#call" do
    it "parses tickers from YAML" do
      config = config_from("tickers:\n  - ticker: GGAL\n    type: arg_stock\n  - ticker: AAPL\n    type: us_stock\n")

      result = config.call

      expect(result.length).to eq(2)
      expect(result.first).to eq({ ticker: "GGAL", type: :arg_stock })
      expect(result.last).to eq({ ticker: "AAPL", type: :us_stock })
    end

    it "handles cedear type" do
      config = config_from("tickers:\n  - ticker: AAPL\n    type: cedear\n")

      result = config.call

      expect(result.first[:type]).to eq(:cedear)
    end

    context "when type is invalid" do
      it "raises an error" do
        config = config_from("tickers:\n  - ticker: FOO\n    type: bond\n")

        expect { config.call }.to raise_error(Argpt::Error, /Invalid type/)
      end
    end

    context "when file does not exist" do
      it "raises an error" do
        config = Argpt::Pipeline::Config.new(path: "/nonexistent.yml")

        expect { config.call }.to raise_error(Errno::ENOENT)
      end
    end

    context "when YAML is missing tickers key" do
      it "raises an error" do
        config = config_from("other_key: value\n")

        expect { config.call }.to raise_error(Argpt::Error, /missing.*tickers/i)
      end
    end

    context "when tickers is not an array" do
      it "raises an error" do
        config = config_from("tickers: not_an_array\n")

        expect { config.call }.to raise_error(Argpt::Error, /tickers.*array/i)
      end
    end

    context "when YAML is empty" do
      it "raises an error" do
        config = config_from("")

        expect { config.call }.to raise_error(Argpt::Error, /missing.*tickers/i)
      end
    end
  end

  describe "#by_type" do
    it "groups tickers by type" do
      config = config_from("tickers:\n  - ticker: GGAL\n    type: arg_stock\n  - ticker: YPF\n    type: arg_stock\n  - ticker: AAPL\n    type: us_stock\n")

      result = config.by_type

      expect(result[:arg_stock].map { |t| t[:ticker] }).to eq(%w[GGAL YPF])
      expect(result[:us_stock].map { |t| t[:ticker] }).to eq(%w[AAPL])
    end
  end

  private

  def config_from(yaml_content)
    file = Tempfile.new(["holdings", ".yml"])
    file.write(yaml_content)
    file.rewind
    @tempfiles ||= []
    @tempfiles << file
    Argpt::Pipeline::Config.new(path: file.path)
  end
end
