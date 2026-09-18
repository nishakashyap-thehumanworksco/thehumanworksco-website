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
