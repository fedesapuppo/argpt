const Filter = {
  _current: 'all',

  init() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._current = btn.dataset.filter;
        this._updateActive();
        App.refresh();
      });
    });
  },

  matches(type) {
    return this._current === 'all' || this._current === type;
  },

  _updateActive() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const active = btn.dataset.filter === this._current;
      btn.classList.toggle('bg-accent/20', active);
      btn.classList.toggle('text-accent', active);
      btn.classList.toggle('border-accent/30', active);
      btn.classList.toggle('text-muted', !active);
      btn.classList.toggle('border-surface-border', !active);
    });
  }
};
