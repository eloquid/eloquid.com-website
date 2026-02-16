(() => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");

  const closeMenu = () => {
    if (!nav) return;
    nav.classList.remove("is-open");
    body.classList.remove("menu-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Apri menu");
    }
  };

  const openMenu = () => {
    if (!nav) return;
    nav.classList.add("is-open");
    body.classList.add("menu-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Chiudi menu");
    }
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!nav || !navToggle || !nav.classList.contains("is-open")) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && !nav.contains(target) && !navToggle.contains(target)) {
      closeMenu();
    }
  });

  const scrollOffset = () => (header ? header.offsetHeight + 10 : 84);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - scrollOffset();
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      history.replaceState(null, "", href);
      closeMenu();
    });
  });

  const backtotop = document.querySelector(".back-to-top");
  if (backtotop instanceof HTMLElement) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add("active");
      } else {
        backtotop.classList.remove("active");
      }
    };

    window.addEventListener("load", toggleBacktotop);
    document.addEventListener("scroll", toggleBacktotop, { passive: true });
  }

  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  const screenshotSlider = document.querySelector("[data-screenshot-slider]");
  if (screenshotSlider instanceof HTMLElement) {
    const track = screenshotSlider.querySelector(".slider-track");
    const stage = screenshotSlider.querySelector(".slider-stage");
    const slides = Array.from(screenshotSlider.querySelectorAll(".shot-card"));
    const prevButton = screenshotSlider.querySelector("[data-slider-prev]");
    const nextButton = screenshotSlider.querySelector("[data-slider-next]");
    const dots = Array.from(screenshotSlider.querySelectorAll(".slider-dot"));
    const controls = screenshotSlider.querySelector(".slider-controls");
    let currentIndex = 0;

    const applyIndex = (index) => {
      if (!slides.length || !(track instanceof HTMLElement)) {
        return;
      }

      const total = slides.length;
      track.style.width = `${total * 100}%`;
      currentIndex = (index + total) % total;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.tabIndex = isActive ? 0 : -1;
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    if (slides.length <= 1) {
      if (prevButton instanceof HTMLButtonElement) {
        prevButton.hidden = true;
      }
      if (nextButton instanceof HTMLButtonElement) {
        nextButton.hidden = true;
      }
      if (controls instanceof HTMLElement) {
        controls.hidden = true;
      }
    }

    prevButton?.addEventListener("click", () => applyIndex(currentIndex - 1));
    nextButton?.addEventListener("click", () => applyIndex(currentIndex + 1));

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => applyIndex(dotIndex));
    });

    stage?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        applyIndex(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        applyIndex(currentIndex + 1);
      }
    });

    applyIndex(0);
    window.addEventListener("resize", () => applyIndex(currentIndex));
  }

  const lightbox = document.getElementById("sgi-lightbox");
  if (lightbox) {
    const lightboxDialog = lightbox.querySelector(".lightbox-dialog");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxClose = lightbox.querySelector("[data-lightbox-close]");
    const triggers = document.querySelectorAll(".js-lightbox-trigger");

    let previousFocus = null;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const getFocusable = () => {
      if (!lightboxDialog) {
        return [];
      }
      return Array.from(lightboxDialog.querySelectorAll(focusableSelector)).filter((el) => {
        return el instanceof HTMLElement && !el.hasAttribute("hidden");
      });
    };

    const closeLightbox = () => {
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      body.classList.remove("lightbox-open");
      if (lightboxImage) {
        lightboxImage.removeAttribute("src");
        lightboxImage.alt = "";
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = "";
      }
      document.removeEventListener("keydown", handleLightboxKeydown);

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
      previousFocus = null;
    };

    const openLightbox = (trigger) => {
      if (!(trigger instanceof HTMLElement) || !lightboxDialog || !lightboxImage) {
        return;
      }

      previousFocus = trigger;
      const src = trigger.getAttribute("data-image") || "";
      const caption = trigger.getAttribute("data-caption") || "";
      const alt = trigger.getAttribute("data-alt") || caption;

      lightboxImage.src = src;
      lightboxImage.alt = alt;
      if (lightboxCaption) {
        lightboxCaption.textContent = caption;
      }

      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      body.classList.add("lightbox-open");

      document.addEventListener("keydown", handleLightboxKeydown);
      window.setTimeout(() => {
        if (lightboxClose instanceof HTMLElement) {
          lightboxClose.focus();
        } else {
          lightboxDialog.focus();
        }
      }, 0);
    };

    const handleLightboxKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => openLightbox(trigger));
    });

    lightbox.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Element && target.hasAttribute("data-lightbox-close")) {
        closeLightbox();
      }
    });

    lightboxClose?.addEventListener("click", closeLightbox);
  }

  const form = document.getElementById("sgi-contact-form");
  if (form instanceof HTMLFormElement) {
    const button = document.getElementById("sgi-submit");
    const status = document.getElementById("sgi-form-status");
    const defaultLabel = button?.textContent || "Richiedi demo";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (button instanceof HTMLButtonElement) {
        button.disabled = true;
        button.textContent = "Invio in corso...";
      }

      if (status) {
        status.textContent = "";
        status.classList.remove("is-success", "is-error");
      }

      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          form.reset();
          if (status) {
            status.textContent = "Grazie, richiesta inviata. Ti ricontatteremo al piu presto.";
            status.classList.add("is-success");
          }
        } else {
          let message = "Invio non riuscito. Riprova tra poco.";
          const payload = await response.json().catch(() => null);
          if (payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
            message = payload.errors.map((item) => item.message).join(" ");
          }
          if (status) {
            status.textContent = message;
            status.classList.add("is-error");
          }
        }
      } catch (_error) {
        if (status) {
          status.textContent = "Errore di rete. Controlla la connessione e riprova.";
          status.classList.add("is-error");
        }
      } finally {
        if (button instanceof HTMLButtonElement) {
          button.disabled = false;
          button.textContent = defaultLabel;
        }
      }
    });
  }
})();
