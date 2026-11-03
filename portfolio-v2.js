/* ============================================================
   portfolio-v2.js — Vaishnav Deshmukh Portfolio
   Vanilla JS: cursor, navbar, work preview, clock, nav, scroll
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Custom Cursor ──────────────────────────────────────── */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (dot && ring && !('ontouchstart' in window)) {
    let mx = 0, my = 0;
    let rx = 0, ry = 0;
    let raf;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    function animateRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      raf = requestAnimationFrame(animateRing);
    }
    animateRing();

    document.addEventListener('mouseleave', () => {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    });
  } else if (dot && ring) {
    // Hide cursors on touch devices
    dot.style.display  = 'none';
    ring.style.display = 'none';
  }

  /* ── 2. Navbar Scroll Effect ───────────────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ── 3. Mobile Nav Toggle ──────────────────────────────────── */
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── 4. Smooth Scroll for Anchor Links ─────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 64; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── 5. Work Row — Floating Image Preview ──────────────────── */
  const preview = document.getElementById('work-preview');
  const previewImg = preview ? preview.querySelector('img') : null;

  if (preview && previewImg) {
    let currentRow = null;

    document.querySelectorAll('.work-row[data-preview]').forEach(row => {
      row.addEventListener('mouseenter', (e) => {
        const src = row.dataset.preview;
        if (src) {
          previewImg.src = src;
          preview.classList.add('visible');
          currentRow = row;
        }
      });

      row.addEventListener('mouseleave', () => {
        preview.classList.remove('visible');
        currentRow = null;
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (currentRow) {
        const x = e.clientX + 24;
        const y = e.clientY - 80;
        const pw = 240, ph = 160;
        const vw = window.innerWidth, vh = window.innerHeight;
        preview.style.left = Math.min(x, vw - pw - 16) + 'px';
        preview.style.top  = Math.max(8, Math.min(y, vh - ph - 8)) + 'px';
      }
    });
  }

  /* ── 6. London Time Clock ──────────────────────────────────── */
  const timeEl = document.getElementById('london-time');
  if (timeEl) {
    function updateTime() {
      const now = new Date();
      const str = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      timeEl.textContent = 'London ' + str;
    }
    updateTime();
    setInterval(updateTime, 1000);
  }

  /* ── 7. Intersection Observer — Fade-up Animations ─────────── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => io.observe(el));
  } else {
    // Fallback: show all
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ── 8. Duplicate ticker track for seamless loop ────────────── */
  const tickerTrack = document.querySelector('.hero-ticker-track');
  if (tickerTrack) {
    const clone = tickerTrack.cloneNode(true);
    tickerTrack.parentElement.appendChild(clone);
  }

})();
