const ColumnHelp = {
  init() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.col-help');
      if (btn) {
        e.stopPropagation();
        const th = btn.closest('th');
        const wasOpen = th.classList.contains('tip-visible');
        document.querySelectorAll('th.tip-visible').forEach(el => el.classList.remove('tip-visible'));
        if (!wasOpen) th.classList.add('tip-visible');
        return;
      }
      document.querySelectorAll('th.tip-visible').forEach(el => el.classList.remove('tip-visible'));
    });
  }
};
