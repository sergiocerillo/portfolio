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
  const backToTop = document.getElementById('backToTop');
  const copyBtn = document.getElementById('copyEmailBtn');
  const copyLabel = document.getElementById('copyEmailLabel');
  const progressBar = document.getElementById('progressBar');

  /* ---------------------------------------------
     Galerias opcionais de imagens dos cases
     Basta criar o arquivo com o nome indicado no
     HTML para ele aparecer automaticamente.
  --------------------------------------------- */
  document.querySelectorAll('[data-optional-gallery]').forEach((gallery) => {
    const figures = gallery.querySelectorAll('figure');
    figures.forEach((figure) => {
      const image = figure.querySelector('img');
      if (!image) return;

      const showGallery = () => gallery.classList.add('is-ready');
      const hideFigure = () => figure.remove();

      image.addEventListener('load', showGallery, { once: true });
      image.addEventListener('error', hideFigure, { once: true });

      if (image.complete) {
        if (image.naturalWidth > 0) showGallery();
        else hideFigure();
      }
    });
  });

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
    const setMenuState = (isOpen) => {
      navMenu.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    };

    navToggle.addEventListener('click', () => {
      setMenuState(!navMenu.classList.contains('is-open'));
    });
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        setMenuState(false);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
        setMenuState(false);
        navToggle.focus();
      }
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
     Filtro de projetos
  --------------------------------------------- */
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

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
