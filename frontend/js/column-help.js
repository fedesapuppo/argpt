// Tooltip positioner. Tips use position:fixed so they never contribute to
// any ancestor's scrollWidth (which previously caused a phantom horizontal
// scrollbar to appear whenever a tip was hovered inside an overflow-x:auto
// wrapper). On mouseover we find the nearest ancestor whose direct child is
// a `.tip`, show it, and place it in viewport coordinates below that host.
const ColumnHelp = {
  init() {
    document.addEventListener('mouseover', (e) => this._handle(e, true));
    document.addEventListener('mouseout',  (e) => this._handle(e, false));
  },

  _handle(e, entering) {
    const found = this._findHost(e.target);
    if (!found) return;
    const { host, tip } = found;

    if (!entering) {
      // Ignore moves between descendants of the same host.
      if (host.contains(e.relatedTarget)) return;
      tip.classList.remove('tip-show');
      return;
    }

    tip.classList.add('tip-show');
    this._place(tip, host);
  },

  _findHost(el) {
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      const children = node.children;
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        if (c.classList && c.classList.contains('tip')) return { host: node, tip: c };
      }
      node = node.parentElement;
    }
    return null;
  },

  _place(tip, host) {
    const r = host.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const pad = 8;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    let top = r.bottom + 4;
    if (top + tip.offsetHeight > window.innerHeight - pad) {
      top = r.top - tip.offsetHeight - 4;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
};
