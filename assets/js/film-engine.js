/* TheHumanWorksCo — "The People Engine" brand film.
   A 28-second canvas-drawn loop: hand-authored, no video file, no
   stock footage. Homepage only — see index.html. Pauses off-screen
   and respects prefers-reduced-motion. */
(function () {
  'use strict';
  var canvas = document.getElementById('peopleEngineFilm');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 1920, H = 1080, DUR = 28;
  var C = { black: '#0D0D0D', yel: '#FFC10E', ink: '#7A5A00', off: '#FAFAF7', sand: '#EFEBE0',
            g7: '#4A4A4A', g5: '#767676', soft: '#B9B9B2', dim: '#8C8C86', rule: '#2E2E2B' };
  var DISPLAY = '"Archivo Expanded", "Archivo", "Helvetica Neue", Arial, sans-serif';
  var BODY = '"Archivo", "Helvetica Neue", Arial, sans-serif';

  function clamp(v, a, b) { if (a === undefined) a = 0; if (b === undefined) b = 1; return Math.min(b, Math.max(a, v)); }
  function prog(t, s, d) { return clamp((t - s) / d); }
  function eOut(x) { return 1 - Math.pow(1 - x, 3); }
  function eInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  // ---------- drawing primitives ----------
  function person(x, y, s, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y - s * .55, s * .32, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y + s * .55, s * .55, Math.PI, 0); ctx.closePath(); ctx.fill();
  }

  function line(txt, x, y, size, weight, family, color, t0, t, spacing) {
    if (!spacing) spacing = 0;
    ctx.save();
    ctx.font = weight + ' ' + size + 'px ' + family;
    ctx.letterSpacing = spacing + 'px';
    var w = ctx.measureText(txt).width;
    var k = eOut(prog(t, t0, .7));
    if (k > 0) {
      ctx.beginPath(); ctx.rect(x - 24, y - size * 1.08, w + 48, size * 1.36); ctx.clip();
      ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(txt, x, y + (1 - k) * size * 1.3);
    }
    ctx.restore();
    return w;
  }
  function measure(txt, size, weight, family) {
    ctx.save(); ctx.font = weight + ' ' + size + 'px ' + family; ctx.letterSpacing = '0px';
    var w = ctx.measureText(txt).width; ctx.restore(); return w;
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function chip(txt, x, y, sc, bgc, fg, shadow) {
    ctx.save();
    ctx.font = '700 28px ' + BODY;
    var w = ctx.measureText(txt).width + 44, h = 60;
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc);
    ctx.fillStyle = shadow; rrect(-w / 2 + 6, -h / 2 + 6, w, h, 6); ctx.fill();
    ctx.fillStyle = bgc; rrect(-w / 2, -h / 2, w, h, 6); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 2);
    ctx.restore();
    return w;
  }

  function tag(txt, x, y, rot, sc) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.font = '600 26px ' + BODY;
    var w = ctx.measureText(txt).width + 40, h = 52;
    ctx.fillStyle = C.black; rrect(-w / 2 + 5, -h / 2 + 5, w, h, 6); ctx.fill();
    ctx.fillStyle = C.off; rrect(-w / 2, -h / 2, w, h, 6); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.black; ctx.stroke();
    ctx.fillStyle = C.black; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 2);
    ctx.restore();
  }

  function gearPath(R, teeth) {
    var depth = R * .14, r0 = R - depth, step = Math.PI * 2 / teeth;
    ctx.beginPath();
    for (var i = 0; i < teeth; i++) {
      var a = i * step;
      var pts = [[r0, a], [R, a + step * .12], [R, a + step * .45], [r0, a + step * .57]];
      for (var j = 0; j < pts.length; j++) {
        var rad = pts[j][0], aa = pts[j][1];
        var px = Math.cos(aa) * rad, py = Math.sin(aa) * rad;
        (i === 0 && j === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }

  function elbow(x1, y1, x2, y2, k) {
    if (k <= 0) return;
    var my = (y1 + y2) / 2;
    var segs = [[x1, y1, x1, my], [x1, my, x2, my], [x2, my, x2, y2]];
    var lens = segs.map(function (s) { return Math.hypot(s[2] - s[0], s[3] - s[1]); });
    var left = k * lens.reduce(function (a, b) { return a + b; }, 0);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    segs.forEach(function (s, i) {
      if (left <= 0) return;
      var f = Math.min(1, left / (lens[i] || 1));
      ctx.lineTo(lerp(s[0], s[2], f), lerp(s[1], s[3], f));
      left -= lens[i];
    });
    ctx.stroke();
  }

  function bg(color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }

  // ---------- scene 1: problems land on the founder ----------
  var r1 = rng(7);
  var crowd = [];
  while (crowd.length < 40) {
    var x = 980 + r1() * 860, y = 190 + r1() * 780;
    if (Math.hypot(x - 1400, y - 560) < 250) continue;
    if (Math.abs(x - 1400) < 140 && y > 700 && y < 800) continue;
    crowd.push({ x: x, y: y, p: r1() * 6.28, d: r1() * .8 });
  }
  var issues = ['Hiring', 'Compliance', 'Managers', 'Culture', 'Investors', 'Contracts', 'Onboarding', 'Attrition']
    .map(function (txt, i) { return { txt: txt, from: crowd[(i * 5 + 3) % crowd.length], dx: (r1() - .5) * 130, rot: (r1() - .5) * .3 }; });

  function s1(t) {
    bg(C.off);
    crowd.forEach(function (c, i) {
      var k = eBack(prog(t, c.d, .5));
      if (k <= 0) return;
      var jx = Math.sin(t * 2.2 + c.p) * 9, jy = Math.cos(t * 1.7 + c.p) * 7;
      ctx.save(); ctx.translate(c.x + jx, c.y + jy); ctx.scale(k, k);
      person(0, 0, 28, i % 6 === 0 ? C.g7 : C.soft); ctx.restore();
    });

    var load = prog(t, 3.6, 1.4);
    var shake = Math.sin(t * 42) * 5 * load;
    var fk = eBack(prog(t, .2, .6));
    if (fk > 0) {
      ctx.save(); ctx.translate(1400 + shake, 590 + load * 12); ctx.scale(fk, fk);
      person(0, 0, 110, C.black); ctx.restore();
      line('FOUNDER', 1400 - measure('FOUNDER', 22, 700, BODY) / 2 - 12, 770, 22, 700, BODY, C.g7, .6, t, 6);
    }

    issues.forEach(function (it, i) {
      var st = 1.0 + i * .35;
      var k = eInOut(prog(t, st, .9));
      if (t < st) return;
      var tx = 1400 + it.dx * .6 + shake, ty = 480 - i * 50 + load * 12;
      var x = lerp(it.from.x, tx, k), y = lerp(it.from.y, ty, k) - Math.sin(k * Math.PI) * 120;
      tag(it.txt, x, y, it.rot * k, lerp(.35, 1, k));
    });

    line('SOUND FAMILIAR?', 120, 280, 26, 700, BODY, C.ink, 0, t, 4);
    line('Every people', 120, 400, 80, 800, DISPLAY, C.black, .3, t);
    line('problem lands', 120, 500, 80, 800, DISPLAY, C.black, .45, t);
    var onW = measure('on ', 80, 800, DISPLAY);
    var youW = measure('you.', 80, 800, DISPLAY);
    var hk = eOut(prog(t, 1.5, .5));
    if (hk > 0) { ctx.fillStyle = C.yel; ctx.fillRect(120 + onW - 10, 600 - 74, (youW + 20) * hk, 94); }
    line('on', 120, 600, 80, 800, DISPLAY, C.black, .6, t);
    line('you.', 120 + onW, 600, 80, 800, DISPLAY, C.black, .6, t);
    line("You know HR matters, but you're not", 120, 710, 32, 400, BODY, C.g7, 1.2, t);
    line('ready for a full-time Head of People.', 120, 754, 32, 400, BODY, C.g7, 1.3, t);
  }

  // ---------- scene 2: the org takes shape ----------
  var r2 = rng(21);
  var org = [{ x: 1400, y: 250, s: 60, c: C.yel, lvl: 0 }];
  [1150, 1400, 1650].forEach(function (x) {
    org.push({ x: x, y: 510, s: 44, c: C.off, lvl: 1, parent: 0 });
  });
  [1, 2, 3].forEach(function (p) {
    [-92, 0, 92].forEach(function (dx) { org.push({ x: org[p].x + dx, y: 770, s: 32, c: C.dim, lvl: 2, parent: p }); });
  });
  org.forEach(function (n, i) { n.sx = 1000 + r2() * 840; n.sy = 150 + r2() * 800; n.d = i * .05; });

  function s2(u) {
    bg(C.black);
    var pos = org.map(function (n) {
      var k = eInOut(prog(u, .3 + n.d, 1.5));
      return { x: lerp(n.sx, n.x, k) + Math.sin(u * 2 + n.sy) * 8 * (1 - k), y: lerp(n.sy, n.y, k) };
    });

    ctx.strokeStyle = '#5A5A55'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    org.forEach(function (n) {
      if (n.parent === undefined) return;
      var p = org[n.parent];
      elbow(p.x, p.y + p.s * 1.1 + 10, n.x, n.y - p.s * .9 - 8, eOut(prog(u, 1.9 + n.lvl * .35, .6)));
    });

    var ring = prog(u, 3.7, 1.1);
    if (ring > 0 && ring < 1) {
      ctx.strokeStyle = 'rgba(255,193,14,' + (1 - ring) + ')'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(1400, 250 - 10, 70 + ring * 90, 0, Math.PI * 2); ctx.stroke();
    }
    org.forEach(function (n, i) {
      var k = eBack(prog(u, n.d * .6, .5));
      if (k <= 0) return;
      ctx.save(); ctx.translate(pos[i].x, pos[i].y); ctx.scale(k, k); person(0, 0, n.s, n.c); ctx.restore();
    });

    line('THE MODEL', 120, 240, 26, 700, BODY, C.yel, .1, u, 4);
    line('Senior people', 120, 350, 80, 800, DISPLAY, C.off, .2, u);
    line('leadership.', 120, 450, 80, 800, DISPLAY, C.off, .35, u);
    line('Sized to your', 120, 570, 80, 800, DISPLAY, C.yel, .9, u);
    line('stage.', 120, 670, 80, 800, DISPLAY, C.yel, 1.05, u);
    line('An experienced Head of People in the room for', 120, 770, 32, 400, BODY, C.soft, 1.6, u);
    line('the decisions that are expensive to get wrong.', 120, 814, 32, 400, BODY, C.soft, 1.7, u);

    var cx = 120;
    [['Who you hire', 2.8], ['How you organise', 3.2], ['Who leads', 3.6]].forEach(function (pair) {
      var txt = pair[0], st = pair[1];
      var k = eBack(prog(u, st, .45));
      var w = measure(txt, 28, 700, BODY) + 44;
      if (k > 0) chip(txt, cx, 872, k, C.yel, C.black, C.off);
      cx += w + 22;
    });
  }

  // ---------- scene 3: the engine ----------
  var r3 = rng(99);
  var inflow = [];
  for (var ii = 0; ii < 24; ii++) {
    inflow.push({ x: 80 + r3() * 200, y: 520 + r3() * 360, st: .8 + ii * .16 });
  }
  var gears = [
    { x: 470, y: 700, R: 150, n: 10, dir: 1, speed: .9, gear: C.yel, disk: C.off, text: C.black, stroke: C.black, label: ['Discovery', 'call'], cap: '30 minutes', st: .3 },
    { x: 765, y: 650, R: 170, n: 12, dir: -1, speed: .75, gear: C.black, disk: C.black, text: C.yel, stroke: C.black, label: ['People', 'Audit'], cap: '2–3 weeks', st: .5 },
    { x: 1058, y: 705, R: 150, n: 10, dir: 1, speed: .9, gear: C.off, disk: C.yel, text: C.black, stroke: C.black, label: ['Build &', 'embed'], cap: 'A few days a month', st: .7 }
  ];

  function s3(u) {
    bg(C.sand);
    inflow.forEach(function (p) {
      var k = prog(u, p.st, .9);
      if (k <= 0 || k >= 1) return;
      var e = eInOut(k);
      ctx.globalAlpha = 1 - clamp((k - .7) / .3);
      person(lerp(p.x, gears[0].x, e), lerp(p.y, gears[0].y, e), lerp(26, 10, e), C.g5);
      ctx.globalAlpha = 1;
    });

    gears.forEach(function (g, i) {
      var k = eBack(prog(u, g.st, .6));
      if (k <= 0) return;
      ctx.save(); ctx.translate(g.x, g.y); ctx.scale(k, k);
      ctx.save(); ctx.rotate(g.dir * u * g.speed + i * .16);
      gearPath(g.R, g.n); ctx.fillStyle = g.gear; ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = g.stroke; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, g.R * .62, 0, Math.PI * 2); ctx.fillStyle = g.disk; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = i === 1 ? C.yel : C.black; ctx.stroke();
      ctx.fillStyle = g.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 20px ' + BODY; ctx.fillText(String(i + 1), 0, -42);
      ctx.font = '700 28px ' + BODY; ctx.fillText(g.label[0], 0, -6); ctx.fillText(g.label[1], 0, 28);
      ctx.restore();
      var cw = measure(g.cap, 24, 600, BODY);
      line(g.cap, g.x - cw / 2, g.y + g.R + 54, 24, 600, BODY, C.g7, g.st + .4, u);
    });

    line('HOW I WORK', 120, 200, 26, 700, BODY, C.ink, .1, u, 4);
    line('From first conversation', 120, 290, 64, 800, DISPLAY, C.black, .2, u);
    line('to running systems.', 120, 375, 64, 800, DISPLAY, C.black, .35, u);

    line('HIRING · MANAGERS · COMPLIANCE · CULTURE', 1380, 470, 20, 700, BODY, C.g7, 1.4, u, 3);
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 6; c++) {
        var i2 = r * 6 + c;
        var k2 = eBack(prog(u, 1.6 + i2 * .11, .35));
        if (k2 <= 0) continue;
        var x2 = 1420 + c * 80, y2 = 560 + r * 96;
        ctx.save(); ctx.translate(x2, y2); ctx.scale(k2, k2);
        person(0, 0, 30, C.black);
        ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, -16.5, 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }

  // ---------- scene 4: track record ----------
  var stats = [
    { pre: '', v: 25, suf: '+', label: 'Years leading People functions', x: 120, y: 540, st: .6 },
    { pre: '', v: 14, suf: '', label: 'Countries HR led across', x: 1010, y: 540, st: .8 },
    { pre: '', v: 11000, suf: '+', label: 'Employees supported', x: 120, y: 860, st: 1.0 },
    { pre: '$', v: 5, suf: 'M', label: 'HR cost savings delivered', x: 1010, y: 860, st: 1.2 }
  ];
  function s4(u) {
    bg(C.black);
    ctx.fillStyle = C.rule;
    ctx.fillRect(960, 400, 3, 560 * eOut(prog(u, .5, 1)));
    ctx.fillRect(120, 700, 1680 * eOut(prog(u, .5, 1)), 3);

    line('TWENTY-FIVE YEARS IN PEOPLE', 120, 210, 26, 700, BODY, C.yel, .1, u, 4);
    line('Built at Infosys, Genpact, Wipro & Designit.', 120, 300, 50, 700, DISPLAY, C.off, .25, u);

    stats.forEach(function (s) {
      var k = eOut(prog(u, s.st, 1.5));
      var n = Math.round(s.v * k).toLocaleString('en-US');
      line(s.pre + n + s.suf, s.x, s.y, 130, 800, DISPLAY, C.yel, s.st, u);
      line(s.label, s.x, s.y + 64, 32, 500, BODY, C.soft, s.st + .2, u);
    });
  }

  // ---------- scene 5: the promise ----------
  function s5(u) {
    bg(C.yel);
    var gk = eBack(prog(u, 1.0, .8));
    if (gk > 0) {
      ctx.save(); ctx.translate(1720, 470); ctx.scale(gk, gk);
      ctx.save(); ctx.rotate(u * .25);
      gearPath(330, 16); ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.black; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, 182, 0, Math.PI * 2); ctx.fillStyle = C.black; ctx.fill();
      ctx.save(); ctx.clip(); person(0, 40, 200, C.off); ctx.restore();
      ctx.restore();
    }

    line('You build', 120, 350, 110, 800, DISPLAY, C.black, .1, u);
    line('the company.', 120, 470, 110, 800, DISPLAY, C.black, .25, u);
    var bw = measure('people engine.', 110, 800, DISPLAY);
    var bk = eOut(prog(u, 1.5, .55));
    if (bk > 0) {
      ctx.fillStyle = C.black; ctx.fillRect(120 - 22 + 10, 740 - 96 + 10, (bw + 44) * bk, 132);
      ctx.fillStyle = C.off; ctx.fillRect(120 - 22, 740 - 96, (bw + 44) * bk, 132);
      ctx.strokeStyle = C.black; ctx.lineWidth = 4; ctx.strokeRect(120 - 22, 740 - 96, (bw + 44) * bk, 132);
    }
    line("I'll build the", 120, 620, 110, 800, DISPLAY, C.black, .7, u);
    line('people engine.', 120, 740, 110, 800, DISPLAY, C.black, .85, u);

    line('TheHumanWorksCo', 120, 965, 40, 800, DISPLAY, C.black, 1.9, u);
    line('Independent People Advisory', 120, 1008, 26, 500, BODY, C.black, 2.0, u);

    var ck = eBack(prog(u, 2.2, .5));
    if (ck > 0) {
      var press = Math.sin(prog(u, 3.55, .3) * Math.PI);
      var bwid = 520, bh = 84, bx = 1800 - bwid, by = 925;
      ctx.save(); ctx.translate(bx + bwid / 2 + press * 7, by + bh / 2 + press * 7); ctx.scale(ck, ck);
      ctx.fillStyle = C.black; rrect(-bwid / 2 + 8 * (1 - press), -bh / 2 + 8 * (1 - press), bwid, bh, 999); ctx.fill();
      ctx.fillStyle = C.off; rrect(-bwid / 2, -bh / 2, bwid, bh, 999); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = C.black; ctx.stroke();
      ctx.fillStyle = C.black; ctx.font = '700 32px ' + BODY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Book a discovery call  →', 0, 2);
      ctx.restore();

      var pk = eInOut(prog(u, 2.8, .7));
      if (pk > 0) {
        var px = lerp(1560, 1640, pk), py = lerp(1120, 985, pk);
        ctx.save(); ctx.translate(px + press * 4, py + press * 4);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(21, 55);
        ctx.lineTo(29, 51); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath();
        ctx.fillStyle = C.black; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.off; ctx.stroke();
        ctx.restore();
      }
    }
  }

  function wipeH(k, color, edge, dir) {
    if (k <= 0 || k >= 1) return;
    var e = eInOut(k), x = dir > 0 ? lerp(-W - 16, W + 16, e) : lerp(W + 16, -W - 16, e);
    ctx.fillStyle = edge; ctx.fillRect(x - 16, 0, W + 32, H);
    ctx.fillStyle = color; ctx.fillRect(x, 0, W, H);
  }
  function wipeV(k, color, edge) {
    if (k <= 0 || k >= 1) return;
    var y = lerp(H + 16, -H - 16, eInOut(k));
    ctx.fillStyle = edge; ctx.fillRect(0, y - 16, W, H + 32);
    ctx.fillStyle = color; ctx.fillRect(0, y, W, H);
  }

  function render(t) {
    if (t < 5.35) s1(t);
    else if (t < 11.45) s2(t - 5.35);
    else if (t < 17.55) s3(t - 11.45);
    else if (t < 22.8) s4(t - 17.55);
    else s5(t - 22.8);

    wipeH(prog(t, 5.0, .7), C.yel, C.black, 1);
    wipeV(prog(t, 11.1, .7), C.sand, C.black);
    wipeH(prog(t, 17.2, .7), C.black, C.yel, -1);
    var ck = prog(t, 22.0, .8);
    if (ck > 0 && ck < 1) {
      ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(W / 2, H / 2, eInOut(ck) * 1150, 0, Math.PI * 2); ctx.fill();
    }
    var fade = prog(t, 27.35, .65);
    if (fade > 0) { ctx.globalAlpha = fade; bg(C.off); ctx.globalAlpha = 1; }
  }

  // ---------- player: play/pause only, pauses off-screen ----------
  var toggle = document.getElementById('filmToggle');
  var iconPause = document.getElementById('filmIconPause');
  var iconPlay = document.getElementById('filmIconPlay');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var userPaused = reduce;
  var inView = true;
  var cur = reduce ? 26.5 : 0;
  var start = performance.now();

  function isPlaying() { return inView && !userPaused; }
  function syncButton() {
    var playing = isPlaying();
    // .hidden doesn't reliably map to display:none on inline <svg> across
    // browsers, so toggle a class instead.
    if (iconPause) iconPause.classList.toggle('film-icon-hidden', !playing);
    if (iconPlay) iconPlay.classList.toggle('film-icon-hidden', playing);
    if (toggle) toggle.setAttribute('aria-label', playing ? 'Pause film' : 'Play film');
  }
  function resumeClock() { start = performance.now() - cur * 1000; }

  if (toggle) {
    toggle.addEventListener('click', function () {
      userPaused = !userPaused;
      if (isPlaying()) resumeClock();
      syncButton();
    });
  }
  syncButton();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var was = isPlaying();
        inView = entry.isIntersecting;
        if (isPlaying() && !was) resumeClock();
        syncButton();
      });
    }, { threshold: 0.15 });
    io.observe(canvas);
  }

  function tick(now) {
    if (isPlaying()) {
      cur = (now - start) / 1000;
      if (cur >= DUR) { cur %= DUR; start = now - cur * 1000; }
    }
    render(cur);
    requestAnimationFrame(tick);
  }

  var fontSpecs = ['800 80px "Archivo Expanded"', '700 50px "Archivo Expanded"', '400 32px Archivo', '500 32px Archivo', '600 26px Archivo', '700 28px Archivo'];
  var fontLoads = fontSpecs.map(function (f) {
    return document.fonts.load(f).catch(function () { return null; });
  });
  render(cur);
  Promise.race([Promise.all(fontLoads), new Promise(function (r) { setTimeout(r, 2500); })]).then(function () {
    render(cur);
    requestAnimationFrame(tick);
  });
})();
