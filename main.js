(() => {
  document.documentElement.classList.remove('no-js');
  const WA_NUMBER = '33605974968';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Hero video (falls back to cinematic slideshow) ---------- */
  const hero = document.querySelector('.hero');
  const video = document.getElementById('heroVideo');
  if (video) {
    const markPlaying = () => { video.classList.add('is-playing'); hero.classList.add('has-video'); };
    video.addEventListener('playing', markPlaying, { once: true });
    const canWebm = video.canPlayType('video/webm; codecs="vp9"');
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!reduceMotion && canWebm && !saveData) {
      const hd = window.innerWidth * (window.devicePixelRatio || 1) >= 1280;
      // Try a self-hosted copy first (assets/video/), then Wikimedia Commons.
      const queue = [
        hd ? 'assets/video/eiffel-sunset-1080.webm' : 'assets/video/eiffel-sunset-720.webm',
        hd ? video.dataset.srcHd : video.dataset.srcSd,
      ];
      const next = () => {
        const src = queue.shift();
        if (!src) return; // nothing worked: the cinematic slideshow stays
        video.src = src;
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      };
      video.addEventListener('error', next);
      video.preload = 'auto';
      next();
    }
    // Pause the video when the hero is off-screen to save battery/data
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(([e]) => {
        if (!video.classList.contains('is-playing')) return;
        e.isIntersecting ? video.play().catch(() => {}) : video.pause();
      }, { threshold: 0.05 }).observe(hero);
    }
  }

  /* ---------- Nav ---------- */
  const nav = document.getElementById('nav');
  const waFloat = document.querySelector('.wa-float');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
    if (waFloat) waFloat.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    if (open) nav.classList.add('is-scrolled'); else onScroll();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });

  // Active section highlight
  const links = [...document.querySelectorAll('.nav__links a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- WhatsApp links with prefilled messages ---------- */
  const waUrl = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  document.querySelectorAll('.js-wa').forEach((a) => {
    if (a.dataset.msg) a.href = waUrl(a.dataset.msg);
  });

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      // small stagger inside grids
      const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.transitionDelay = `${Math.min(sib, 5) * 80}ms`;
      ro.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // Sparkle stagger for the tower
  document.querySelectorAll('.sparkles circle').forEach((c, i) => c.style.setProperty('--i', (i * 7) % 20));

  /* ---------- Setting cards pre-select the form ---------- */
  document.querySelectorAll('.setting[data-setting]').forEach((card) => {
    card.addEventListener('click', () => {
      const r = document.querySelector(`input[name="setting"][value="${card.dataset.setting}"]`);
      if (r) r.checked = true;
    });
  });

  /* ---------- Booking form -> WhatsApp ---------- */
  const form = document.getElementById('bookForm');
  if (form) {
    const date = form.querySelector('#f-date');
    const name = form.querySelector('#f-name');
    const today = new Date();
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    date.min = iso(today);

    const validName = () => name.value.trim().length > 0;
    const validDate = () => !!date.value && date.value >= date.min;
    const setErr = (input, ok) => {
      const f = input.closest('.field');
      f.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      const err = f.querySelector('.field__err');
      if (err) input.setAttribute('aria-describedby', err.id);
    };
    // validate on blur, clear as soon as it's fixed
    name.addEventListener('blur', () => setErr(name, validName()));
    date.addEventListener('blur', () => date.value && setErr(date, validDate()));
    name.addEventListener('input', () => { if (validName()) setErr(name, true); });
    date.addEventListener('input', () => { if (validDate()) setErr(date, true); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const okN = validName(), okD = validDate();
      setErr(name, okN); setErr(date, okD);
      if (!okN) return name.focus();
      if (!okD) return date.focus();

      const fd = new FormData(form);
      const nice = new Date(fd.get('date') + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const lines = [
        'Bonjour Picnic in Paris! 🧺🗼',
        "I'd like to book a picnic:",
        '',
        `• Name: ${fd.get('name').trim()}`,
        `• Date: ${nice}`,
        `• Time: ${fd.get('time')}`,
        `• Guests: ${fd.get('guests')}`,
        `• Occasion: ${fd.get('occasion')}`,
        `• Setting: ${fd.get('setting')}`,
      ];
      const notes = (fd.get('notes') || '').trim();
      if (notes) lines.push(`• Special requests: ${notes}`);
      lines.push('', 'Could you send me the menu options and a quote? Merci!');
      window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const items = [...document.querySelectorAll('.m-item')];
  let idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const img = items[idx].querySelector('img');
    lbImg.src = items[idx].dataset.full;
    lbImg.alt = img.alt;
  };
  if (lb && typeof lb.showModal === 'function') {
    items.forEach((btn, i) => btn.addEventListener('click', () => { lastFocus = btn; show(i); lb.showModal(); }));
    document.getElementById('lbClose').addEventListener('click', () => lb.close());
    document.getElementById('lbPrev').addEventListener('click', () => show(idx - 1));
    document.getElementById('lbNext').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    lb.addEventListener('close', () => lastFocus && lastFocus.focus());
    // swipe
    let sx = null;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }
})();
