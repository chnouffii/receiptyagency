/**
 * Couche d'interaction de la refonte — port fidèle du JS du design.
 * Vanilla DOM, agnostique du framework. On l'attache après le rendu React.
 *
 *  - mountPageFx(root)  : particules, tilt 3D, boutons magnétiques, reveal au
 *                         scroll, compteurs — pour le sous-arbre `root`.
 * Chaque fonction retourne un cleanup à appeler au démontage.
 */

export function mountPageFx(root) {
  if (!root) return () => {};
  const cleanups = [];

  // ---- reveal au scroll (staggered) ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target;
        const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(() => {
          el.style.opacity = '1'; el.style.transform = 'none';
          el.dispatchEvent(new CustomEvent('revealed'));
        }, delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '-30px' });
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)';
    io.observe(el);
  });
  cleanups.push(() => io.disconnect());

  // ---- compteurs animés ----
  const runCounter = (el) => {
    if (el.__done) return; el.__done = true;
    const target = parseFloat(el.getAttribute('data-target')) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1600, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('fr-FR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  root.querySelectorAll('[data-counter]').forEach((c) => {
    const card = c.closest('[data-reveal]') || c;
    card.addEventListener('revealed', () => runCounter(c));
  });

  // ---- tilt 3D + spotlight ----
  root.querySelectorAll('[data-tilt]').forEach((card) => {
    const spot = card.querySelector('[data-spot]');
    const mm = (ev) => {
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 5}deg) translateY(-4px)`;
      card.style.borderColor = 'var(--border2)';
      card.style.boxShadow = '0 20px 50px -20px var(--glow)';
      if (spot) spot.style.opacity = '.9';
    };
    const ml = () => {
      card.style.transform = ''; card.style.borderColor = 'var(--border)'; card.style.boxShadow = 'none';
      if (spot) spot.style.opacity = '0';
    };
    card.addEventListener('mousemove', mm);
    card.addEventListener('mouseleave', ml);
  });

  // ---- boutons magnétiques ----
  root.querySelectorAll('[data-magnetic]').forEach((btn) => {
    const arrow = btn.querySelector('[data-arrow]');
    btn.style.willChange = 'transform';
    const mm = (ev) => {
      const r = btn.getBoundingClientRect();
      const dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * 0.28}px, ${dy * 0.32}px)`;
      if (arrow) arrow.style.transform = 'translateX(4px)';
    };
    const ml = () => { btn.style.transform = ''; if (arrow) arrow.style.transform = ''; };
    btn.addEventListener('mousemove', mm);
    btn.addEventListener('mouseleave', ml);
  });

  // ---- particules (hero) ----
  const canvas = root.querySelector('[data-particles]');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w, h, parts, raf;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.floor(w * h / 16000));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4,
      }));
    };
    const draw = () => {
      if (!parts) return;
      ctx.clearRect(0, 0, w, h);
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const col = light ? '13,14,20' : '255,255,255';
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = `rgba(${col},${light ? 0.25 : 0.4})`; ctx.fill();
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 110) * (light ? 0.14 : 0.22)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize', resize);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); });
  }

  return () => cleanups.forEach((fn) => fn());
}
