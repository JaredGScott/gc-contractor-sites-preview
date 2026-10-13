document.documentElement.classList.add('js');
document.documentElement.classList.remove('no-js');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const overlay = document.querySelector('.nav-overlay, .nav-sidebar');
const mobile = window.matchMedia('(max-width: 900px)');
function setMenu(open, focus = false) {
  toggle?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open && Boolean(overlay));
  if (open && focus) nav.querySelector('a')?.focus();
  if (!open && focus) toggle?.focus();
}
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true', true));
document.addEventListener('keydown', event => {
  if (toggle?.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
  if (event.key === 'Tab' && (mobile.matches || overlay)) {
    const items = [toggle, ...nav.querySelectorAll('a,button')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
nav?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('click', event => {
  if (toggle?.getAttribute('aria-expanded') === 'true' && !event.target.closest('.site-header')) setMenu(false);
});
mobile.addEventListener('change', () => setMenu(false));
const filters = document.querySelectorAll('[data-project-filter]');
filters.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.projectFilter;
  filters.forEach(other => { const active = other === button; other.setAttribute('aria-pressed', String(active)); other.classList.toggle('active', active); });
  let count = 0;
  document.querySelectorAll('[data-category]').forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; if (!card.hidden) count++; });
  const status = document.querySelector('.filter-status');
  if (status) status.textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown`;
}));
const form = document.querySelector('#estimate-form');
const preview = document.querySelector('#request-preview');
let brief = '';
if (form) {
  form.querySelector('button[type="submit"]').disabled = false;
  const params = new URLSearchParams(window.__previewQuery ?? location.search);
  const service = params.get('service');
  if (service && [...form.elements.service.options].some(option => option.value === service)) form.elements.service.value = service;
  const priorities = params.get('priorities');
  if (priorities) form.elements.details.value = `I would like extra space for: ${priorities.slice(0, 1200)}.`;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = [['Name','name'],['Email','email'],['Phone','phone'],['Project area','location'],['Project type','service'],['Planning stage','stage'],['Investment range','investment'],['Project details','details']];
    const summary = document.querySelector('#request-summary');
    summary.replaceChildren();
    const lines = ['ESTIMATE REQUEST — LOCAL PREVIEW','Nothing has been sent.',''];
    fields.forEach(([label, key]) => {
      const control = form.elements[key];
      const value = control.tagName === 'SELECT' ? control.options[control.selectedIndex].text : control.value.trim();
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value || 'Not provided'; row.append(dt, dd); summary.append(row);
      lines.push(`${label}: ${value || 'Not provided'}`, '');
    });
    brief = lines.join('\n');
    form.hidden = true; preview.hidden = false; preview.focus();
  });
  document.querySelector('#edit-request')?.addEventListener('click', () => { preview.hidden = true; form.hidden = false; form.elements.name.focus(); });
  document.querySelector('#download-request')?.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'estimate-request.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector('.download-status').textContent = 'Your request file was prepared for download. Nothing has been sent.';
  });
}
document.querySelector('#carry-priorities')?.addEventListener('click', () => {
  const chosen = [...document.querySelectorAll('.priority-choices input:checked')].map(input => input.value);
  if (!chosen.length) { document.querySelector('#priority-status').textContent = 'Choose at least one need to include in your request.'; return; }
  const target = `estimate.html?priorities=${encodeURIComponent(chosen.join(', '))}`; if(window.__previewNavigate) window.__previewNavigate(target); else location.href=target;
});

// Motion: full by default; under Reduce Motion the CSS keeps fades and count-ups but drops movement.
// IntersectionObserver (not scroll timelines) so every phone, including older iPhones, gets the effect.
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
const syncMotionClass = () => document.documentElement.classList.toggle('motion-full', !calm.matches);
syncMotionClass(); calm.addEventListener?.('change', syncMotionClass);
const revealSelector = ['.home-hero > *', '.home-services-head', '.service-card', '.footer-details > div', '.home-feature > *', '.feature-copy', '.review-voices > .voice', '.testimony-row', '.page-head > div',
  '.service-item', '.project-item', '.review-item', '.planning-step', '.project-facts', '.project-story > div', '.project-voice', '.project-pager',
  '.about-owner > div', '.about-team > div', '.responsibility-section > div', '.buyer-questions > div', '.privacy-content > div', '.story-next > div',
  '.estimate-aside', '.before-after > div', '.space-planner > div', '.photo-style', '.photo-brief > div', '.review-disclosure', '.project-filters'].join(',');
const candidates = [...document.querySelectorAll(revealSelector)].filter(el => !el.classList.contains('photo-slot'));
const revealTargets = candidates.filter(el => !candidates.some(other => other !== el && el.contains(other)));
const photoTargets = [...document.querySelectorAll('main .photo-slot')];
const reveal = el => el.classList.add('is-in');
const stagger = (list, attr) => list.forEach(el => {
  el.setAttribute(attr, '');
  const siblings = list.filter(other => other.parentElement === el.parentElement);
  el.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(el), 4) * 0.09}s`);
});
stagger(revealTargets, 'data-reveal');
stagger(photoTargets, 'data-photo-reveal');
photoTargets.forEach(slot => { if (getComputedStyle(slot).position === 'absolute') slot.classList.add('photo-bg'); });
const motionTargets = [...revealTargets, ...photoTargets];
if ('IntersectionObserver' in window) {
  const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { reveal(entry.target); watcher.unobserve(entry.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  revealTargets.forEach(el => watcher.observe(el));
} else revealTargets.forEach(reveal);
// Photos start fully masked, which browsers count as not visible, so they are revealed by position instead.
let pendingPhotos = [...photoTargets], photoCheckQueued = false;
const checkPhotos = () => {
  photoCheckQueued = false;
  const limit = innerHeight * 0.94;
  pendingPhotos = pendingPhotos.filter(slot => {
    const r = slot.getBoundingClientRect();
    if (r.top < limit) { reveal(slot); return false; }
    return true;
  });
  if (!pendingPhotos.length) { removeEventListener('scroll', queuePhotoCheck); removeEventListener('resize', queuePhotoCheck); }
};
const queuePhotoCheck = () => { if (!photoCheckQueued) { photoCheckQueued = true; requestAnimationFrame(checkPhotos); } };
addEventListener('scroll', queuePhotoCheck, { passive: true }); addEventListener('resize', queuePhotoCheck);
requestAnimationFrame(checkPhotos);
// Anything already scrolled past (back navigation, anchors) is shown straight away.
requestAnimationFrame(() => revealTargets.forEach(el => { if (el.getBoundingClientRect().bottom < 0) reveal(el); }));
window.addEventListener('beforeprint', () => motionTargets.forEach(reveal));

// Gentle parallax inside large photos (movement only, so it stops under Reduce Motion).
const parallaxSlots = photoTargets.filter(slot => slot.offsetHeight >= 260);
let parallaxQueued = false;
const updateParallax = () => {
  parallaxQueued = false;
  if (calm.matches) return;
  const h = innerHeight;
  parallaxSlots.forEach(slot => {
    const r = slot.getBoundingClientRect();
    if (r.bottom < -100 || r.top > h + 100) return;
    const progress = (r.top + r.height / 2 - h / 2) / h;
    slot.style.setProperty('--parallax', `${(progress * -26).toFixed(1)}px`);
  });
};
const queueParallax = () => { if (!parallaxQueued) { parallaxQueued = true; requestAnimationFrame(updateParallax); } };
if (parallaxSlots.length) { addEventListener('scroll', queueParallax, { passive: true }); addEventListener('resize', queueParallax); updateParallax(); }

// Count up rounded proof figures when they come into view (kept under Reduce Motion; screen readers get the final figure).
document.querySelectorAll('.proof').forEach(proof => {
  const walker = document.createTreeWalker(proof, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const match = node.textContent.match(/\d[\d,]*/);
    if (!match) continue;
    const target = parseInt(match[0].replace(/,/g, ''), 10);
    const before = node.textContent.slice(0, match.index), after = node.textContent.slice(match.index + match[0].length);
    const shown = document.createElement('span'); shown.className = 'count'; shown.setAttribute('aria-hidden', 'true'); shown.textContent = match[0];
    const spoken = document.createElement('span'); spoken.className = 'sr-only'; spoken.textContent = match[0];
    node.replaceWith(document.createTextNode(before), shown, spoken, document.createTextNode(after));
    const run = () => {
      const start = performance.now(), duration = 1400;
      const tick = now => {
        const t = Math.min((now - start) / duration, 1), eased = 1 - Math.pow(1 - t, 3);
        shown.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      shown.textContent = '0';
      const once = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { once.disconnect(); run(); } });
      once.observe(proof);
    }
    break;
  }
});
