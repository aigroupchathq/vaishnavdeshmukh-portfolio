/* Datum instrument dial.
   Canvas rendering adapted from the Datum instrument-cluster study.
   This build carries the dial and hold-to-rev control only. */
(function () {
  'use strict';

    var TAU = Math.PI * 2;
    var d2r = function (d) { return d * Math.PI / 180; };
    var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    function pad2(n) {
      n = Math.floor(n) % 100;
      return (n < 10 ? '0' : '') + n;
    }

    function roundRect(ctx, x, y, w, h, r) {
      var rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      ctx.lineTo(x + w, y + h - rr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      ctx.lineTo(x + rr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
      ctx.closePath();
    }

    // letter-spaced centred text, drawn char by char (no reliance on ctx.letterSpacing)
    function spaced(ctx, text, x, y, sp) {
      var chars = String(text).split('');
      var widths = [], total = 0, i;
      for (i = 0; i < chars.length; i++) {
        var w = ctx.measureText(chars[i]).width;
        widths.push(w); total += w;
      }
      total += sp * (chars.length - 1);
      var cx = x - total / 2;
      var prev = ctx.textAlign;
      ctx.textAlign = 'left';
      for (i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], cx, y);
        cx += widths[i] + sp;
      }
      ctx.textAlign = prev;
    }

    // text laid along a circle, one glyph per step, reading clockwise.
    // starts at startA (radians, 0 = 3 o'clock, -PI/2 = 12 o'clock).
    function ringText(ctx, text, cx, cy, radius, startA, size, tracking, color, stack) {
      if (!text) return startA;
      ctx.save();
      ctx.font = '400 ' + size.toFixed(1) + 'px ' + (stack || '"Segoe UI", system-ui, sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      var a = startA;
      for (var i = 0; i < text.length; i++) {
        var w = ctx.measureText(text.charAt(i)).width + tracking;
        var da = w / Math.max(1, radius);
        var mid = a + da / 2;
        ctx.save();
        ctx.translate(cx + Math.cos(mid) * radius, cy + Math.sin(mid) * radius);
        ctx.rotate(mid + Math.PI / 2);
        ctx.fillText(text.charAt(i), 0, 0);
        ctx.restore();
        a += da;
      }
      ctx.restore();
      return a;
    }

    var THEMES = {
      anthracite: {   // black & gold — the default
        faceHi: '#23271c', faceMid: '#13160d', faceLo: '#05060a',
        guilLight: 0.055, guilDark: 0.42,
        num: '#D4AF37', numRed: '#ff4a3d',
        tickMaj: '#D4AF37', tickMin: 'rgba(242,196,31,.42)',
        label: 'rgba(246,211,58,.9)',
        redline: '#a3121e', redlineEdge: 'rgba(255,64,48,.4)',
        drum: '#10120a', drumLo: '#2c2f1f', drumText: '#D4AF37',
        drumTen: '#0c0d06', drumTenText: '#ffd94a',
        odoA: '#33290a', odoB: '#0f100b', odoC: '#85701c',
        needle: ['#8a6305', '#d9a614', '#ffd23f', '#c8940f', '#7a5c06'],
        needleHot: ['#7c0b12', '#d92121', '#ff6a58', '#c81623', '#7d0c13'],
        emblem: '246,217,72',
        hubHi: '#3a3418', hubMid: '#141208', hubLo: '#050502', hubRing: 'rgba(247,213,64,.9)'
      },
      champagne: {
        faceHi: '#faf6ec', faceMid: '#e7e0d0', faceLo: '#b4a992',
        guilLight: 0.55, guilDark: 0.085,
        num: '#242830', numRed: '#9d1019',
        tickMaj: '#2b3037', tickMin: 'rgba(40,45,52,.55)',
        label: 'rgba(35,40,46,.82)',
        redline: '#9d1119', redlineEdge: 'rgba(160,20,25,.3)',
        drum: '#f8f4ea', drumLo: '#c0b7a5', drumText: '#1a1d21',
        drumTen: '#fcf7eb', drumTenText: '#a3121b',
        odoA: '#f7f9fb', odoB: '#939ba3', odoC: '#e0e5ea',
        needle: ['#7c0b12', '#d92121', '#ff6a58', '#c81623', '#7d0c13'],
        needleHot: ['#7c0b12', '#d92121', '#ff6a58', '#c81623', '#7d0c13'],
        emblem: '235,241,247'
      }
    };
    var themeKey = 'anthracite';

    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (window.matchMedia) {
      var mqRM = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onRM = function (e) { reduceMotion = e.matches; };
      if (mqRM.addEventListener) mqRM.addEventListener('change', onRM);
      else if (mqRM.addListener) mqRM.addListener(onRM);
    }

    function drawEmblem(ctx, cx, cy, s, base) {
      base = base || '235,241,247';
      ctx.save();
      ctx.lineCap = 'round';
      // outer datum ring
      ctx.strokeStyle = 'rgba(' + base + ',.9)';
      ctx.lineWidth = Math.max(1, s * 0.055);
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.56, 0, TAU); ctx.stroke();
      // fine inner ring (machined)
      ctx.strokeStyle = 'rgba(' + base + ',.4)';
      ctx.lineWidth = Math.max(1, s * 0.024);
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.36, 0, TAU); ctx.stroke();
      // crosshair registration ticks (plus shape)
      ctx.strokeStyle = 'rgba(' + base + ',.9)';
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8,  cy); ctx.lineTo(cx - s * 0.30, cy);
      ctx.moveTo(cx + s * 0.30, cy); ctx.lineTo(cx + s * 0.8,  cy);
      ctx.moveTo(cx, cy - s * 0.8);  ctx.lineTo(cx, cy - s * 0.30);
      ctx.moveTo(cx, cy + s * 0.30); ctx.lineTo(cx, cy + s * 0.8);
      ctx.stroke();
      // serif D over the reference mark
      ctx.font = '700 ' + (s * 0.92).toFixed(1) + 'px "Palatino Linotype", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(' + base + ',.98)';
      ctx.fillText('D', cx, cy + s * 0.04);
      ctx.restore();
    }

    function Gauge(canvas, cfg) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.cfg = cfg;
      this.face = document.createElement('canvas');
      this.overlay = document.createElement('canvas');
      this.ring = document.createElement('canvas');   // rotating chapter ring
      this.ringAngle = 0;
      this.size = 0; this.dpr = 1;
      this.val = cfg.start;   // displayed (spring) value
      this.target = cfg.start;
      this.vel = 0;
      this.direct = false;
      var self = this;
      var handleResize = function () {
        self.resize();
        if (self.onResize) self.onResize();
      };
      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(handleResize);
        this._ro.observe(canvas);
      } else {
        window.addEventListener('resize', handleResize);
      }
      this.resize();
    }

    Gauge.prototype.angleFor = function (v) {
      var t = (v - this.cfg.start) / (this.cfg.end - this.cfg.start);
      return this.cfg.a0 + t * this.cfg.sweep;
    };

    Gauge.prototype.resize = function () {
      var w = this.cv.clientWidth || (this.cv.parentElement && this.cv.parentElement.clientWidth) || 300;
      var s = Math.max(120, Math.round(w));
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      if (s === this.size && dpr === this.dpr) return;
      this.size = s; this.dpr = dpr;
      var px = Math.round(s * dpr);
      [this.cv, this.face, this.overlay, this.ring].forEach(function (c) {
        c.width = px; c.height = px;
      });
      this.geom();
      this.buildFace();
      this.buildOverlay();
      this.buildRing();
    };

    Gauge.prototype.geom = function () {
      var S = this.size;
      this.S = S;
      this.cx = S / 2;
      this.cy = S / 2;
      this.outerR = S * 0.5 - 1;
      this.faceR = this.outerR * 0.855;
      this.rTickIn = this.faceR * 0.74;
      this.rTickOut = this.faceR * 0.90;
    };

    Gauge.prototype.faceFont = function (size) {
      return '600 ' + size.toFixed(1) + 'px "Palatino Linotype", "Book Antiqua", Georgia, serif';
    };

    /* ---- Mileage Spine instrument: flat obsidian face, hairline rim, no chrome, glass or shadow ---- */
    var SP = {
      rim: '#121316', face: '#08090A', hair: '#24262E', hair2: '#2E3039',
      white: '#FFFFFF', secondary: '#A1A1AA', muted: '#8A8A93',
      gold: '#FFFFFF', crimson: '#E06C75', tile: '#181A1F', ink: '#08090A'
    };
    var DISPLAY = '"Archivo", system-ui, sans-serif';
    var FIGURES = '"IBM Plex Mono", ui-monospace, monospace';

    Gauge.prototype.buildFace = function () {
      var f = this.face.getContext('2d');
      var S = this.S, cx = this.cx, cy = this.cy;
      var outerR = this.outerR, faceR = this.faceR, cfg = this.cfg;
      this.th = THEMES[themeKey];

      f.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      f.clearRect(0, 0, S, S);

      // rim and face: two flat discs and two hairlines
      f.beginPath(); f.arc(cx, cy, outerR, 0, TAU); f.fillStyle = SP.rim; f.fill();
      f.lineWidth = 1; f.strokeStyle = SP.hair; f.stroke();
      f.beginPath(); f.arc(cx, cy, faceR, 0, TAU); f.fillStyle = SP.face; f.fill();
      f.strokeStyle = SP.hair2; f.stroke();

      // redline: a thin crimson arc on the outer edge of the scale
      if (cfg.redline != null) {
        f.beginPath();
        f.arc(cx, cy, this.rTickOut + faceR * 0.025, this.angleFor(cfg.redline), this.angleFor(cfg.end));
        f.strokeStyle = SP.crimson; f.lineWidth = Math.max(2, faceR * 0.012); f.lineCap = 'butt'; f.stroke();
      }

      // ticks
      function isMultiple(v, step) { return Math.abs(v / step - Math.round(v / step)) < 1e-6; }
      f.lineCap = 'butt';
      for (var v = cfg.start; v <= cfg.end + 1e-6; v += cfg.minor) {
        var maj = isMultiple(v, cfg.major), mid = !maj && isMultiple(v, cfg.mid);
        var ang = this.angleFor(v), ca = Math.cos(ang), sa = Math.sin(ang);
        var r1 = maj ? this.rTickIn : (mid ? this.rTickIn + faceR * 0.06 : this.rTickOut - faceR * 0.04);
        var r2 = this.rTickOut;
        var inRed = (cfg.redline != null && v >= cfg.redline);
        f.beginPath();
        f.moveTo(cx + ca * r1, cy + sa * r1); f.lineTo(cx + ca * r2, cy + sa * r2);
        f.strokeStyle = inRed ? SP.crimson : (maj ? SP.white : (mid ? SP.secondary : SP.muted));
        f.lineWidth = maj ? 2 : 1;
        f.stroke();
      }

      // numerals
      var numR = cfg.numRadius * faceR, numSize = cfg.numSize * faceR * 0.82;
      f.font = '600 ' + numSize.toFixed(1) + 'px ' + DISPLAY;
      f.textAlign = 'center'; f.textBaseline = 'middle';
      for (var nv = cfg.start; nv <= cfg.end + 1e-6; nv += cfg.major) {
        var na = this.angleFor(nv);
        var red = (cfg.redline != null && nv >= cfg.redline - 1e-6);
        f.fillStyle = red ? SP.crimson : SP.white;
        f.fillText(String(Math.round(nv / cfg.numDiv)), cx + Math.cos(na) * numR, cy + Math.sin(na) * numR);
      }

      // small label under the hub
      var lbl = faceR * 0.06;
      f.font = '500 ' + lbl.toFixed(1) + 'px ' + FIGURES;
      f.fillStyle = SP.muted;
      spaced(f, 'RPM × 1000', cx, cy + faceR * 0.36, lbl * 0.22);
    };

    /* ---- hub: one flat disc with a gold centre ---- */
    Gauge.prototype.buildOverlay = function () {
      var o = this.overlay.getContext('2d');
      var S = this.S, cx = this.cx, cy = this.cy, faceR = this.faceR;
      o.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      o.clearRect(0, 0, S, S);
      var r = faceR * 0.085;
      o.beginPath(); o.arc(cx, cy, r, 0, TAU); o.fillStyle = SP.tile; o.fill();
      o.lineWidth = 1; o.strokeStyle = SP.hair2; o.stroke();
      o.beginPath(); o.arc(cx, cy, r * 0.32, 0, TAU); o.fillStyle = SP.gold; o.fill();
    };

    /* ---- rotating chapter ring: hairline minute ticks ---- */
    Gauge.prototype.buildRing = function () {
      var r = this.ring.getContext('2d');
      var S = this.S, cx = this.cx, cy = this.cy, faceR = this.faceR, cfg = this.cfg;
      r.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      r.clearRect(0, 0, S, S);
      if (!cfg.mantraK) return;
      var rad = faceR * cfg.mantraK;
      r.lineCap = 'butt';
      for (var d = 0; d < 360; d += 3) {
        var ta = d2r(d), maj = (d % 30 === 0);
        var t0 = rad + faceR * 0.085, t1 = t0 + faceR * (maj ? 0.03 : 0.013);
        r.beginPath();
        r.moveTo(cx + Math.cos(ta) * t0, cy + Math.sin(ta) * t0);
        r.lineTo(cx + Math.cos(ta) * t1, cy + Math.sin(ta) * t1);
        r.strokeStyle = maj ? SP.muted : SP.hair2; r.lineWidth = 1; r.stroke();
      }
    };

    /* ---- odometer: separate digit tiles, leading zeros muted, the newest digit inverted ---- */
    Gauge.prototype.drawOdometer = function (ctx, seconds) {
      var faceR = this.faceR, cx = this.cx, cy = this.cy;
      var cells = 6, gap = faceR * 0.018;
      var cw = faceR * 0.105, h = faceR * 0.15;
      var w = cells * cw + (cells - 1) * gap;
      var x = cx - w / 2, y = cy + faceR * (this.cfg.odoK || 0.6) - h / 2;
      var total = Math.max(0, Math.floor(Math.min(seconds || 0, 359999)));
      var digits = pad2(Math.floor(total / 3600)) + pad2(Math.floor(total / 60) % 60) + pad2(total % 60);
      var firstSig = digits.search(/[1-9]/); if (firstSig < 0) firstSig = cells - 1;
      ctx.font = '500 ' + (h * 0.66).toFixed(1) + 'px ' + FIGURES;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var i = 0; i < cells; i++) {
        var tx = x + i * (cw + gap), last = (i === cells - 1);
        roundRect(ctx, tx, y, cw, h, Math.min(6, faceR * 0.02));
        ctx.fillStyle = last ? SP.white : SP.tile; ctx.fill();
        if (!last) { ctx.lineWidth = 1; ctx.strokeStyle = SP.hair2; ctx.stroke(); }
        ctx.fillStyle = last ? SP.ink : (i < firstSig ? SP.muted : SP.white);
        ctx.fillText(digits.charAt(i), tx + cw / 2, y + h / 2 + h * 0.03);
      }
    };

    /* ---- needle: one solid gold blade, crimson in the red zone ---- */
    Gauge.prototype.drawNeedle = function (ctx) {
      var cfg = this.cfg, cx = this.cx, cy = this.cy, faceR = this.faceR;
      var span = cfg.end - cfg.start;
      var a = this.angleFor(clamp(this.val, cfg.start - span * 0.12, cfg.start + span * 1.75));
      var L = faceR * 0.82, w = faceR * 0.022, tail = faceR * 0.16;
      var hot = this.val >= (cfg.redline != null ? cfg.redline : 1e9);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -L); ctx.lineTo(w, 0); ctx.lineTo(w * 0.7, tail);
      ctx.lineTo(-w * 0.7, tail); ctx.lineTo(-w, 0); ctx.closePath();
      ctx.fillStyle = hot ? SP.crimson : SP.gold;
      ctx.fill();
      ctx.restore();
    };

    /* ---- per-frame ---- */
    Gauge.prototype.step = function (dt) {
      if (this.direct) { this.val = this.target; this.vel = 0; return; }
      // lightly damped spring: the needle whips past its mark and rings down,
      // like a clock hand loosed from its axle. Sub-stepped for stability.
      var k = 340, damp = reduceMotion ? 42 : 11;
      var h = 1 / 240;
      var n = Math.max(1, Math.min(16, Math.ceil(dt / h)));
      var step = dt / n;
      for (var i = 0; i < n; i++) {
        this.vel += (this.target - this.val) * k * step - this.vel * damp * step;
        this.val += this.vel * step;
      }
      var span = this.cfg.end - this.cfg.start;
      var lo = this.cfg.start - span * 0.12, hi = this.cfg.start + span * 1.75;
      if (this.val < lo) { this.val = lo; this.vel = 0; }
      if (this.val > hi) { this.val = hi; this.vel = 0; }
    };

    // rotate the chapter ring — one full turn per `revsPerTurn` engine revolutions
    Gauge.prototype.spin = function (dt, revsPerSec, dir) {
      if (!this.cfg.mantraK) return;
      var rate = Math.min(150, Math.max(0, revsPerSec));
      this.ringAngle += dir * (rate / 540) * TAU * dt;
      if (this.ringAngle > TAU) this.ringAngle -= TAU;
      if (this.ringAngle < -TAU) this.ringAngle += TAU;
    };

    Gauge.prototype.render = function (odoValue, odoTest) {
      var ctx = this.ctx, S = this.S, cx = this.cx, cy = this.cy;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      ctx.drawImage(this.face, 0, 0, S, S);
      // rotating chapter ring (text-free), under the needle
      if (this.cfg.mantraK) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.ringAngle);
        ctx.translate(-cx, -cy);
        ctx.drawImage(this.ring, 0, 0, S, S);
        ctx.restore();
      }
      if (this.cfg.odometer) this.drawOdometer(ctx, odoValue);
      this.drawNeedle(ctx);
      ctx.drawImage(this.overlay, 0, 0, S, S);
    };

  /* ================================================================
     Dial only: hold REV, release, settle. No drivetrain, no readouts.
     ================================================================ */
  var canvas = document.getElementById('instrument-canvas');
  var rev = document.getElementById('instrument-rev');
  if (!canvas || !rev) return;

  var tach = new Gauge(canvas, {
    start: 0, end: 8000, major: 1000, mid: 500, minor: 100, numDiv: 1000,
    a0: d2r(135), sweep: d2r(270), redline: 6800,
    numRadius: 0.64, numSize: 0.145,
    wordmark: false, wordmarkK: 0.28, label: '', labelK: 0.50, labelSize: 0.072,
    mantraK: 0.40,
    odometer: true, odoK: 0.645, odoCaption: false, odoLabelK: 0.762
  });

  var REV_TARGET = 7250;
  var state = { rpm: 0, rev: false, seconds: 0 };
  var raf = 0;
  var last = 0;
  var cardVisible = false;
  var paint = function () { tach.render(state.seconds, false); };
  tach.onResize = paint;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { tach.size = 0; tach.resize(); paint(); });

  tach.val = 0;
  tach.target = 0;
  paint();

  var lastTime = performance.now();
  var timeTimer = 0;
  function startTimer() {
    lastTime = performance.now();
    if (timeTimer) return;
    timeTimer = setInterval(function () {
      var now = performance.now();
      if (!document.hidden) state.seconds += (now - lastTime) / 1000;
      lastTime = now;
      if (cardVisible) paint();
    }, 1000);
  }
  function stopTimer() {
    if (timeTimer) {
      clearInterval(timeTimer);
      timeTimer = 0;
    }
  }
  startTimer();

  function frame(now) {
    var dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;

    var target = state.rev ? REV_TARGET : 0;
    var rate = state.rev ? 9 : 4.5;
    state.rpm += (target - state.rpm) * Math.min(1, dt * rate);
    if (!state.rev && state.rpm < 0.5) state.rpm = 0;

    tach.target = state.rpm;
    tach.step(dt);
    tach.spin(dt, reduceMotion ? 0 : state.rpm / 60, 1);
    paint();

    if (!state.rev && Math.abs(tach.val) < 0.6 && Math.abs(tach.vel) < 0.6) {
      tach.val = 0;
      tach.vel = 0;
      tach.target = 0;
      paint();
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function press(e) {
    if (e && e.pointerId != null && rev.setPointerCapture) {
      try { rev.setPointerCapture(e.pointerId); } catch (x) {}
    }
    state.rev = true;
    rev.classList.add('down');
    kick();
  }

  function release() {
    if (!state.rev) return;
    state.rev = false;
    rev.classList.remove('down');
    kick();
  }

  rev.addEventListener('pointerdown', press);
  rev.addEventListener('pointerup', release);
  rev.addEventListener('pointercancel', release);
  rev.addEventListener('lostpointercapture', release);
  window.addEventListener('pointerup', release);
  rev.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  rev.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      press();
    }
  });
  rev.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      release();
    }
  });
  rev.addEventListener('blur', release);
  window.addEventListener('blur', release);

  /* Keep the floating back-to-top key off the instrument face. */
  var card = document.getElementById('instrument');
  var topBtn = document.getElementById('top');
  if (card && topBtn && typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (visible && !cardVisible) paint();
      cardVisible = visible;
      topBtn.classList.toggle('instrument-near', visible);
    }, { threshold: 0.35 }).observe(card);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      release();
      stopTimer();
      if (raf) {
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        raf = 0;
      }
    } else {
      startTimer();
      if (cardVisible) paint();
      if (!state.rev && Math.abs(tach.val) > 0.5) kick();
    }
  });

  paint();

})();
