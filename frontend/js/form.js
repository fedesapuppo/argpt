const Form = {
  init() {
    const form = document.getElementById('holding-form');
    const typeSelect = form.querySelector('[name="type"]');
    const fxGroup = document.getElementById('fx-rate-group');

    typeSelect.addEventListener('change', () => {
      fxGroup.style.display = typeSelect.value === 'us_stock' ? 'none' : '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const holding = {
        ticker: data.get('ticker').toUpperCase().trim(),
        type: data.get('type'),
        shares: parseFloat(data.get('shares')),
        avg_price: parseFloat(data.get('avg_price')),
        entry_fx_rate: data.get('entry_fx_rate') ? parseFloat(data.get('entry_fx_rate')) : null
      };

      if (!holding.ticker || !holding.shares || !holding.avg_price) return;

      Storage.addHolding(holding);
      form.reset();
      App.refresh();
    });
  },

  removeHolding(index) {
    Storage.removeHolding(index);
    App.refresh();
  }
};
