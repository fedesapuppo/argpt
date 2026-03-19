require "webmock/rspec"

WebMock.disable_net_connect!

module FixtureHelper
  def fixture_path(filename)
    File.join(File.dirname(__FILE__), "fixtures", filename)
  end

  def load_fixture(filename)
    File.read(fixture_path(filename))
  end

  def load_json_fixture(filename)
    JSON.parse(load_fixture(filename))
  end
end

RSpec.configure do |config|
  config.include FixtureHelper
end
