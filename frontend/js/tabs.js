const Tabs = {
  init() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTo(btn.dataset.tab));
    });

    const hash = window.location.hash.replace('#', '');
    if (['portfolio', 'technicals', 'fundamentals'].includes(hash)) {
      this.switchTo(hash);
    }
  },

  switchTo(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const active = btn.dataset.tab === tabName;
      btn.classList.toggle('border-accent', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('border-transparent', !active);
      btn.classList.toggle('text-muted', !active);
    });

    document.querySelectorAll('[id^="tab-"]').forEach(section => {
      section.classList.toggle('hidden', section.id !== `tab-${tabName}`);
    });

    window.location.hash = tabName;
  }
};
