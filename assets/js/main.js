/* TheHumanWorksCo — shared site behaviour.
   Content is readable without JS; this only enhances. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isOpen = body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Active nav link ---------- */
  var current = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Motion vocabulary ----------
     One observer handles every [data-anim] element. The hero is never
     gated. Stagger groups get --i on their children. Stat figures count
     up. Everything unobserves after it fires. */
  var animEls = Array.prototype.slice.call(document.querySelectorAll('[data-anim]'))
    .filter(function (el) { return !el.closest('.hero'); });

  function fireCount(el) {
    el.querySelectorAll('.count-target').forEach(function (num) {
      var target = parseFloat(num.getAttribute('data-count'));
      if (isNaN(target)) return;
      var prefix = num.getAttribute('data-prefix') || '';
      var suffix = num.getAttribute('data-suffix') || '';
      var dur = 1100, start = null;
      function fmt(v) {
        var r = Math.round(v);
        return prefix + (r >= 1000 ? r.toLocaleString('en-US') : r) + suffix;
      }
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        num.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else num.textContent = fmt(target);
      }
      num.textContent = fmt(0);
      requestAnimationFrame(tick);
    });
  }

  if (animEls.length) {
    animEls.forEach(function (el) {
      if (el.getAttribute('data-anim') === 'stagger') {
        Array.prototype.forEach.call(el.children, function (child, i) {
          child.style.setProperty('--i', i);
        });
      }
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-in');
          if (el.getAttribute('data-anim') === 'count') fireCount(el);
          io.unobserve(el);
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
      animEls.forEach(function (el) { io.observe(el); });
    } else {
      animEls.forEach(function (el) {
        el.classList.add('is-in');
        if (el.getAttribute('data-anim') === 'count') fireCount(el);
      });
    }
  }

  /* ---------- Contact modal: open/close, focus handling ---------- */
  var contactModal = document.getElementById('contactModalOverlay');
  var contactModalClose = document.getElementById('contactModalClose');
  var contactModalOpeners = document.querySelectorAll('[data-open-contact-modal]');
  if (contactModal && contactModalOpeners.length) {
    var lastFocused = null;
    var openContactModal = function () {
      lastFocused = document.activeElement;
      contactModal.hidden = false;
      body.classList.add('modal-open');
      var firstField = contactModal.querySelector('input:not(.hp), select, textarea');
      if (firstField) firstField.focus();
    };
    var closeContactModal = function () {
      contactModal.hidden = true;
      body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };
    contactModalOpeners.forEach(function (btn) {
      btn.addEventListener('click', openContactModal);
    });
    if (contactModalClose) contactModalClose.addEventListener('click', closeContactModal);
    contactModal.addEventListener('click', function (e) {
      if (e.target === contactModal) closeContactModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !contactModal.hidden) closeContactModal();
    });
  }

  /* ---------- Contact form -> hidden iframe, inline confirmation ---------- */
  var contactForm = document.getElementById('contactForm');
  var contactFrame = document.getElementById('hidden_iframe');
  var formSuccess = document.getElementById('formSuccess');
  if (contactForm && contactFrame) {
    var submitted = false;
    contactForm.addEventListener('submit', function (e) {
      var honeypot = contactForm.querySelector('.hp');
      if (honeypot && honeypot.checked) { e.preventDefault(); return; }
      submitted = true;
      var btn = contactForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    });
    contactFrame.addEventListener('load', function () {
      if (!submitted) return;
      submitted = false;
      contactForm.hidden = true;
      if (formSuccess) {
        formSuccess.hidden = false;
        formSuccess.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }

  /* ---------- Back to top ---------- */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Brand film videos: block the casual right-click/drag
     save paths. Not real protection — anyone can still screen-record
     or pull the file from network requests — just removes the
     one-click "Save video as" affordance. ---------- */
  document.querySelectorAll('.protected-video').forEach(function (v) {
    v.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    v.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* ---------- Brand film videos: hold the last frame and offer a
     replay button instead of going blank when playback ends. ---------- */
  document.querySelectorAll('.film-stage').forEach(function (stage) {
    var video = stage.querySelector('video');
    var replay = stage.querySelector('.film-replay');
    if (!video || !replay) return;
    video.addEventListener('ended', function () {
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.1);
      }
      replay.classList.add('is-visible');
    });
    replay.addEventListener('click', function () {
      replay.classList.remove('is-visible');
      video.currentTime = 0;
      video.play();
    });
    video.addEventListener('play', function () {
      replay.classList.remove('is-visible');
    });
  });

  /* ---------- Article filters (articles.html) ---------- */
  var filterPills = Array.prototype.slice.call(document.querySelectorAll('.filter-pill'));
  var articleCards = Array.prototype.slice.call(document.querySelectorAll('.article-card'));
  var articleEmpty = document.querySelector('.article-empty');
  if (filterPills.length && articleCards.length) {
    filterPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var filter = pill.getAttribute('data-filter');
        filterPills.forEach(function (p) { p.classList.toggle('is-active', p === pill); });
        var visible = 0;
        articleCards.forEach(function (card) {
          var match = filter === 'all' || card.getAttribute('data-category') === filter;
          card.hidden = !match;
          if (match) visible++;
        });
        if (articleEmpty) { articleEmpty.hidden = visible !== 0; }
      });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
})();


