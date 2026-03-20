---
name: tdd-skill
description: Guides TDD implementation via strict Red-Green-Refactor cycles, one piece at a time. Use when implementing features or fixes with TDD, or whenever CLAUDE.md says to use TDD. This skill applies to ALL implementation work — features, bug fixes, refactors with behavior changes. Even "simple" changes benefit from the discipline.
---

Implement using strict test-driven development: one Red-Green-Refactor cycle at a
time. The discipline is the point — it prevents writing more code than needed and
catches design problems early.

## The cycle

1. **Red**: Write the simplest test for ONE discrete piece of functionality. Run
   it with `bundle exec rspec <file>:<line>` and verify it fails with the
   expected error message. If it fails for the wrong reason, fix the test first.

2. **Green**: Write the minimum code to make that one test pass. Resist the urge
   to implement more than what the test demands. Run the test again to confirm it
   passes.

3. **Refactor**: With the test green, look for opportunities to clean up — both
   in the production code and the test. Remove duplication, improve naming,
   extract methods. Run the test again to verify nothing broke.

4. **Repeat**: Pick the next piece of functionality and start a new cycle.

## What counts as "one piece"

- One validation rule
- One branch of a conditional
- One method on a service object
- One error/edge case
- One step in a multi-step workflow

If you're unsure whether something is one piece or two, err on the side of
smaller. You can always go faster; you can't easily undo a big untested jump.

## When a test fails unexpectedly

- If the Red step fails with the wrong error: fix the setup, not the production
  code. The test should fail because the behavior isn't implemented yet, not
  because of a typo or missing factory.
- If the Green step breaks other tests: you've changed existing behavior. Stop,
  understand why, and decide whether the other tests need updating or your
  implementation approach is wrong.

## When to stop

- All acceptance criteria from the task are covered by tests
- You can't think of another meaningful behavior to test
- Edge cases are handled (nil inputs, empty collections, unexpected API responses)

## Rules

- Never write an entire test file up front
- Never implement more than one discrete piece of functionality per cycle
- Never write production code without a failing test demanding it
- Run only the relevant spec file during cycles, not the full suite (save that
  for the end)

---

## RSpec Conventions

Follow these conventions for all test structure, naming, and patterns.

### Test Structure

Every test follows three phases separated by blank lines: setup, execute, expect.

```ruby
it "returns the MEP rate for the given ticker" do
  stub_request(:get, "https://data912.com/live/mep")
    .to_return(body: load_fixture("data912_mep.json"))

  result = Argpt::Rates::Mep.new.call

  expect(result.first[:ticker]).to eq("AL30")
end
```

No `let`, no `before`, no `subject`. Inline everything. Extract repeated setup
into private methods at the bottom of the spec — some repetition is fine and
preferred over indirection.

```ruby
RSpec.describe Argpt::Rates::Mep do
  describe "#call" do
    it "returns rates for all tickers" do
      stub_mep_response

      result = Argpt::Rates::Mep.new.call

      expect(result).not_to be_empty
    end

    context "when the API returns an error" do
      it "raises an error" do
        stub_request(:get, "https://data912.com/live/mep")
          .to_return(status: 500)

        expect { Argpt::Rates::Mep.new.call }.to raise_error(Argpt::ApiError)
      end
    end
  end

  private

  def stub_mep_response
    stub_request(:get, "https://data912.com/live/mep")
      .to_return(body: load_fixture("data912_mep.json"))
  end
end
```

### Naming Conventions

#### Describe blocks

- `.method_name` for class methods
- `#method_name` for instance methods

#### Context blocks

Start with "when", "with", or "without":

```ruby
context "when the ticker has a D suffix" do
context "with an empty response body" do
context "without a valid MEP rate" do
```

#### It blocks

- Third-person present tense, no "should"
- Under 40 characters when possible
- Describe the outcome, not the implementation

```ruby
# Good
it "returns the USD price" do
it "raises on timeout" do

# Bad
it "should return the USD price" do
it "calls HTTParty.get and parses JSON" do
```

### One Expectation Per Test

Unit tests get one expectation. When testing a method that returns a hash or
struct, split into separate tests per field — each test documents one behavior.

Exception: when multiple expectations verify a single logical outcome (e.g.,
checking both status code and body of a parsed response), grouping is fine.

### WebMock Patterns

#### Stub with fixtures

```ruby
stub_request(:get, "https://data912.com/live/cedears")
  .to_return(body: load_fixture("data912_cedears.json"),
             headers: {"Content-Type" => "application/json"})
```

#### Test error conditions

```ruby
context "when the API times out" do
  it "raises an error" do
    stub_request(:get, "https://data912.com/live/mep").to_timeout

    expect { Argpt::Rates::Mep.new.call }.to raise_error(Argpt::ApiError)
  end
end

context "when the API returns malformed JSON" do
  it "raises an error" do
    stub_request(:get, "https://data912.com/live/mep")
      .to_return(body: "not json")

    expect { Argpt::Rates::Mep.new.call }.to raise_error(JSON::ParserError)
  end
end
```

#### Fixture naming

`{source}_{endpoint}_{qualifier}.json` — e.g., `data912_mep.json`,
`fq_quote_aapl.json`. Keep only the fields your code uses.

### Contexts to Cover for API Clients

- Successful response with expected data
- Empty response (valid JSON but no data)
- HTTP error (4xx, 5xx)
- Timeout
- Malformed response body
- Missing expected keys in JSON

### What to Avoid

**Never stub the system under test.** If you're testing `Argpt::Rates::Mep`,
don't stub methods on it. Stub the HTTP layer beneath it.

**Never test private methods.** Test the public interface. Private methods are
covered indirectly.

**No `any_instance_of`.** If you need to inject a dependency, change the class
to accept it.

**No `let`, `let!`, `before`, `subject`.** Use inline setup and private helper
methods.

**No "should" in descriptions.** Use third-person present tense.

**No boolean equality checks.** Use predicate matchers:

```ruby
# Good
expect(result).to be_empty

# Bad
expect(result.empty?).to eq(true)
```

### Expectation Quick Reference

```ruby
# Equality
expect(value).to eq(expected)
expect(value).to be(expected)           # same object
expect(value).to match(/regex/)

# Predicates
expect(object).to be_valid
expect(collection).to be_empty
expect(hash).to have_key(:ticker)

# Collections
expect(array).to include(item)
expect(array).to contain_exactly(a, b, c)

# Changes
expect { action }.to change { object.count }.by(1)

# Errors
expect { action }.to raise_error(Argpt::ApiError)
expect { action }.to raise_error(Argpt::ApiError, /rate limit/)

# Type
expect(result).to be_a(Hash)
```
