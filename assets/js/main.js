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

  /* Contact form -> Google Form (hidden iframe), swap in a thank-you message */
  var contactForm = document.getElementById('contactForm');
  var contactFrame = document.getElementById('hidden_iframe');
  var formSuccess = document.getElementById('formSuccess');
  if (contactForm && contactFrame) {
    var contactSubmitted = false;
    contactForm.addEventListener('submit', function (e) {
      var honeypot = contactForm.querySelector('.hp');
      if (honeypot && honeypot.checked) {
        e.preventDefault();
        return;
      }
      contactSubmitted = true;
      var btn = contactForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    });
    contactFrame.addEventListener('load', function () {
      if (!contactSubmitted) return;
      contactSubmitted = false;
      contactForm.hidden = true;
      if (formSuccess) formSuccess.hidden = false;
      formSuccess && formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
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
      q: "I'm hiring my first team",
      a: 'This is where most founders lose time. I set up a repeatable hiring system &mdash; scorecards, interview structure, offers and onboarding &mdash; plus the contracts and policies you need in place. You hire faster and avoid an early mis-hire. The <strong>People Foundation</strong> package covers exactly this.'
    },
    {
      q: "We're scaling quickly",
      a: 'Fast growth breaks the informal way things worked at 10 people. I build the layer that holds &mdash; manager capability, performance rhythm, org design and pay structure &mdash; so headcount goes up without the culture and delivery dipping. That\'s the <strong>Scale Your People Function</strong> package.'
    },
    {
      q: 'We need better managers',
      a: 'First-time managers rarely get taught how to manage. I coach yours on the hard conversations, set up a light performance and feedback rhythm, and give them a simple playbook. Managers get more confident, and fewer people issues reach your desk.'
    },
    {
      q: "I'm building a GCC",
      a: 'I help global companies stand up and scale teams in India &mdash; hiring plan, org structure, compliance, comp benchmarking and culture &mdash; so your India centre performs like the rest of the business, not a back office. See <strong>GCC People Advisory</strong>.'
    },
    {
      q: 'Where should I start?',
      a: 'Book a free 30-minute strategy session. Tell Nisha your stage and biggest people challenge, and you\'ll leave with two or three practical moves &mdash; whether or not you work together. Book at <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> or call <a href="tel:+919100064700">' + PHONE + '</a>.'
    },
    {
      q: 'What is a Fractional Head of People?',
      a: 'An experienced people leader &mdash; the judgement of a full-time Head of People or Chief People Officer &mdash; working with you a few focused days a month, at a fraction of the cost. Nisha brings 25+ years leading People across 14 countries.'
    },
    {
      q: 'How much does it cost?',
      a: 'It depends on the days per month you need. Most founders start small on a rolling monthly retainer and scale as they hire. Email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a> with where you are and where you\'re headed for a clear number.'
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