/* =========================================================
   Common questions — a fixed list, not an assistant
   ========================================================= */
(function () {
  'use strict';

  var launcher = document.getElementById('chatLauncher');
  var win = document.getElementById('chatWindow');
  var closeBtn = document.getElementById('chatClose');
  var faqWrap = document.getElementById('chatFaqs');
  var chatBody = document.getElementById('chatBody');
  if (!launcher || !win || !closeBtn || !faqWrap || !chatBody) { return; }

  var EMAIL = 'nishakashyap@thehumanworksco.com';
  var WHATSAPP = 'https://wa.me/918019229111';

  var QAS = [
    {
      q: 'What exactly do you do?',
      a: 'People strategy consulting for founders and GCC leaders &mdash; the decisions that compound: hiring, how you organise, who leads, and the systems underneath. Nisha brings 25 years leading People at Infosys, Genpact, Wipro, Wipro Digital and Designit, including an integration across 14 countries. Some engagements are ongoing and embedded; most are scoped projects.'
    },
    {
      q: 'How is this different from an HR consultant?',
      a: 'A consultant produces a report and leaves. Nisha builds the systems, runs the hard conversations and coaches your managers, working inside your team.'
    },
    {
      q: 'How does an engagement start?',
      a: 'A 30-minute discovery call, then a fixed-fee <strong>People Audit</strong>: two to three weeks of interviews and a systems review ending in a written diagnosis, a prioritised plan and the costs.'
    },
    {
      q: 'Who do you work with?',
      a: 'Founders, CEOs and leadership teams at Pre-Seed to Series B startups and growing SMEs, plus global companies establishing or scaling teams in India.'
    },
    {
      q: 'I’m building a GCC in India',
      a: 'Nisha helps global companies stand up and scale India teams &mdash; operating model, hiring sequence, leadership bench, compliance and culture &mdash; so the centre performs like the rest of the business.'
    },
    {
      q: 'How much does it cost?',
      a: 'Every engagement is bespoke. The People Audit is a fixed fee; ongoing work is a monthly retainer, scoped to what you need. You have the numbers before anything starts &mdash; email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> with where you are.'
    },
    {
      q: 'How do I get started?',
      a: 'Use the form on the site, email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>, or message on <a href="' + WHATSAPP + '" target="_blank" rel="noopener">WhatsApp</a>. Nisha replies within one business day.'
    }
  ];

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addMsg(html, who) {
    var row = document.createElement('div');
    row.className = 'chat-msg ' + who;
    var p = document.createElement('p');
    p.innerHTML = html;
    row.appendChild(p);
    chatBody.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function ask(item) {
    addMsg(item.q, 'user');
    if (reduce) { addMsg(item.a, 'bot'); }
    else { window.setTimeout(function () { addMsg(item.a, 'bot'); }, 240); }
  }

  QAS.forEach(function (item) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-faq';
    b.textContent = item.q;
    b.addEventListener('click', function () { ask(item); });
    faqWrap.appendChild(b);
  });

  function setOpen(open) {
    win.hidden = !open;
    launcher.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    launcher.setAttribute('aria-label', open ? 'Close' : 'Common questions');
    if (open) { closeBtn.focus(); }
  }

  launcher.addEventListener('click', function () { setOpen(win.hidden); });
  closeBtn.addEventListener('click', function () { setOpen(false); launcher.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !win.hidden) { setOpen(false); launcher.focus(); }
  });
})();


