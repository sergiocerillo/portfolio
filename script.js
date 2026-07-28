(() => {
  'use strict';

  /* ---------------------------------------------
     Rede de segurança: se algo aqui quebrar, o
     conteúdo (.reveal) nunca deve ficar escondido.
     A classe .js no <html> já deixa tudo visível
     por padrão (ver style.css); isso aqui é uma
     segunda camada de proteção.
  --------------------------------------------- */
  window.addEventListener('error', () => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : (cb) => setTimeout(() => cb(Date.now()), 16);

  /* ---------------------------------------------
     Referências do DOM (todas no topo, para nunca
     haver uso de uma variável antes dela existir)
  --------------------------------------------- */
  const yearEl = document.getElementById('year');
  const navWrap = document.getElementById('navWrap');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav__menu a[href^="#"]');
  const revealEls = document.querySelectorAll('.reveal');
  const typedText = document.getElementById('typedText');
  const caret = document.getElementById('caret');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const filterEmpty = document.getElementById('filterEmpty');
  const skillBars = document.querySelectorAll('.skill-bar');
  const backToTop = document.getElementById('backToTop');
  const copyBtn = document.getElementById('copyEmailBtn');
  const copyLabel = document.getElementById('copyEmailLabel');
  const progressBar = document.getElementById('progressBar');

  /* ---------------------------------------------
     Ano no rodapé
  --------------------------------------------- */
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------
     Botão "voltar ao topo" (definido antes do
     onScroll, que depende dele)
  --------------------------------------------- */
  function toggleBackToTop() {
    if (!backToTop) return;
    backToTop.hidden = window.scrollY < 480;
  }
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------
     Nav: sombra ao rolar + menu mobile
  --------------------------------------------- */
  function onScroll() {
    if (navWrap) navWrap.classList.toggle('is-scrolled', window.scrollY > 8);
    toggleBackToTop();

    if (progressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------
     Nav: link ativo conforme a seção visível
  --------------------------------------------- */
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------------------------------------------
     Scroll reveal
  --------------------------------------------- */
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------------------------------------
     Hero: efeito de "digitação"
  --------------------------------------------- */
  if (typedText && !prefersReducedMotion) {
    const fullText = typedText.textContent.trim();
    typedText.textContent = '';
    let i = 0;

    const type = () => {
      if (i <= fullText.length) {
        typedText.textContent = fullText.slice(0, i);
        i++;
        setTimeout(type, 18);
      }
    };
    setTimeout(type, 400);
  } else if (caret) {
    caret.style.display = 'none';
  }

  /* ---------------------------------------------
     Skills: animação de barras de progresso
  --------------------------------------------- */
  function animateSkillBar(bar) {
    const level = parseInt(bar.dataset.level, 10) || 0;
    const fill = bar.querySelector('.skill-bar__fill');
    const pctEl = bar.querySelector('.skill-bar__pct');
    
    if (fill) {
      setTimeout(() => {
        fill.style.width = `${level}%`;
      }, 100);
    }

    if (!pctEl) return;

    if (prefersReducedMotion) {
      pctEl.textContent = `${level}%`;
      return;
    }

    const duration = 900;
    const start = performance.now ? performance.now() : Date.now();
    function step(ts) {
      const progress = Math.min(1, (ts - start) / duration);
      pctEl.textContent = `${Math.round(progress * level)}%`;
      if (progress < 1) raf(step);
    }
    raf(step);
  }

  if (skillBars.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      skillBars.forEach(animateSkillBar);
    } else {
      const skillObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateSkillBar(entry.target);
              skillObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      skillBars.forEach((bar) => skillObserver.observe(bar));
    }
  }

  /* ---------------------------------------------
     Filtro de projetos
  --------------------------------------------- */
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;
      let visibleCount = 0;

      projectCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.hidden = !match;
        if (match) visibleCount++;
      });

      if (filterEmpty) filterEmpty.hidden = visibleCount !== 0;
    });
  });

  /* ---------------------------------------------
     Copiar e-mail com feedback visual melhorado
  --------------------------------------------- */
  if (copyBtn && copyLabel) {
    const originalLabel = copyLabel.textContent;
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        copyLabel.textContent = '✓ E-mail copiado!';
        copyBtn.style.borderColor = 'var(--accent-2)';
        copyBtn.style.color = 'var(--accent-2)';
      } catch (err) {
        copyLabel.textContent = '✗ Erro ao copiar';
        window.location.href = `mailto:${email}`;
      }
      setTimeout(() => { 
        copyLabel.textContent = originalLabel;
        copyBtn.style.borderColor = '';
        copyBtn.style.color = '';
      }, 2200);
    });
  }

  /* ---------------------------------------------
     Estado inicial (chamado por último, com tudo
     já declarado e todos os listeners no lugar)
  --------------------------------------------- */
  onScroll();
})();
