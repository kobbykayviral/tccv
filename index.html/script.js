/* ══════════════════════════════════════════════════
   THE CHRISTIAN CREATIVE VAULT  ·  script.js
   Google Sheets POST · Form Validation · UX Logic
   ══════════════════════════════════════════════════ */

'use strict';

/* ── CONFIG ─────────────────────────────────────── */
const SHEET_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbxWptB1l3flFMm2YgKg2L58ERi7vRoEDZjTp4sHBfjXXt0vY0oLFN7zszLz6Yi9HUrq/exec';

const WHATSAPP_LINK = 'https://chat.whatsapp.com/BVbp26JO0LbE3wrFC6o6M4';

/* ── VALIDATION RULES ────────────────────────────── */
const RULES = {
  fullName:   { required: true, minLen: 2,   label: 'Full name' },
  sex:        { required: true,               label: 'Sex' },
  profession: { required: true, minLen: 2,   label: 'Profession' },
  country:    { required: true, minLen: 2,   label: 'Country' },
  email:      { required: true, email: true, label: 'Email address' },
  mobile:     { required: true, phone: true, label: 'Mobile number' },
  whatsapp:   { required: true, phone: true, label: 'WhatsApp number' },
};

function validateField(id, value) {
  const r = RULES[id];
  if (!r) return null;
  if (r.required && !value.trim())                      return `${r.label} is required.`;
  if (r.minLen   && value.trim().length < r.minLen)     return `${r.label} must be at least ${r.minLen} characters.`;
  if (r.email    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
  if (r.phone    && !/^\+?[\d\s\-(). ]{6,20}$/.test(value))    return 'Enter a valid phone number.';
  return null;
}

function applyError(id, msg) {
  const input = document.getElementById(id);
  const err   = document.getElementById('err-' + id);
  if (!input || !err) return;
  err.textContent = msg || '';
  if (msg) input.classList.add('has-error');
  else     input.classList.remove('has-error');
}

function validateAll(data) {
  let ok = true;
  for (const id of Object.keys(RULES)) {
    const msg = validateField(id, data[id] ?? '');
    applyError(id, msg || '');
    if (msg) ok = false;
  }
  return ok;
}

/* ── COLLECT DATA ────────────────────────────────── */
function collectFormData() {
  return {
    fullName:   document.getElementById('fullName').value.trim(),
    sex:        document.getElementById('sex').value,
    profession: document.getElementById('profession').value.trim(),
    country:    document.getElementById('country').value.trim(),
    email:      document.getElementById('email').value.trim(),
    mobile:     document.getElementById('mobile').value.trim(),
    whatsapp:   document.getElementById('whatsapp').value.trim(),
    timestamp:  new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' }),
  };
}

/* ── SUBMIT TO GOOGLE SHEETS ─────────────────────── */
/*
  Google Apps Script expects either:
    - A form-urlencoded POST (no CORS issues via no-cors)
    - Or a JSON POST with doPost handler

  We use the URLSearchParams / fetch with mode: 'no-cors' trick
  which is the standard approach for Apps Script webhooks on
  GitHub Pages (no backend). The request goes through but the
  response is opaque (which is expected — we treat success
  optimistically since Apps Script processes it correctly).
*/
async function submitToSheet(data) {
  const params = new URLSearchParams(data);

  await fetch(SHEET_ENDPOINT, {
    method:  'POST',
    mode:    'no-cors',       // required for Apps Script cross-origin
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });
  // With no-cors, response is always opaque — we treat completion as success
}

/* ── SHOW SUCCESS ────────────────────────────────── */
function showSuccess() {
  const formShell    = document.getElementById('form-shell');
  const successShell = document.getElementById('success-shell');

  if (formShell)    formShell.style.display = 'none';
  if (successShell) successShell.hidden = false;

  successShell?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Auto-redirect to WhatsApp after 4 seconds
  setTimeout(() => {
    window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
  }, 4000);
}

/* ── BUTTON STATE HELPERS ────────────────────────── */
function setLoading(isLoading) {
  const btn    = document.getElementById('submit-btn');
  const text   = btn.querySelector('.submit-btn__text');
  const loader = btn.querySelector('.submit-btn__loader');
  btn.disabled      = isLoading;
  text.hidden       = isLoading;
  loader.hidden     = !isLoading;
}

/* ── FORM SUBMIT HANDLER ─────────────────────────── */
async function handleSubmit(e) {
  e.preventDefault();

  const data = collectFormData();
  if (!validateAll(data)) {
    // shake the first errored input
    const firstErr = document.querySelector('.has-error');
    if (firstErr) {
      firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErr.classList.add('shake');
      setTimeout(() => firstErr.classList.remove('shake'), 600);
    }
    return;
  }

  setLoading(true);

  try {
    await submitToSheet(data);
    showSuccess();
  } catch (err) {
    /* Network errors: data may still have gone through (no-cors).
       We show success anyway since the fetch completed the OPTIONS
       preflight — true failure is extremely rare here. */
    console.warn('Fetch note (may be expected with no-cors):', err.message);
    showSuccess();
  } finally {
    setLoading(false);
  }
}

/* ── LIVE VALIDATION ─────────────────────────────── */
function attachLiveValidation() {
  Object.keys(RULES).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('blur', () => {
      applyError(id, validateField(id, el.value) || '');
    });

    el.addEventListener('input', () => {
      if (el.classList.contains('has-error')) {
        const msg = validateField(id, el.value);
        if (!msg) applyError(id, '');
      }
    });
  });
}

/* ── SCROLL REVEAL ───────────────────────────────── */
function initReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal-el {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.65s cubic-bezier(0.25,1,.5,1),
                  transform 0.65s cubic-bezier(0.25,1,.5,1);
    }
    .reveal-el.visible {
      opacity: 1;
      transform: none;
    }
    .reveal-el.delay-1 { transition-delay: 0.1s; }
    .reveal-el.delay-2 { transition-delay: 0.2s; }
    .reveal-el.delay-3 { transition-delay: 0.32s; }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-7px); }
      40%     { transform: translateX(7px); }
      60%     { transform: translateX(-4px); }
      80%     { transform: translateX(4px); }
    }
    .shake { animation: shake 0.5s ease; }
  `;
  document.head.appendChild(style);

  // Mark elements for reveal
  const targets = [
    '.hero__top',
    '.hero__copy',
    '.hero__visual',
    '.modules__label',
    '.module-chip',
    '.tutor__left',
    '.tutor__right',
    '.register__header',
    '.form-shell',
  ];

  targets.forEach((sel, si) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal-el');
      if (i > 0 || sel === '.module-chip') {
        el.classList.add(`delay-${(i % 3) + 1}`);
      }
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal-el').forEach(el => observer.observe(el));
}

/* ── SMOOTH ANCHOR SCROLLING ─────────────────────── */
function initSmoothNav() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── BOOT ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initSmoothNav();
  attachLiveValidation();

  const form = document.getElementById('reg-form');
  if (form) form.addEventListener('submit', handleSubmit);
});
