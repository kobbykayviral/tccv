/* ══════════════════════════════════════════════════════
   THE CHRISTIAN CREATIVE VAULT  ·  script.js  v3
   Formspree AJAX · Validation · WhatsApp Redirect
   ══════════════════════════════════════════════════════ */

'use strict';

/* ── CONSTANTS ──────────────────────────────────────── */
const FORMSPREE_URL  = 'https://formspree.io/f/xaqagadv';
const WHATSAPP_LINK  = 'https://chat.whatsapp.com/BVbp26JO0LbE3wrFC6o6M4';
const REDIRECT_DELAY = 3; // seconds

/* ── VALIDATION RULES ───────────────────────────────── */
const RULES = {
  fullName:   { required: true, min: 2,    label: 'Full name' },
  sex:        { required: true,             label: 'Sex' },
  profession: { required: true, min: 2,    label: 'Profession' },
  country:    { required: true, min: 2,    label: 'Country' },
  email:      { required: true, email: true, label: 'Email' },
  mobile:     { required: true, phone: true, label: 'Mobile number' },
  whatsapp:   { required: true, phone: true, label: 'WhatsApp number' },
};

function check(id, val) {
  const r = RULES[id];
  if (!r) return null;
  if (r.required && !val.trim())           return `${r.label} is required.`;
  if (r.min      && val.trim().length < r.min) return `${r.label} is too short.`;
  if (r.email    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email.';
  if (r.phone    && !/^\+?[\d\s\-(). ]{6,22}$/.test(val))    return 'Enter a valid phone number.';
  return null;
}

function markField(id, msg) {
  const el  = document.getElementById(id);
  const err = document.getElementById('err-' + id);
  if (el) {
    el.classList.toggle('err', !!msg);
  }
  if (err) err.textContent = msg || '';
}

function validateAll(data) {
  let valid = true;
  for (const id of Object.keys(RULES)) {
    const msg = check(id, data[id] ?? '');
    markField(id, msg);
    if (msg) valid = false;
  }
  return valid;
}

/* ── COLLECT DATA ───────────────────────────────────── */
function getData() {
  return {
    fullName:   document.getElementById('fullName').value.trim(),
    sex:        document.getElementById('sex').value,
    profession: document.getElementById('profession').value.trim(),
    country:    document.getElementById('country').value.trim(),
    email:      document.getElementById('email').value.trim(),
    mobile:     document.getElementById('mobile').value.trim(),
    whatsapp:   document.getElementById('whatsapp').value.trim(),
  };
}

/* ── FORMSPREE AJAX SUBMIT ──────────────────────────── */
/*
  Formspree supports AJAX with:
    fetch(url, { method:'POST', headers:{'Accept':'application/json'}, body: FormData })
  This prevents the default page redirect and lets us handle
  the success/error state ourselves — perfect for GitHub Pages.
*/
async function submitFormspree(formEl) {
  const formData = new FormData(formEl);
  const resp = await fetch(FORMSPREE_URL, {
    method:  'POST',
    headers: { 'Accept': 'application/json' },
    body:    formData,
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.message || 'Submission failed. Please try again.');
  }
  return true;
}

/* ── BUTTON HELPERS ─────────────────────────────────── */
function setLoading(on) {
  const btn    = document.getElementById('submit-btn');
  const label  = btn.querySelector('.submit-btn__text');
  const loader = btn.querySelector('.submit-btn__loader');
  btn.disabled  = on;
  label.hidden  = on;
  loader.hidden = !on;
}

/* ── COUNTDOWN + REDIRECT ───────────────────────────── */
function startCountdown() {
  let count = REDIRECT_DELAY;
  const display = document.getElementById('countdown');

  const tick = setInterval(() => {
    count--;
    if (display) display.textContent = count;
    if (count <= 0) {
      clearInterval(tick);
      window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
    }
  }, 1000);
}

/* ── SHOW SUCCESS ───────────────────────────────────── */
function showSuccess() {
  const formCard    = document.getElementById('form-card');
  const successCard = document.getElementById('success-card');

  if (formCard)    formCard.style.display = 'none';
  if (successCard) {
    successCard.hidden = false;
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  startCountdown();
}

/* ── MAIN SUBMIT HANDLER ────────────────────────────── */
async function handleSubmit(e) {
  e.preventDefault();

  const data = getData();

  if (!validateAll(data)) {
    // Scroll to first error
    const firstErr = document.querySelector('.err');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    shakeBtn();
    return;
  }

  setLoading(true);

  try {
    await submitFormspree(e.target);
    showSuccess();
  } catch (err) {
    console.error('Formspree error:', err);
    showInlineError(err.message || 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
}

function shakeBtn() {
  const btn = document.getElementById('submit-btn');
  btn.classList.add('shake-anim');
  setTimeout(() => btn.classList.remove('shake-anim'), 600);
}

function showInlineError(msg) {
  let el = document.getElementById('submit-error');
  if (!el) {
    el = document.createElement('p');
    el.id = 'submit-error';
    el.style.cssText = 'color:#E05252;font-size:.8rem;font-weight:600;text-align:center;margin-top:10px;';
    document.getElementById('submit-btn').insertAdjacentElement('afterend', el);
  }
  el.textContent = msg;
}

/* ── LIVE VALIDATION ────────────────────────────────── */
function liveValidation() {
  Object.keys(RULES).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('blur', () => {
      markField(id, check(id, el.value) || '');
    });

    el.addEventListener('input', () => {
      if (el.classList.contains('err')) {
        if (!check(id, el.value)) markField(id, '');
      }
    });
  });
}

/* ── SCROLL REVEAL ──────────────────────────────────── */
function scrollReveal() {
  const els = document.querySelectorAll('.sr');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -28px 0px' });
  els.forEach(el => io.observe(el));
}

/* ── MARK ELEMENTS FOR REVEAL ───────────────────────── */
function initRevealTargets() {
  const targets = [
    { sel: '.hero__text',           delay: '' },
    { sel: '.hero__flyer-col',      delay: 'd1' },
    { sel: '.curriculum__header',   delay: '' },
    { sel: '.curr-item',            delay: '' }, // staggered by index
    { sel: '.tutor-band__left',     delay: '' },
    { sel: '.tutor-band__right',    delay: 'd1' },
    { sel: '.register__left',       delay: '' },
    { sel: '.form-card',            delay: 'd1' },
  ];

  targets.forEach(({ sel, delay }) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('sr');
      const d = sel === '.curr-item' ? `d${(i % 3) + 1}` : delay;
      if (d) el.classList.add(d);
    });
  });
}

/* ── NAV SCROLL EFFECT ──────────────────────────────── */
function navScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.style.transform = (y > lastY && y > 80) ? 'translateY(-100%)' : 'translateY(0)';
    lastY = y;
  }, { passive: true });
}

/* ── INJECT GLOBAL STYLES ───────────────────────────── */
function injectExtraStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .nav { transition: transform 0.35s cubic-bezier(0.22,1,.36,1); }
    @keyframes shake {
      0%,100%{ transform: translateX(0); }
      20%    { transform: translateX(-8px); }
      40%    { transform: translateX(8px); }
      60%    { transform: translateX(-5px); }
      80%    { transform: translateX(5px); }
    }
    .shake-anim { animation: shake .5s ease; }
  `;
  document.head.appendChild(s);
}

/* ── SMOOTH ANCHORS ─────────────────────────────────── */
function smoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ── BOOT ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectExtraStyles();
  initRevealTargets();
  scrollReveal();
  smoothAnchors();
  navScroll();
  liveValidation();

  const form = document.getElementById('reg-form');
  if (form) form.addEventListener('submit', handleSubmit);
});
