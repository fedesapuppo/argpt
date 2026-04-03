require "spec_helper"
require "stringio"

RSpec.describe Argpt::Logger do
  describe ".warn" do
    it "outputs formatted warning to configured output" do
      output = StringIO.new
      Argpt::Logger.output = output

      Argpt::Logger.warn("technicals", "AAPL", "timeout after 5s")

      expect(output.string).to eq("[WARN] [technicals] AAPL: timeout after 5s\n")
    ensure
      Argpt::Logger.output = $stderr
    end
  end

  describe ".info" do
    it "outputs formatted info to configured output" do
      output = StringIO.new
      Argpt::Logger.output = output

      Argpt::Logger.info("pipeline", "AAPL", "fetched successfully")

      expect(output.string).to eq("[INFO] [pipeline] AAPL: fetched successfully\n")
    ensure
      Argpt::Logger.output = $stderr
    end
  end

  describe ".error" do
    it "outputs formatted error to configured output" do
      output = StringIO.new
      Argpt::Logger.output = output

      Argpt::Logger.error("fundamentals", "GGAL", "server 500")

      expect(output.string).to eq("[ERROR] [fundamentals] GGAL: server 500\n")
    ensure
      Argpt::Logger.output = $stderr
    end
  end

  describe "default output" do
    it "defaults to $stderr" do
      expect(Argpt::Logger.output).to eq($stderr)
    end
  end
end
