const Toast = {
  _container: null,

  init() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(el);
    this._container = el;
  },

  show(message, type = 'info', duration = 4000) {
    const colors = {
      success: 'border-l-gain',
      error: 'border-l-loss',
      info: 'border-l-accent'
    };

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto bg-surface-secondary border border-surface-border ${colors[type] || colors.info} border-l-4 rounded-lg px-4 py-3 text-sm shadow-lg transition-all duration-300 opacity-0 translate-x-4`;
    toast.textContent = message;

    this._container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-x-4');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};
