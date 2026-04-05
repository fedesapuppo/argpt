const test = require('node:test');
const assert = require('node:assert/strict');
const FinanceQuery = require('../../../frontend/js/api/finance_query.js');

test('fqSymbol returns us ticker unchanged', () => {
  assert.equal(FinanceQuery.fqSymbol('AAPL', 'us_stock'), 'AAPL');
});

test('fqSymbol appends .BA for arg_stock', () => {
  assert.equal(FinanceQuery.fqSymbol('GGAL', 'arg_stock'), 'GGAL.BA');
});

test('fqSymbol strips .C suffix for cedears', () => {
  assert.equal(FinanceQuery.fqSymbol('BA.C', 'cedear'), 'BA');
});

test('fqSymbol maps BRKB alias to BRK-B', () => {
  assert.equal(FinanceQuery.fqSymbol('BRKB', 'cedear'), 'BRK-B');
});

test('fqSymbol applies BRKB alias and .BA suffix together', () => {
  assert.equal(FinanceQuery.fqSymbol('BRKB', 'arg_stock'), 'BRK-B.BA');
});
