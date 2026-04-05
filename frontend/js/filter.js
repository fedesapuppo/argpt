// Stateless filter predicate. The current filter value is owned by the
// Alpine "dashboard" component; app.js writes it to Filter._current via
// `setFilter()` before calling App.refresh(), and the table renderers read
// it when deciding which rows to display.
const Filter = {
  _current: 'all',

  matches(type) {
    return this._current === 'all' || this._current === type;
  }
};

export default Filter;
