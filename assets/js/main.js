/* TheHumanWorksCo — shared site behavior (nav toggle, active link, reveal, back-to-top) */
(function () {
  'use strict';

  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var body = document.body;
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

  /* Active nav link based on current page */
  var current = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* Scroll-reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Back to top */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Current year in footer */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
})();


/* =========================================================
   FAQ chatbot — "Wren"
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
  var PHONE = '+44 7971 511601';

  var FAQS = [
    {
      q: 'What does TheHumanWorksCo do?',
      a: "We're a fractional People &amp; Culture function for early-stage startups. Nisha Kashyap plugs in as your Head of People &mdash; covering HR strategy, operations, culture, hiring and AI-powered HR systems &mdash; without the cost of a full-time senior hire."
    },
    {
      q: 'What is "fractional HR"?',
      a: 'Senior HR leadership on a part-time or project basis. You get 25+ years of global People experience for a few days a month (or a fixed-scope project), scaling up or down as your needs change.'
    },
    {
      q: 'Who do you work with?',
      a: 'Founders and leadership teams at pre-seed to Series B startups &mdash; usually from your first hires up to around 150 people.'
    },
    {
      q: 'What can you help me with?',
      a: 'Six areas: HR leadership, people operations setup (onboarding, HRIS, policies, payroll), AI-powered HR systems, culture &amp; people experience, hiring &amp; talent support, and one-off projects like compliance audits, restructures or M&amp;A integration.'
    },
    {
      q: 'How does an engagement work?',
      a: 'Five steps: Immerse (learn your goals) &rarr; Diagnose (assess strengths and gaps) &rarr; Build (lean systems) &rarr; Embed (operate as part of the team) &rarr; Enable (foundations to scale). Engagements run as ongoing retainers or fixed-scope projects.'
    },
    {
      q: 'Are you a recruitment agency?',
      a: 'No. On hiring we act as a strategic partner &mdash; role scoping, interview process design, competency frameworks, founder interview coaching and offer strategy &mdash; so you hire right and avoid expensive misfires.'
    },
    {
      q: 'How much does it cost?',
      a: 'It depends on scope and time commitment. Email Nisha at <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> with where you are and where you\'re headed, and you\'ll get a clear recommendation and quote.'
    },
    {
      q: 'Where are you based?',
      a: 'UK-based, working remotely with founders across time zones. Nisha has led HR across 14 countries and for teams of 11,000+.'
    },
    {
      q: 'How do I get started?',
      a: 'Email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> or call <a href="tel:+447971511601">' + PHONE + '</a>. Tell Nisha your stage and biggest people challenge &mdash; she\'ll take it from there.'
    }
  ];

  var prefersReduced = window.matchMedia &&
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

  function askFaq(item) {
    addMsg(item.q, 'user');
    if (prefersReduced) {
      addMsg(item.a, 'bot');
    } else {
      window.setTimeout(function () { addMsg(item.a, 'bot'); }, 260);
    }
  }

  FAQS.forEach(function (item) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-faq';
    b.textContent = item.q;
    b.addEventListener('click', function () { askFaq(item); });
    faqWrap.appendChild(b);
  });

  function setOpen(open) {
    win.hidden = !open;
    launcher.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    launcher.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
    if (open) { closeBtn.focus(); }
  }

  launcher.addEventListener('click', function () { setOpen(win.hidden); });
  closeBtn.addEventListener('click', function () { setOpen(false); launcher.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !win.hidden) { setOpen(false); launcher.focus(); }
  });

  if (location.hash === '#chat') { setOpen(true); }
})();