/* ---------- Hero headline: typed in, with a caret and key sounds ----------
   The full sentence stays in the DOM (and in aria-label), so search engines,
   screen readers and no-JS visitors get the plain heading. Browsers block
   audio until the visitor interacts, so key sounds start after the first tap
   or click, and the "Replay with sound" button plays the whole thing. */
(function () {
  'use strict';
  var h1 = document.querySelector('h1[data-type]');
  if (!h1) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());

  // wrap every visible character, keeping the .ln / .hl structure intact
  var chars = [];
  (function wrap(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        if (!n.parentNode.classList || n.parentNode === h1) return;   // spaces between lines
        var frag = document.createDocumentFragment();
        n.textContent.split('').forEach(function (c) {
          var sp = document.createElement('span');
          sp.className = 'ch';
          sp.textContent = c;
          frag.appendChild(sp);
          chars.push(sp);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        wrap(n);
      }
    });
  })(h1);

  var hl = h1.querySelector('.hl');
  var caret = document.createElement('span');
  caret.className = 'type-caret';
  caret.setAttribute('aria-hidden', 'true');

  // ---- sound: a short synthesised key click, no audio files ----
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, noise = null;
  function audio() {
    if (!AC) return null;
    if (!actx) {
      actx = new AC();
      noise = actx.createBuffer(1, Math.floor(actx.sampleRate * 0.06), actx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    }
    return actx;
  }
  function key(isSpace) {
    var a = actx;
    if (!a || a.state !== 'running') return;
    var t = a.currentTime;
    var src = a.createBufferSource(); src.buffer = noise;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = isSpace ? 900 : 1700 + Math.random() * 1500; bp.Q.value = 0.9;
    var g = a.createGain();
    g.gain.setValueAtTime(isSpace ? 0.22 : 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(bp); bp.connect(g); g.connect(a.destination);
    src.start(t); src.stop(t + 0.06);
    var o = a.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(isSpace ? 120 : 170 + Math.random() * 50, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.04);
    var g2 = a.createGain();
    g2.gain.setValueAtTime(0.07, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g2); g2.connect(a.destination);
    o.start(t); o.stop(t + 0.06);
  }
  function unlock() {
    var a = audio();
    if (a && a.state === 'suspended') a.resume();
  }
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  // ---- typing ----
  var timer = null, running = false;
  function paintHighlight(ch) {
    if (!hl) return;
    if (!ch || !hl.contains(ch)) return;
    var w = ch.getBoundingClientRect().right - hl.getBoundingClientRect().left;
    hl.style.backgroundSize = Math.max(0, w) + 'px 82%';
  }
  function finish() {
    running = false;
    h1.classList.remove('is-typing');
    if (hl) { hl.style.backgroundSize = ''; hl.style.transition = ''; }
    if (btn) { btn.disabled = false; btn.hidden = false; }
    setTimeout(function () { caret.classList.add('is-done'); }, 3200);
  }
  function type(delay) {
    clearTimeout(timer);
    running = true;
    chars.forEach(function (c) { c.classList.remove('on'); });
    caret.classList.remove('is-done');
    h1.classList.add('is-typing');
    if (hl) { hl.style.transition = 'none'; hl.style.backgroundSize = '0px 82%'; }
    if (btn) btn.disabled = true;
    var i = 0;
    var first = chars[0];
    first.parentNode.insertBefore(caret, first);
    function step() {
      if (i >= chars.length) { finish(); return; }
      var c = chars[i];
      c.classList.add('on');
      c.parentNode.insertBefore(caret, c.nextSibling);
      paintHighlight(c);
      var isSpace = c.textContent === ' ';
      key(isSpace);
      i++;
      var next = chars[i];
      var lineBreak = next && next.closest('.ln') !== c.closest('.ln');
      var wait = lineBreak ? 380 : isSpace ? 110 : 55 + Math.random() * 45;
      timer = setTimeout(step, wait);
    }
    timer = setTimeout(step, delay);
  }

  // ---- "Replay with sound" ----
  var btn = null;
  var eyebrow = h1.parentNode.querySelector('.eyebrow');
  if (eyebrow && AC) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'type-replay';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>Replay with sound';
    btn.hidden = true;   // nothing to "replay" until the first pass finishes
    btn.addEventListener('click', function () {
      unlock();
      type(150);
    });
    eyebrow.parentNode.insertBefore(btn, eyebrow.nextSibling);
  }

  type(550);
})();
