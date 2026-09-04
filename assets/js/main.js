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

  /* Journey timeline — cascade the milestone cards into view */
  var timelineEl = document.querySelector('.timeline');
  if (timelineEl) {
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              tio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      tio.observe(timelineEl);
    } else {
      timelineEl.classList.add('is-visible');
    }

    /* Journey timeline — traveling marker follows scroll down the line,
       lighting up each milestone node as it passes */
    var tracker = timelineEl.querySelector('.timeline-tracker');
    var nodes = timelineEl.querySelectorAll('.timeline-node');
    var trackerTicking = false;

    var updateTracker = function () {
      trackerTicking = false;
      var rect = timelineEl.getBoundingClientRect();
      var anchor = window.innerHeight * 0.55;
      var progressPx = Math.max(0, Math.min(rect.height, anchor - rect.top));

      timelineEl.style.setProperty('--timeline-fill', progressPx + 'px');

      nodes.forEach(function (node) {
        var nodeRect = node.getBoundingClientRect();
        var nodeCenter = (nodeRect.top + nodeRect.height / 2) - rect.top;
        node.classList.toggle('is-lit', progressPx >= nodeCenter);
      });
    };

    var onTrackerScroll = function () {
      if (!trackerTicking) {
        window.requestAnimationFrame(updateTracker);
        trackerTicking = true;
      }
    };

    if (tracker) {
      window.addEventListener('scroll', onTrackerScroll, { passive: true });
      window.addEventListener('resize', onTrackerScroll);
      window.addEventListener('load', updateTracker);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateTracker);
      }
      updateTracker();
    }
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

  /* Hero: reveal the country list when the "14 countries" stat is clicked */
  var statToggle = document.querySelector('.stat-toggle');
  var heroCountries = document.getElementById('heroCountries');
  if (statToggle && heroCountries) {
    statToggle.addEventListener('click', function () {
      var willOpen = heroCountries.hasAttribute('hidden');
      heroCountries.toggleAttribute('hidden', !willOpen);
      statToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  }

  /* Contact form → Web3Forms (AJAX submit with inline success) */
  var cForm = document.querySelector('.contact-form');
  if (cForm) {
    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = cForm.querySelector('button[type="submit"]');
      var note = cForm.querySelector('.form-note');
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      if (note) { note.textContent = "I'll respond within 1–2 business days."; note.style.color = ''; }

      fetch(cForm.action, {
        method: 'POST',
        body: new FormData(cForm),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success) {
            cForm.innerHTML =
              '<div class="form-success"><h3>Thank you!</h3>' +
              "<p>I've received your enquiry and will respond within 1&ndash;2 business days.</p></div>";
          } else {
            throw new Error('submit failed');
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = original;
          if (note) {
            note.textContent =
              'Something went wrong — please email nishakashyap@thehumanworksco.com directly.';
            note.style.color = '#c0392b';
          }
        });
    });
  }

  /* Current year in footer */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
})();


/* =========================================================
   FAQ chatbot — "Shimona"
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
  var PHONE = '+91 91000 64700';

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
      a: 'India-based, working with founders across time zones. Nisha has led HR teams across 14 countries and for 11,000+ employees.'
    },
    {
      q: 'How do I get started?',
      a: 'Email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> or call <a href="tel:+919100064700">' + PHONE + '</a>. Tell Nisha your stage and biggest people challenge &mdash; she\'ll take it from there.'
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
