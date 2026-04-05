const Form = {
  _editIndex: null,

  init() {
    const form = document.getElementById('holding-form');
    const typeSelect = form.querySelector('[name="type"]');
    const fxGroup = document.getElementById('fx-rate-group');
    const dateInput = form.querySelector('[name="purchase_date"]');
    const fxInput = form.querySelector('[name="entry_fx_rate"]');
    const hint = document.getElementById('fx-rate-hint');

    typeSelect.addEventListener('change', () => {
      fxGroup.style.display = typeSelect.value === 'us_stock' ? 'none' : '';
    });

    dateInput.addEventListener('change', () => {
      if (!dateInput.value) return;
      const mep = App.currentMepRate();
      if (mep && !fxInput.value) {
        fxInput.value = mep;
        hint.textContent = I18n.t('form.hint_using_mep', { rate: mep });
      }
    });

    fxInput.addEventListener('input', () => {
      hint.textContent = I18n.t('form.hint_default');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const holding = {
        ticker: data.get('ticker').toUpperCase().trim(),
        type: data.get('type'),
        shares: parseFloat(data.get('shares')),
        avg_price: parseFloat(data.get('avg_price')),
        purchase_date: data.get('purchase_date') || null,
        entry_fx_rate: data.get('entry_fx_rate') ? parseFloat(data.get('entry_fx_rate')) : null
      };

      if (!holding.ticker || !holding.shares || !holding.avg_price) return;

      if (this._editIndex !== null) {
        Storage.updateHolding(this._editIndex, holding);
        Toast.success(`${holding.ticker} updated`);
        this._resetEditState();
      } else {
        Storage.addHolding(holding);
        Toast.success(`${holding.ticker} added`);
      }

      form.reset();
      hint.textContent = I18n.t('form.hint_default');
      App.refresh();
      App.fetchForHoldings([holding]);
    });

    const cancelBtn = document.getElementById('cancel-edit');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelEdit());
  },

  editHolding(index) {
    const holdings = Storage.getHoldings();
    const h = holdings[index];
    if (!h) return;

    this._editIndex = index;
    const form = document.getElementById('holding-form');
    const details = form.closest('details');
    details.open = true;

    form.querySelector('[name="ticker"]').value = h.ticker;
    form.querySelector('[name="type"]').value = h.type;
    form.querySelector('[name="shares"]').value = h.shares;
    form.querySelector('[name="avg_price"]').value = h.avg_price;
    form.querySelector('[name="purchase_date"]').value = h.purchase_date || '';
    form.querySelector('[name="entry_fx_rate"]').value = h.entry_fx_rate || '';

    const fxGroup = document.getElementById('fx-rate-group');
    fxGroup.style.display = h.type === 'us_stock' ? 'none' : '';

    const summary = details.querySelector('summary');
    summary.textContent = `Editing ${h.ticker}`;

    document.getElementById('form-submit-btn').textContent = 'Save';
    document.getElementById('cancel-edit').classList.remove('hidden');

    details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  cancelEdit() {
    this._resetEditState();
    const form = document.getElementById('holding-form');
    form.reset();
    document.getElementById('fx-rate-hint').textContent = I18n.t('form.hint_default');
  },

  _resetEditState() {
    this._editIndex = null;
    const details = document.getElementById('holding-form').closest('details');
    const summary = details.querySelector('summary');
    summary.textContent = I18n.t('form.add_holding');
    document.getElementById('form-submit-btn').textContent = I18n.t('form.add_btn');
    document.getElementById('cancel-edit').classList.add('hidden');
  },

  removeHolding(index) {
    Storage.removeHolding(index);
    App.refresh();
  }
};
